import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
	Optional,
} from '@nestjs/common';
import { EntityManager, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseServiceAbstract } from 'src/services/base/base.abstract.service';
import { Post } from '../entities/post.entity';
import { PostsRepositoryInterface } from '../interfaces/posts.interface';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { QueryPostDto } from '../dto/query-post.dto';
import { SearchPostDto } from '../dto/search-post.dto';
import { Category } from '../../categories/entities/category.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { User } from '../../users/entities/user.entity';
import { USER_ROLE } from '@modules/user-roles/entities/user-role.entity';
import { AppCacheService } from '@modules/shared/base/cache/app-cache.service';
import { AppCacheKeyBuilder } from '@modules/shared/base/cache/app-cache-key.builder';
import { calculateReadingTime, generateUniqueSlug } from '@common/utils';
import { PostLevel, PostStatus, NotificationType } from '@common/enums';
import { FindAllResponse } from 'src/types/common.type';
import { TagsService } from '../../tags/services/tags.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { FollowsService } from '../../follows/services/follows.service';
import { SocketService } from '../../socket/services/socket.service';

export const POSTS_CACHE_NAMESPACE = 'posts';
const POSTS_CACHE_TTL_MS = 30_000;

@Injectable()
export class PostsService extends BaseServiceAbstract<Post> {
	constructor(
		@Inject('PostsRepositoryInterface')
		private readonly postsRepository: PostsRepositoryInterface,
		@InjectRepository(Category)
		private readonly categoryRepository: Repository<Category>,
		@InjectRepository(Tag)
		private readonly tagRepository: Repository<Tag>,
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
		private readonly tagsService: TagsService,
		@Optional() private readonly cache?: AppCacheService,
		@Optional() private readonly notificationsService?: NotificationsService,
		@Optional() private readonly followsService?: FollowsService,
		@Optional() private readonly socketService?: SocketService,
	) {
		super(postsRepository);
	}

	override async create(
		dto: CreatePostDto & { authorId?: string },
		authorId?: string,
	): Promise<Post> {
		const effectiveAuthorId = authorId || dto.authorId;
		if (!effectiveAuthorId) {
			throw new BadRequestException('authorId is required to create a post');
		}

		const slug = dto.slug
			? await this.ensureUniqueSlug(dto.slug)
			: await this.generateSlug(dto.title);

		const readingTime = calculateReadingTime(dto.content);
		const tags = await this.resolveTags(dto.tagIds, dto.tagNames);

		if (dto.categoryId) {
			await this.verifyCategory(dto.categoryId);
		}

		const post = await this.postsRepository.create({
			...dto,
			slug,
			readingTime,
			authorId: effectiveAuthorId,
			status: PostStatus.DRAFT,
			level: dto.level || PostLevel.BASIC,
			tags,
		});

		await this.cache?.invalidate(POSTS_CACHE_NAMESPACE);
		return post;
	}

	async createInTransaction(
		dto: CreatePostDto,
		authorId: string,
		manager: EntityManager,
	): Promise<Post> {
		const postRepo = manager.getRepository(Post);
		const slug = dto.slug
			? await this.ensureUniqueSlug(dto.slug)
			: await this.generateSlug(dto.title);

		const readingTime = calculateReadingTime(dto.content);
		const tags = await this.resolveTagsInTransaction(
			dto.tagIds,
			dto.tagNames,
			manager,
		);

		if (dto.categoryId) {
			const catExists = await manager
				.getRepository(Category)
				.findOneBy({ id: dto.categoryId });
			if (!catExists) {
				throw new NotFoundException(`Category #${dto.categoryId} not found`);
			}
		}

		const post = postRepo.create({
			...dto,
			slug,
			readingTime,
			authorId,
			status: PostStatus.DRAFT,
			level: dto.level || PostLevel.BASIC,
			tags,
		});

		const saved = await postRepo.save(post);
		await this.cache?.invalidate(POSTS_CACHE_NAMESPACE);
		return saved;
	}

	override async update(
		id: string,
		dto: UpdatePostDto,
		currentUser?: { id: string; role?: any },
	): Promise<Post> {
		const post = await this.postsRepository.findOneById(id, {
			relations: ['tags', 'category'],
		});
		if (!post) {
			throw new NotFoundException(`Post #${id} not found`);
		}

		if (currentUser) {
			this.assertOwnershipOrAdmin(post, currentUser);
		}

		let slug = post.slug;
		if (dto.slug && dto.slug !== post.slug) {
			slug = await this.ensureUniqueSlug(dto.slug, id);
		} else if (dto.title && dto.title !== post.title && !dto.slug) {
			slug = await this.generateSlug(dto.title, id);
		}

		let readingTime = post.readingTime;
		if (dto.content) {
			readingTime = calculateReadingTime(dto.content);
		}

		let tags = post.tags;
		if (dto.tagIds !== undefined || dto.tagNames !== undefined) {
			tags = await this.resolveTags(dto.tagIds, dto.tagNames);
		}

		if (dto.categoryId && dto.categoryId !== post.categoryId) {
			await this.verifyCategory(dto.categoryId);
		}

		const updated = await this.postsRepository.update(id, {
			...dto,
			slug,
			readingTime,
			tags,
		});

		await this.cache?.invalidate(POSTS_CACHE_NAMESPACE);
		return updated;
	}

	async updateInTransaction(
		id: string,
		dto: UpdatePostDto,
		currentUser: { id: string; role?: any },
		manager: EntityManager,
	): Promise<Post> {
		const postRepo = manager.getRepository(Post);
		const post = await postRepo.findOne({
			where: { id },
			relations: ['tags', 'category'],
		});
		if (!post) {
			throw new NotFoundException(`Post #${id} not found`);
		}

		this.assertOwnershipOrAdmin(post, currentUser);

		let slug = post.slug;
		if (dto.slug && dto.slug !== post.slug) {
			slug = await this.ensureUniqueSlug(dto.slug, id);
		} else if (dto.title && dto.title !== post.title && !dto.slug) {
			slug = await this.generateSlug(dto.title, id);
		}

		let readingTime = post.readingTime;
		if (dto.content) {
			readingTime = calculateReadingTime(dto.content);
		}

		if (dto.tagIds !== undefined || dto.tagNames !== undefined) {
			post.tags = await this.resolveTagsInTransaction(
				dto.tagIds,
				dto.tagNames,
				manager,
			);
		}

		if (dto.categoryId && dto.categoryId !== post.categoryId) {
			const cat = await manager
				.getRepository(Category)
				.findOneBy({ id: dto.categoryId });
			if (!cat) {
				throw new NotFoundException(`Category #${dto.categoryId} not found`);
			}
		}

		Object.assign(post, {
			...dto,
			slug,
			readingTime,
		});

		const saved = await postRepo.save(post);
		await this.cache?.invalidate(POSTS_CACHE_NAMESPACE);
		return saved;
	}

	async softDelete(
		id: string,
		currentUser: { id: string; role?: any },
	): Promise<boolean> {
		const post = await this.postsRepository.findOneById(id);
		if (!post) {
			throw new NotFoundException(`Post #${id} not found`);
		}
		this.assertOwnershipOrAdmin(post, currentUser);

		const wasPublished = post.status === PostStatus.PUBLISHED;
		const result = await this.postsRepository.softDelete(id);

		if (wasPublished) {
			await this.adjustCountsOnUnpublish(post.authorId, post.categoryId);
		}

		await this.cache?.invalidate(POSTS_CACHE_NAMESPACE);
		return result;
	}

	async softDeleteInTransaction(
		id: string,
		currentUser: { id: string; role?: any },
		manager: EntityManager,
	): Promise<void> {
		const postRepo = manager.getRepository(Post);
		const post = await postRepo.findOneBy({ id });
		if (!post) {
			throw new NotFoundException(`Post #${id} not found`);
		}
		this.assertOwnershipOrAdmin(post, currentUser);

		const wasPublished = post.status === PostStatus.PUBLISHED;
		await postRepo.softRemove(post);

		if (wasPublished) {
			await this.adjustCountsOnUnpublishInTransaction(
				post.authorId,
				post.categoryId,
				manager,
			);
		}

		await this.cache?.invalidate(POSTS_CACHE_NAMESPACE);
	}

	async restoreInTransaction(
		id: string,
		currentUser: { id: string; role?: any },
		manager: EntityManager,
	): Promise<Post> {
		const postRepo = manager.getRepository(Post);
		const post = await postRepo.findOne({
			where: { id },
			withDeleted: true,
		});
		if (!post) {
			throw new NotFoundException(`Post #${id} not found`);
		}
		this.assertOwnershipOrAdmin(post, currentUser);

		await postRepo.restore(id);
		post.deleted_at = null as any;

		if (post.status === PostStatus.PUBLISHED) {
			await this.adjustCountsOnPublishInTransaction(
				post.authorId,
				post.categoryId,
				manager,
			);
		}

		await this.cache?.invalidate(POSTS_CACHE_NAMESPACE);
		return post;
	}

	async submit(
		id: string,
		currentUser: { id: string; role?: any },
	): Promise<Post> {
		const post = await this.postsRepository.findOneById(id);
		if (!post) throw new NotFoundException(`Post #${id} not found`);
		this.assertOwnershipOrAdmin(post, currentUser);

		if (post.status !== PostStatus.DRAFT) {
			throw new BadRequestException('Only DRAFT posts can be submitted for review');
		}

		const updated = await this.postsRepository.update(id, {
			status: PostStatus.PENDING,
		});
		await this.cache?.invalidate(POSTS_CACHE_NAMESPACE);

		this.socketService?.emitToAdmins('new_notification', {
			type: NotificationType.POST_PENDING,
			title: 'Bài viết mới chờ duyệt',
			message: `Bài viết "${updated.title}" vừa được gửi chờ quản trị viên duyệt.`,
			data: { postId: updated.id, slug: updated.slug, authorId: updated.authorId },
			createdAt: new Date(),
		});

		return updated;
	}

	async publish(
		id: string,
		currentUser: { id: string; role?: any },
	): Promise<Post> {
		const post = await this.postsRepository.findOneById(id);
		if (!post) throw new NotFoundException(`Post #${id} not found`);
		this.assertOwnershipOrAdmin(post, currentUser);

		if (
			post.status !== PostStatus.DRAFT &&
			post.status !== PostStatus.PENDING
		) {
			throw new BadRequestException('Only DRAFT or PENDING posts can be published');
		}

		const updated = await this.postsRepository.update(id, {
			status: PostStatus.PUBLISHED,
			publishedAt: new Date(),
		});

		await this.adjustCountsOnPublish(post.authorId, post.categoryId);
		await this.cache?.invalidate(POSTS_CACHE_NAMESPACE);
		return updated;
	}

	async publishInTransaction(
		id: string,
		currentUser: { id: string; role?: any },
		manager: EntityManager,
	): Promise<Post> {
		const postRepo = manager.getRepository(Post);
		const post = await postRepo.findOneBy({ id });
		if (!post) throw new NotFoundException(`Post #${id} not found`);
		this.assertOwnershipOrAdmin(post, currentUser);

		if (
			post.status !== PostStatus.DRAFT &&
			post.status !== PostStatus.PENDING
		) {
			throw new BadRequestException('Only DRAFT or PENDING posts can be published');
		}

		post.status = PostStatus.PUBLISHED;
		post.publishedAt = new Date();
		const saved = await postRepo.save(post);

		await this.adjustCountsOnPublishInTransaction(
			post.authorId,
			post.categoryId,
			manager,
		);
		await this.cache?.invalidate(POSTS_CACHE_NAMESPACE);

		this.notifySubscribersOnPublish(saved).catch(() => {});

		return saved;
	}

	async archive(
		id: string,
		currentUser: { id: string; role?: any },
	): Promise<Post> {
		const post = await this.postsRepository.findOneById(id);
		if (!post) throw new NotFoundException(`Post #${id} not found`);
		this.assertOwnershipOrAdmin(post, currentUser);

		const wasPublished = post.status === PostStatus.PUBLISHED;
		const updated = await this.postsRepository.update(id, {
			status: PostStatus.ARCHIVED,
		});

		if (wasPublished) {
			await this.adjustCountsOnUnpublish(post.authorId, post.categoryId);
		}

		await this.cache?.invalidate(POSTS_CACHE_NAMESPACE);
		return updated;
	}

	async approveInTransaction(
		id: string,
		adminId: string,
		manager: EntityManager,
	): Promise<Post> {
		const postRepo = manager.getRepository(Post);
		const post = await postRepo.findOneBy({ id });
		if (!post) throw new NotFoundException(`Post #${id} not found`);

		if (post.status !== PostStatus.PENDING) {
			throw new BadRequestException('Only PENDING posts can be approved');
		}

		post.status = PostStatus.PUBLISHED;
		post.publishedAt = new Date();
		post.rejectReason = null;
		const saved = await postRepo.save(post);

		await this.adjustCountsOnPublishInTransaction(
			post.authorId,
			post.categoryId,
			manager,
		);
		await this.cache?.invalidate(POSTS_CACHE_NAMESPACE);

		this.notificationsService
			?.create({
				type: NotificationType.POST_APPROVED,
				title: 'Bài viết của bạn đã được duyệt',
				message: `Bài viết "${saved.title}" đã được duyệt và xuất bản.`,
				userId: saved.authorId,
				actorId: adminId,
				data: { postId: saved.id, slug: saved.slug },
			})
			.catch(() => {});

		this.notifySubscribersOnPublish(saved).catch(() => {});

		return saved;
	}

	async rejectInTransaction(
		id: string,
		adminId: string,
		reason: string,
		manager: EntityManager,
	): Promise<Post> {
		const postRepo = manager.getRepository(Post);
		const post = await postRepo.findOneBy({ id });
		if (!post) throw new NotFoundException(`Post #${id} not found`);

		if (post.status !== PostStatus.PENDING) {
			throw new BadRequestException('Only PENDING posts can be rejected');
		}

		post.status = PostStatus.DRAFT;
		post.rejectReason = reason;
		const saved = await postRepo.save(post);

		await this.cache?.invalidate(POSTS_CACHE_NAMESPACE);

		this.notificationsService
			?.create({
				type: NotificationType.POST_REJECTED,
				title: 'Bài viết bị từ chối duyệt',
				message: `Bài viết "${saved.title}" bị từ chối: ${reason}`,
				userId: saved.authorId,
				actorId: adminId,
				data: { postId: saved.id, slug: saved.slug, reason },
			})
			.catch(() => {});

		return saved;
	}

	private async notifySubscribersOnPublish(post: Post): Promise<void> {
		if (!this.notificationsService || !this.followsService) return;

		// 1. Notify author followers
		const followerIds = await this.followsService.getFollowerIds(post.authorId);
		for (const followerId of followerIds) {
			this.notificationsService
				.create({
					type: NotificationType.NEW_POST_FROM_FOLLOWING,
					title: 'Bài viết mới từ tác giả bạn theo dõi',
					message: `Tác giả vừa đăng bài viết mới: "${post.title}"`,
					userId: followerId,
					actorId: post.authorId,
					data: { postId: post.id, slug: post.slug },
				})
				.catch(() => {});
		}

		// 2. Notify category subscribers (excluding author and already notified followers)
		if (post.categoryId) {
			const subscriberIds = await this.followsService.getCategorySubscriberIds(post.categoryId);
			const notifiedSet = new Set(followerIds);
			notifiedSet.add(post.authorId);

			for (const subscriberId of subscriberIds) {
				if (!notifiedSet.has(subscriberId)) {
					this.notificationsService
						.create({
							type: NotificationType.NEW_POST_IN_CATEGORY,
							title: 'Bài viết mới trong danh mục bạn theo dõi',
							message: `Có bài viết mới: "${post.title}"`,
							userId: subscriberId,
							actorId: post.authorId,
							data: { postId: post.id, slug: post.slug, categoryId: post.categoryId },
						})
						.catch(() => {});
				}
			}
		}
	}

	async findPublic(query: QueryPostDto): Promise<FindAllResponse<Post>> {
		if (!this.cache) {
			return this.postsRepository.findPublic(query);
		}

		return this.cache.getOrSet(
			POSTS_CACHE_NAMESPACE,
			AppCacheKeyBuilder.build({
				route: '/posts',
				query: {
					offset: query.offset,
					limit: query.limit,
					categoryId: query.categoryId ?? '',
					tag: query.tag ?? '',
					level: query.level ?? '',
					search: query.search ?? '',
					sort: query.sort ?? 'newest',
					isFeatured: query.isFeatured ? '1' : '',
					isEditorsChoice: query.isEditorsChoice ? '1' : '',
				},
			}),
			POSTS_CACHE_TTL_MS,
			() => this.postsRepository.findPublic(query),
		);
	}

	async search(dto: SearchPostDto): Promise<FindAllResponse<Post>> {
		const limit = dto.limit || 10;
		const offset = dto.offset !== undefined
			? dto.offset
			: ((dto.page || 1) - 1) * limit;

		const query: QueryPostDto = {
			search: dto.q,
			limit,
			offset,
		};

		return this.findPublic(query);
	}

	async generateSitemapXml(baseUrl = 'https://blog.tech'): Promise<string> {
		const { items: posts } = await this.postsRepository.findPublic({
			limit: 1000,
			offset: 0,
		});

		const urls: string[] = [
			`  <url>\n    <loc>${baseUrl}</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
		];

		for (const post of posts) {
			const lastmod = (post.updated_at || post.publishedAt || new Date()).toISOString();
			urls.push(
				`  <url>\n    <loc>${baseUrl}/posts/${post.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
			);
		}

		return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
	}

	async findBySlug(slug: string): Promise<Post> {
		const post = await this.postsRepository.findBySlug(slug);
		if (!post || post.status !== PostStatus.PUBLISHED) {
			throw new NotFoundException(`Post with slug "${slug}" not found`);
		}

		// Fire-and-forget view count increment
		this.postsRepository.incrementView(post.id).catch(() => {});

		return post;
	}

	async findMyPosts(
		authorId: string,
		query: QueryPostDto,
	): Promise<FindAllResponse<Post>> {
		return this.postsRepository.findMyPosts(authorId, query);
	}

	async findMyPostById(id: string, authorId: string): Promise<Post> {
		const post = await this.postsRepository.findOneById(id, {
			relations: ['category', 'tags'],
		});
		if (!post) {
			throw new NotFoundException(`Post #${id} not found`);
		}
		if (post.authorId !== authorId) {
			throw new ForbiddenException('You do not own this post');
		}
		return post;
	}

	async findAllAdmin(query: QueryPostDto): Promise<FindAllResponse<Post>> {
		return this.postsRepository.findAllAdmin(query);
	}

	private assertOwnershipOrAdmin(
		post: Post,
		user: { id: string; role?: any },
	): void {
		const roleName =
			typeof user.role === 'object' ? user.role?.name : user.role;
		if (post.authorId !== user.id && roleName !== USER_ROLE.ADMIN) {
			throw new ForbiddenException('You can only manage your own posts');
		}
	}

	private async resolveTags(
		tagIds?: string[],
		tagNames?: string[],
	): Promise<Tag[]> {
		const tags: Tag[] = [];
		if (tagIds?.length) {
			const found = await this.tagRepository.find({
				where: { id: In(tagIds) },
			});
			tags.push(...found);
		}
		if (tagNames?.length) {
			const onTheFly = await this.tagsService.findOrCreateMany(tagNames);
			for (const t of onTheFly) {
				if (!tags.some((existing) => existing.id === t.id)) {
					tags.push(t);
				}
			}
		}
		return tags;
	}

	private async resolveTagsInTransaction(
		tagIds?: string[],
		tagNames?: string[],
		manager?: EntityManager,
	): Promise<Tag[]> {
		const tags: Tag[] = [];
		if (tagIds?.length) {
			const found = await manager.getRepository(Tag).find({
				where: { id: In(tagIds) },
			});
			tags.push(...found);
		}
		if (tagNames?.length) {
			const onTheFly = await this.tagsService.findOrCreateMany(
				tagNames,
				manager,
			);
			for (const t of onTheFly) {
				if (!tags.some((existing) => existing.id === t.id)) {
					tags.push(t);
				}
			}
		}
		return tags;
	}

	private async verifyCategory(categoryId: string): Promise<Category> {
		const category = await this.categoryRepository.findOneBy({
			id: categoryId,
		});
		if (!category) {
			throw new NotFoundException(`Category #${categoryId} not found`);
		}
		return category;
	}

	private async generateSlug(title: string, excludeId?: string): Promise<string> {
		return generateUniqueSlug(title, (s) =>
			this.postsRepository.checkSlugExists(s, excludeId),
		);
	}

	private async ensureUniqueSlug(
		slug: string,
		excludeId?: string,
	): Promise<string> {
		const exists = await this.postsRepository.checkSlugExists(slug, excludeId);
		if (exists) {
			throw new ConflictException(`Post slug "${slug}" is already taken`);
		}
		return slug;
	}

	private async adjustCountsOnPublish(
		authorId: string,
		categoryId?: string,
	): Promise<void> {
		await this.userRepository.increment({ id: authorId }, 'postCount', 1);
		if (categoryId) {
			await this.categoryRepository.increment(
				{ id: categoryId },
				'postCount',
				1,
			);
		}
	}

	private async adjustCountsOnUnpublish(
		authorId: string,
		categoryId?: string,
	): Promise<void> {
		await this.userRepository
			.createQueryBuilder()
			.update(User)
			.set({
				postCount: () => 'GREATEST(0, "postCount" - 1)',
			})
			.where('id = :id', { id: authorId })
			.execute();

		if (categoryId) {
			await this.categoryRepository
				.createQueryBuilder()
				.update(Category)
				.set({
					postCount: () => 'GREATEST(0, "postCount" - 1)',
				})
				.where('id = :id', { id: categoryId })
				.execute();
		}
	}

	private async adjustCountsOnPublishInTransaction(
		authorId: string,
		categoryId: string | undefined,
		manager: EntityManager,
	): Promise<void> {
		await manager
			.getRepository(User)
			.increment({ id: authorId }, 'postCount', 1);
		if (categoryId) {
			await manager
				.getRepository(Category)
				.increment({ id: categoryId }, 'postCount', 1);
		}
	}

	private async adjustCountsOnUnpublishInTransaction(
		authorId: string,
		categoryId: string | undefined,
		manager: EntityManager,
	): Promise<void> {
		await manager
			.getRepository(User)
			.createQueryBuilder()
			.update(User)
			.set({
				postCount: () => 'GREATEST(0, "postCount" - 1)',
			})
			.where('id = :id', { id: authorId })
			.execute();

		if (categoryId) {
			await manager
				.getRepository(Category)
				.createQueryBuilder()
				.update(Category)
				.set({
					postCount: () => 'GREATEST(0, "postCount" - 1)',
				})
				.where('id = :id', { id: categoryId })
				.execute();
		}
	}
}
