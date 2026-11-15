import { NotFoundException } from '@nestjs/common';
import { ReactionsService } from '../services/reactions.service';

describe('ReactionsService', () => {
	let service: ReactionsService;
	let reactionRepo: Record<string, jest.Mock>;
	let postRepo: Record<string, any>;
	let socketService: Record<string, jest.Mock>;

	beforeEach(() => {
		reactionRepo = {
			findOneBy: jest.fn(),
			create: jest.fn((dto) => dto),
			save: jest.fn(async (dto) => dto),
			remove: jest.fn(async (entity) => entity),
			find: jest.fn(async () => []),
		};

		postRepo = {
			findOneBy: jest.fn(async ({ id }) => ({ id, reactionCount: 5 })),
			findOne: jest.fn(async () => ({ reactionCount: 5 })),
			increment: jest.fn(async () => undefined),
			createQueryBuilder: jest.fn(() => ({
				update: jest.fn().mockReturnThis(),
				set: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				execute: jest.fn().mockResolvedValue({ affected: 1 }),
			})),
		};

		socketService = {
			emitToPost: jest.fn(),
		};

		service = new ReactionsService(
			reactionRepo as never,
			postRepo as never,
			socketService as never,
		);
	});

	it('should throw NotFoundException if post not found', async () => {
		postRepo.findOneBy.mockResolvedValueOnce(null);
		await expect(service.toggleReaction('nonexistent', 'user-1')).rejects.toThrow(
			NotFoundException,
		);
	});

	it('should add reaction when user has not reacted yet', async () => {
		reactionRepo.findOneBy.mockResolvedValueOnce(null);

		const result = await service.toggleReaction('post-1', 'user-1', 'like');

		expect(result.reacted).toBe(true);
		expect(result.reactionCount).toBe(6);
		expect(reactionRepo.save).toHaveBeenCalled();
		expect(postRepo.increment).toHaveBeenCalledWith({ id: 'post-1' }, 'reactionCount', 1);
		expect(socketService.emitToPost).toHaveBeenCalledWith(
			'post-1',
			'reaction_updated',
			expect.objectContaining({ postId: 'post-1', reacted: true, reactionCount: 6 }),
		);
	});

	it('should remove reaction when user has already reacted', async () => {
		reactionRepo.findOneBy.mockResolvedValueOnce({
			id: 'rx-1',
			postId: 'post-1',
			userId: 'user-1',
			type: 'like',
		});

		const result = await service.toggleReaction('post-1', 'user-1', 'like');

		expect(result.reacted).toBe(false);
		expect(result.reactionCount).toBe(4);
		expect(reactionRepo.remove).toHaveBeenCalled();
		expect(postRepo.createQueryBuilder).toHaveBeenCalled();
		expect(socketService.emitToPost).toHaveBeenCalledWith(
			'post-1',
			'reaction_updated',
			expect.objectContaining({ postId: 'post-1', reacted: false, reactionCount: 4 }),
		);
	});

	it('should return user reaction status', async () => {
		reactionRepo.find.mockResolvedValueOnce([{ type: 'like' }]);
		const result = await service.getMyReaction('post-1', 'user-1');
		expect(result.reacted).toBe(true);
		expect(result.reactions).toEqual(['like']);
	});
});

