import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { PostStatus } from '@common/enums';
import { USER_ROLE } from '@modules/user-roles/entities/user-role.entity';
import { AppCacheService } from '@modules/shared/base/cache/app-cache.service';
import { AppCacheKeyBuilder } from '@modules/shared/base/cache/app-cache-key.builder';

const DASHBOARD_CACHE_NAMESPACE = 'dashboard-stats';
const DASHBOARD_CACHE_TTL_MS = 30_000;

@Injectable()
export class DashboardService {
	constructor(
		@InjectRepository(Post)
		private readonly postRepo: Repository<Post>,
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,
		@InjectRepository(Category)
		private readonly categoryRepo: Repository<Category>,
		@InjectRepository(Tag)
		private readonly tagRepo: Repository<Tag>,
		@InjectRepository(Comment)
		private readonly commentRepo: Repository<Comment>,
		@Optional() private readonly cache?: AppCacheService,
	) {}

	async getStats(user: { id: string; role?: any }) {
		const roleName =
			typeof user.role === 'object' ? user.role?.name : user.role;
		const isAdmin = roleName === USER_ROLE.ADMIN;

		if (!this.cache) {
			return isAdmin ? this.getAdminStats() : this.getAuthorStats(user.id);
		}

		return this.cache.getOrSet(
			DASHBOARD_CACHE_NAMESPACE,
			AppCacheKeyBuilder.build({
				route: '/dashboard/stats',
				params: { userId: isAdmin ? 'admin' : user.id },
			}),
			DASHBOARD_CACHE_TTL_MS,
			() => (isAdmin ? this.getAdminStats() : this.getAuthorStats(user.id)),
		);
	}

	private async getAuthorStats(authorId: string) {
		const totalPosts = await this.postRepo.count({
			where: { authorId },
		});
		const publishedPosts = await this.postRepo.count({
			where: { authorId, status: PostStatus.PUBLISHED },
		});
		const draftPosts = await this.postRepo.count({
			where: { authorId, status: PostStatus.DRAFT },
		});
		const pendingPosts = await this.postRepo.count({
			where: { authorId, status: PostStatus.PENDING },
		});

		const sums = await this.postRepo
			.createQueryBuilder('p')
			.where('p.authorId = :authorId', { authorId })
			.select('COALESCE(SUM(p.viewCount), 0)', 'totalViews')
			.addSelect('COALESCE(SUM(p.commentCount), 0)', 'totalComments')
			.addSelect('COALESCE(SUM(p.reactionCount), 0)', 'totalReactions')
			.getRawOne();

		return {
			totalPosts,
			publishedPosts,
			draftPosts,
			pendingPosts,
			totalViews: parseInt(sums?.totalViews ?? '0', 10),
			totalComments: parseInt(sums?.totalComments ?? '0', 10),
			totalReactions: parseInt(sums?.totalReactions ?? '0', 10),
		};
	}

	private async getAdminStats() {
		const totalUsers = await this.userRepo.count();
		const totalPosts = await this.postRepo.count();
		const publishedPosts = await this.postRepo.count({
			where: { status: PostStatus.PUBLISHED },
		});
		const pendingPosts = await this.postRepo.count({
			where: { status: PostStatus.PENDING },
		});
		const draftPosts = await this.postRepo.count({
			where: { status: PostStatus.DRAFT },
		});
		const totalCategories = await this.categoryRepo.count();
		const totalTags = await this.tagRepo.count();

		const sums = await this.postRepo
			.createQueryBuilder('p')
			.select('COALESCE(SUM(p.viewCount), 0)', 'totalViews')
			.addSelect('COALESCE(SUM(p.commentCount), 0)', 'totalComments')
			.addSelect('COALESCE(SUM(p.reactionCount), 0)', 'totalReactions')
			.getRawOne();

		return {
			totalUsers,
			totalPosts,
			publishedPosts,
			pendingPosts,
			draftPosts,
			totalCategories,
			totalTags,
			totalViews: parseInt(sums?.totalViews ?? '0', 10),
			totalComments: parseInt(sums?.totalComments ?? '0', 10),
			totalReactions: parseInt(sums?.totalReactions ?? '0', 10),
		};
	}
}

