import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FollowsService } from '../services/follows.service';

describe('FollowsService', () => {
	let service: FollowsService;
	let userFollowRepo: Record<string, jest.Mock>;
	let categoryFollowRepo: Record<string, jest.Mock>;
	let userRepo: Record<string, jest.Mock>;
	let categoryRepo: Record<string, jest.Mock>;

	beforeEach(() => {
		userFollowRepo = {
			findOneBy: jest.fn(),
			create: jest.fn((dto) => dto),
			save: jest.fn(async (dto) => dto),
			delete: jest.fn(async () => ({ affected: 1 })),
			count: jest.fn(async () => 1),
			findAndCount: jest.fn(async () => [[], 0]),
			find: jest.fn(async () => []),
		};

		categoryFollowRepo = {
			findOneBy: jest.fn(),
			create: jest.fn((dto) => dto),
			save: jest.fn(async (dto) => dto),
			delete: jest.fn(async () => ({ affected: 1 })),
			count: jest.fn(async () => 1),
			find: jest.fn(async () => []),
		};

		userRepo = {
			findOneBy: jest.fn(async ({ id }) => ({ id, fullName: 'Author' })),
		};

		categoryRepo = {
			findOneBy: jest.fn(async ({ id }) => ({ id, name: 'Tech' })),
		};

		service = new FollowsService(
			userFollowRepo as never,
			categoryFollowRepo as never,
			userRepo as never,
			categoryRepo as never,
		);
	});

	it('should throw BadRequestException if user tries to follow themselves', async () => {
		await expect(service.followUser('user-1', 'user-1')).rejects.toThrow(
			BadRequestException,
		);
	});

	it('should throw NotFoundException if author does not exist', async () => {
		userRepo.findOneBy.mockResolvedValueOnce(null);
		await expect(service.followUser('user-1', 'nonexistent')).rejects.toThrow(
			NotFoundException,
		);
	});

	it('should follow user successfully', async () => {
		userFollowRepo.findOneBy.mockResolvedValueOnce(null);
		const result = await service.followUser('user-1', 'user-2');
		expect(result).toBe(true);
		expect(userFollowRepo.save).toHaveBeenCalled();
	});

	it('should return true without duplicate if already following', async () => {
		userFollowRepo.findOneBy.mockResolvedValueOnce({ followerId: 'user-1', followingId: 'user-2' });
		const result = await service.followUser('user-1', 'user-2');
		expect(result).toBe(true);
		expect(userFollowRepo.save).not.toHaveBeenCalled();
	});

	it('should unfollow user successfully', async () => {
		const result = await service.unfollowUser('user-1', 'user-2');
		expect(result).toBe(true);
		expect(userFollowRepo.delete).toHaveBeenCalledWith({ followerId: 'user-1', followingId: 'user-2' });
	});

	it('should follow category successfully', async () => {
		categoryFollowRepo.findOneBy.mockResolvedValueOnce(null);
		const result = await service.followCategory('user-1', 'cat-1');
		expect(result).toBe(true);
		expect(categoryFollowRepo.save).toHaveBeenCalled();
	});
});

