import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFollow } from '../entities/user-follow.entity';
import { CategoryFollow } from '../entities/category-follow.entity';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';

@Injectable()
export class FollowsService {
	constructor(
		@InjectRepository(UserFollow)
		private readonly userFollowRepo: Repository<UserFollow>,
		@InjectRepository(CategoryFollow)
		private readonly categoryFollowRepo: Repository<CategoryFollow>,
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,
		@InjectRepository(Category)
		private readonly categoryRepo: Repository<Category>,
	) {}

	async followUser(followerId: string, followingId: string): Promise<boolean> {
		if (followerId === followingId) {
			throw new BadRequestException('You cannot follow yourself');
		}

		const targetUser = await this.userRepo.findOneBy({ id: followingId });
		if (!targetUser) {
			throw new NotFoundException(`Author #${followingId} not found`);
		}

		const existing = await this.userFollowRepo.findOneBy({
			followerId,
			followingId,
		});
		if (existing) {
			return true;
		}

		await this.userFollowRepo.save(
			this.userFollowRepo.create({ followerId, followingId }),
		);
		return true;
	}

	async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
		await this.userFollowRepo.delete({ followerId, followingId });
		return true;
	}

	async isFollowingUser(
		followerId: string,
		followingId: string,
	): Promise<boolean> {
		const count = await this.userFollowRepo.count({
			where: { followerId, followingId },
		});
		return count > 0;
	}

	async getFollowers(followingId: string, offset = 0, limit = 20) {
		const [items, count] = await this.userFollowRepo.findAndCount({
			where: { followingId },
			relations: ['follower'],
			order: { created_at: 'DESC' },
			skip: offset,
			take: limit,
		});

		return {
			items: items.map((f) => ({
				id: f.follower?.id,
				fullName: f.follower?.fullName,
				avatarUrl: f.follower?.avatarUrl,
				bio: f.follower?.bio,
				followedAt: f.created_at,
			})),
			count,
		};
	}

	async getFollowing(followerId: string, offset = 0, limit = 20) {
		const [items, count] = await this.userFollowRepo.findAndCount({
			where: { followerId },
			relations: ['following'],
			order: { created_at: 'DESC' },
			skip: offset,
			take: limit,
		});

		return {
			items: items.map((f) => ({
				id: f.following?.id,
				fullName: f.following?.fullName,
				avatarUrl: f.following?.avatarUrl,
				bio: f.following?.bio,
				followedAt: f.created_at,
			})),
			count,
		};
	}

	async getFollowerIds(authorId: string): Promise<string[]> {
		const follows = await this.userFollowRepo.find({
			where: { followingId: authorId },
			select: ['followerId'],
		});
		return follows.map((f) => f.followerId);
	}

	async followCategory(userId: string, categoryId: string): Promise<boolean> {
		const category = await this.categoryRepo.findOneBy({ id: categoryId });
		if (!category) {
			throw new NotFoundException(`Category #${categoryId} not found`);
		}

		const existing = await this.categoryFollowRepo.findOneBy({
			userId,
			categoryId,
		});
		if (existing) {
			return true;
		}

		await this.categoryFollowRepo.save(
			this.categoryFollowRepo.create({ userId, categoryId }),
		);
		return true;
	}

	async unfollowCategory(userId: string, categoryId: string): Promise<boolean> {
		await this.categoryFollowRepo.delete({ userId, categoryId });
		return true;
	}

	async isFollowingCategory(
		userId: string,
		categoryId: string,
	): Promise<boolean> {
		const count = await this.categoryFollowRepo.count({
			where: { userId, categoryId },
		});
		return count > 0;
	}

	async getFollowedCategories(userId: string) {
		const follows = await this.categoryFollowRepo.find({
			where: { userId },
			relations: ['category'],
			order: { created_at: 'DESC' },
		});

		return follows.map((f) => f.category).filter(Boolean);
	}

	async getCategorySubscriberIds(categoryId: string): Promise<string[]> {
		const follows = await this.categoryFollowRepo.find({
			where: { categoryId },
			select: ['userId'],
		});
		return follows.map((f) => f.userId);
	}
}

