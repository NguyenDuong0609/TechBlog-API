import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Post } from '@modules/posts/entities/post.entity';
import { PostsRepositoryInterface } from '@modules/posts/interfaces/posts.interface';
import { QueryPostDto } from '@modules/posts/dto/query-post.dto';
import { BaseRepositoryAbstract } from './base/base.abstract.repository';
import { PostStatus } from '@common/enums';
import { FindAllResponse } from 'src/types/common.type';

@Injectable()
export class PostRepository
	extends BaseRepositoryAbstract<Post>
	implements PostsRepositoryInterface
{
	constructor(
		@InjectRepository(Post)
		private readonly postRepository: Repository<Post>,
	) {
		super(postRepository);
	}

	async findBySlug(slug: string): Promise<Post | null> {
		return this.postRepository
			.createQueryBuilder('post')
			.leftJoinAndSelect('post.author', 'author')
			.leftJoinAndSelect('post.category', 'category')
			.leftJoinAndSelect('post.tags', 'tags')
			.where('post.slug = :slug', { slug })
			.getOne();
	}

	async checkSlugExists(slug: string, excludeId?: string): Promise<boolean> {
		const query = this.postRepository
			.createQueryBuilder('post')
			.where('post.slug = :slug', { slug });

		if (excludeId) {
			query.andWhere('post.id != :excludeId', { excludeId });
		}

		const count = await query.getCount();
		return count > 0;
	}

	async findPublic(query: QueryPostDto): Promise<FindAllResponse<Post>> {
		const qb = this.postRepository
			.createQueryBuilder('post')
			.leftJoinAndSelect('post.author', 'author')
			.leftJoinAndSelect('post.category', 'category')
			.leftJoinAndSelect('post.tags', 'tags')
			.where('post.status = :published', { published: PostStatus.PUBLISHED });

		this.applyFilters(qb, query);
		this.applySort(qb, query.sort);

		qb.skip(query.offset || 0).take(query.limit || 10);

		const [items, count] = await qb.getManyAndCount();
		return { items, count };
	}

	async findMyPosts(
		authorId: string,
		query: QueryPostDto,
	): Promise<FindAllResponse<Post>> {
		const qb = this.postRepository
			.createQueryBuilder('post')
			.leftJoinAndSelect('post.category', 'category')
			.leftJoinAndSelect('post.tags', 'tags')
			.where('post.authorId = :authorId', { authorId });

		if (query.status) {
			qb.andWhere('post.status = :status', { status: query.status });
		}
		if (query.categoryId) {
			qb.andWhere('post.categoryId = :categoryId', {
				categoryId: query.categoryId,
			});
		}
		if (query.search) {
			qb.andWhere('LOWER(post.title) LIKE LOWER(:search)', {
				search: `%${query.search.trim()}%`,
			});
		}

		qb.orderBy('post.created_at', 'DESC');
		qb.skip(query.offset || 0).take(query.limit || 10);

		const [items, count] = await qb.getManyAndCount();
		return { items, count };
	}

	async findAllAdmin(query: QueryPostDto): Promise<FindAllResponse<Post>> {
		const qb = this.postRepository
			.createQueryBuilder('post')
			.leftJoinAndSelect('post.author', 'author')
			.leftJoinAndSelect('post.category', 'category')
			.leftJoinAndSelect('post.tags', 'tags');

		if (query.status) {
			qb.andWhere('post.status = :status', { status: query.status });
		}
		if (query.authorId) {
			qb.andWhere('post.authorId = :authorId', { authorId: query.authorId });
		}
		if (query.categoryId) {
			qb.andWhere('post.categoryId = :categoryId', {
				categoryId: query.categoryId,
			});
		}
		if (query.search) {
			qb.andWhere(
				'(LOWER(post.title) LIKE LOWER(:search) OR LOWER(post.content) LIKE LOWER(:search))',
				{ search: `%${query.search.trim()}%` },
			);
		}

		qb.orderBy('post.created_at', 'DESC');
		qb.skip(query.offset || 0).take(query.limit || 10);

		const [items, count] = await qb.getManyAndCount();
		return { items, count };
	}

	async incrementView(id: string, step = 1): Promise<void> {
		await this.postRepository.increment({ id }, 'viewCount', step);
	}

	async incrementReaction(id: string, step = 1): Promise<void> {
		await this.postRepository.increment({ id }, 'reactionCount', step);
	}

	async decrementReaction(id: string, step = 1): Promise<void> {
		await this.postRepository
			.createQueryBuilder()
			.update(Post)
			.set({
				reactionCount: () =>
					`GREATEST(0, "reactionCount" - ${Math.max(1, step)})`,
			})
			.where('id = :id', { id })
			.execute();
	}

	async incrementComment(id: string, step = 1): Promise<void> {
		await this.postRepository.increment({ id }, 'commentCount', step);
	}

	async decrementComment(id: string, step = 1): Promise<void> {
		await this.postRepository
			.createQueryBuilder()
			.update(Post)
			.set({
				commentCount: () =>
					`GREATEST(0, "commentCount" - ${Math.max(1, step)})`,
			})
			.where('id = :id', { id })
			.execute();
	}

	private applyFilters(
		qb: SelectQueryBuilder<Post>,
		query: QueryPostDto,
	): void {
		if (query.categoryId) {
			qb.andWhere('post.categoryId = :categoryId', {
				categoryId: query.categoryId,
			});
		}
		if (query.tag) {
			qb.andWhere('tags.slug = :tagSlug', { tagSlug: query.tag });
		}
		if (query.level) {
			qb.andWhere('post.level = :level', { level: query.level });
		}
		if (query.authorId) {
			qb.andWhere('post.authorId = :authorId', { authorId: query.authorId });
		}
		if (query.isFeatured !== undefined) {
			qb.andWhere('post.isFeatured = :isFeatured', {
				isFeatured: query.isFeatured,
			});
		}
		if (query.isEditorsChoice !== undefined) {
			qb.andWhere('post.isEditorsChoice = :isEditorsChoice', {
				isEditorsChoice: query.isEditorsChoice,
			});
		}
		if (query.search) {
			qb.andWhere(
				'(LOWER(post.title) LIKE LOWER(:search) OR LOWER(post.excerpt) LIKE LOWER(:search) OR LOWER(post.content) LIKE LOWER(:search))',
				{ search: `%${query.search.trim()}%` },
			);
		}
	}

	private applySort(
		qb: SelectQueryBuilder<Post>,
		sort?: 'newest' | 'oldest' | 'popular' | 'trending',
	): void {
		switch (sort) {
			case 'oldest':
				qb.orderBy('post.publishedAt', 'ASC');
				break;
			case 'popular':
				qb.orderBy('post.viewCount', 'DESC').addOrderBy(
					'post.reactionCount',
					'DESC',
				);
				break;
			case 'trending':
				qb.orderBy(
					'(post.viewCount * 1 + post.reactionCount * 3 + post.commentCount * 2)',
					'DESC',
				).addOrderBy('post.publishedAt', 'DESC');
				break;
			case 'newest':
			default:
				qb.orderBy('post.publishedAt', 'DESC').addOrderBy(
					'post.created_at',
					'DESC',
				);
				break;
		}
	}
}

