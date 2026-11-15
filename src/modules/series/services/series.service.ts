import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Series } from '../entities/series.entity';
import { SeriesPost } from '../entities/series-post.entity';
import { Post } from '../../posts/entities/post.entity';
import { CreateSeriesDto } from '../dto/create-series.dto';
import { UpdateSeriesDto } from '../dto/update-series.dto';
import { generateUniqueSlug } from '@common/utils';
import { USER_ROLE } from '@modules/user-roles/entities/user-role.entity';

@Injectable()
export class SeriesService {
	constructor(
		@InjectRepository(Series)
		private readonly seriesRepo: Repository<Series>,
		@InjectRepository(SeriesPost)
		private readonly seriesPostRepo: Repository<SeriesPost>,
		@InjectRepository(Post)
		private readonly postRepo: Repository<Post>,
	) {}

	async create(dto: CreateSeriesDto, authorId: string): Promise<Series> {
		const slug = dto.slug
			? await this.ensureUniqueSlug(dto.slug)
			: await this.generateSlug(dto.title);

		const series = this.seriesRepo.create({
			...dto,
			slug,
			authorId,
			postCount: 0,
		});

		return this.seriesRepo.save(series);
	}

	async update(
		id: string,
		dto: UpdateSeriesDto,
		currentUser: { id: string; role?: any },
	): Promise<Series> {
		const series = await this.seriesRepo.findOneBy({ id });
		if (!series) {
			throw new NotFoundException(`Series #${id} not found`);
		}

		this.assertOwnershipOrAdmin(series, currentUser);

		let slug = series.slug;
		if (dto.slug && dto.slug !== series.slug) {
			slug = await this.ensureUniqueSlug(dto.slug, id);
		} else if (dto.title && dto.title !== series.title && !dto.slug) {
			slug = await this.generateSlug(dto.title, id);
		}

		Object.assign(series, { ...dto, slug });
		return this.seriesRepo.save(series);
	}

	async remove(
		id: string,
		currentUser: { id: string; role?: any },
	): Promise<void> {
		const series = await this.seriesRepo.findOneBy({ id });
		if (!series) {
			throw new NotFoundException(`Series #${id} not found`);
		}

		this.assertOwnershipOrAdmin(series, currentUser);
		await this.seriesRepo.softRemove(series);
	}

	async findMySeries(authorId: string): Promise<Series[]> {
		return this.seriesRepo.find({
			where: { authorId },
			order: { created_at: 'DESC' },
		});
	}

	async findBySlug(slug: string) {
		const series = await this.seriesRepo
			.createQueryBuilder('series')
			.leftJoinAndSelect('series.author', 'author')
			.leftJoinAndSelect('series.seriesPosts', 'seriesPost')
			.leftJoinAndSelect('seriesPost.post', 'post')
			.where('series.slug = :slug', { slug })
			.orderBy('seriesPost.order', 'ASC')
			.getOne();

		if (!series) {
			throw new NotFoundException(`Series with slug "${slug}" not found`);
		}

		const posts = (series.seriesPosts || [])
			.map((sp) => ({
				id: sp.post?.id,
				title: sp.post?.title,
				slug: sp.post?.slug,
				excerpt: sp.post?.excerpt,
				coverImage: sp.post?.coverImage,
				readingTime: sp.post?.readingTime,
				order: sp.order,
				publishedAt: sp.post?.publishedAt,
			}))
			.filter((p) => Boolean(p.id));

		return {
			id: series.id,
			title: series.title,
			slug: series.slug,
			description: series.description,
			coverImage: series.coverImage,
			postCount: posts.length,
			author: {
				id: series.author?.id,
				fullName: series.author?.fullName,
				avatarUrl: series.author?.avatarUrl,
			},
			posts,
		};
	}

	async getSeriesPostProgress(seriesSlug: string, postSlug: string) {
		const seriesData = await this.findBySlug(seriesSlug);
		const posts = seriesData.posts;
		const currentIndex = posts.findIndex((p) => p.slug === postSlug);

		if (currentIndex === -1) {
			throw new NotFoundException(
				`Post "${postSlug}" does not belong to series "${seriesSlug}"`,
			);
		}

		const currentPost = posts[currentIndex];
		const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
		const nextPost =
			currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;

		return {
			series: {
				id: seriesData.id,
				title: seriesData.title,
				slug: seriesData.slug,
			},
			currentOrder: currentIndex + 1,
			totalPosts: posts.length,
			currentPost,
			prevPost: prevPost ? { title: prevPost.title, slug: prevPost.slug } : null,
			nextPost: nextPost ? { title: nextPost.title, slug: nextPost.slug } : null,
			posts,
		};
	}

	async addPostToSeries(
		seriesId: string,
		postId: string,
		order?: number,
		currentUser?: { id: string; role?: any },
	): Promise<SeriesPost> {
		const series = await this.seriesRepo.findOneBy({ id: seriesId });
		if (!series) {
			throw new NotFoundException(`Series #${seriesId} not found`);
		}
		if (currentUser) {
			this.assertOwnershipOrAdmin(series, currentUser);
		}

		const post = await this.postRepo.findOneBy({ id: postId });
		if (!post) {
			throw new NotFoundException(`Post #${postId} not found`);
		}

		let targetOrder = order;
		if (targetOrder === undefined || targetOrder === null) {
			const maxOrder = await this.seriesPostRepo
				.createQueryBuilder('sp')
				.where('sp.seriesId = :seriesId', { seriesId })
				.select('MAX(sp.order)', 'max')
				.getRawOne();
			targetOrder = (maxOrder?.max ?? 0) + 1;
		}

		let sp = await this.seriesPostRepo.findOneBy({ seriesId, postId });
		if (sp) {
			sp.order = targetOrder;
		} else {
			sp = this.seriesPostRepo.create({
				seriesId,
				postId,
				order: targetOrder,
			});
			await this.seriesRepo.increment({ id: seriesId }, 'postCount', 1);
		}

		return this.seriesPostRepo.save(sp);
	}

	async removePostFromSeries(
		seriesId: string,
		postId: string,
		currentUser?: { id: string; role?: any },
	): Promise<void> {
		const series = await this.seriesRepo.findOneBy({ id: seriesId });
		if (!series) {
			throw new NotFoundException(`Series #${seriesId} not found`);
		}
		if (currentUser) {
			this.assertOwnershipOrAdmin(series, currentUser);
		}

		const sp = await this.seriesPostRepo.findOneBy({ seriesId, postId });
		if (sp) {
			await this.seriesPostRepo.remove(sp);
			await this.seriesRepo
				.createQueryBuilder()
				.update(Series)
				.set({
					postCount: () => 'GREATEST(0, "postCount" - 1)',
				})
				.where('id = :id', { id: seriesId })
				.execute();
		}
	}

	async reorderPosts(
		seriesId: string,
		orderedPostIds: string[],
		currentUser?: { id: string; role?: any },
	): Promise<void> {
		const series = await this.seriesRepo.findOneBy({ id: seriesId });
		if (!series) {
			throw new NotFoundException(`Series #${seriesId} not found`);
		}
		if (currentUser) {
			this.assertOwnershipOrAdmin(series, currentUser);
		}

		for (let i = 0; i < orderedPostIds.length; i += 1) {
			const postId = orderedPostIds[i];
			await this.seriesPostRepo.update(
				{ seriesId, postId },
				{ order: i + 1 },
			);
		}
	}

	private assertOwnershipOrAdmin(
		series: Series,
		user: { id: string; role?: any },
	): void {
		const roleName =
			typeof user.role === 'object' ? user.role?.name : user.role;
		if (series.authorId !== user.id && roleName !== USER_ROLE.ADMIN) {
			throw new ForbiddenException('You can only manage your own series');
		}
	}

	private async generateSlug(title: string, excludeId?: string): Promise<string> {
		return generateUniqueSlug(title, async (s) => {
			const count = await this.seriesRepo.count({
				where: { slug: s },
			});
			return count > 0;
		});
	}

	private async ensureUniqueSlug(
		slug: string,
		excludeId?: string,
	): Promise<string> {
		const count = await this.seriesRepo.count({
			where: { slug },
		});
		if (count > 0) {
			throw new ConflictException(`Series slug "${slug}" already exists`);
		}
		return slug;
	}
}

