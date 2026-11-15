import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ChatService } from '../services/chat.service';

describe('ChatService', () => {
	let service: ChatService;
	let convRepo: Record<string, any>;
	let messageRepo: Record<string, any>;
	let userRepo: Record<string, any>;
	let socketService: Record<string, any>;
	let notificationsService: Record<string, any>;

	beforeEach(() => {
		convRepo = {
			create: jest.fn((dto) => ({ id: 'conv-1', ...dto })),
			save: jest.fn(async (entity) => entity),
			findOne: jest.fn(async () => ({
				id: 'conv-1',
				participants: [{ id: 'user-1' }, { id: 'user-2' }],
			})),
			createQueryBuilder: jest.fn(() => ({
				innerJoin: jest.fn().mockReturnThis(),
				leftJoinAndSelect: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				addOrderBy: jest.fn().mockReturnThis(),
				getOne: jest.fn().mockResolvedValue(null),
				getMany: jest.fn().mockResolvedValue([]),
			})),
		};

		messageRepo = {
			create: jest.fn((dto) => ({ id: 'msg-1', ...dto, created_at: new Date() })),
			save: jest.fn(async (entity) => entity),
			findOne: jest.fn(async () => null),
			findAndCount: jest.fn(async () => [[], 0]),
			createQueryBuilder: jest.fn(() => ({
				where: jest.fn().mockReturnThis(),
				andWhere: jest.fn().mockReturnThis(),
				getCount: jest.fn().mockResolvedValue(0),
				update: jest.fn().mockReturnThis(),
				set: jest.fn().mockReturnThis(),
				execute: jest.fn().mockResolvedValue({ affected: 1 }),
			})),
		};

		userRepo = {
			findOneBy: jest.fn(async ({ id }) => ({ id, fullName: 'Test User' })),
		};

		socketService = {
			emitToConversation: jest.fn(),
		};

		notificationsService = {
			create: jest.fn(async () => ({})),
		};

		service = new ChatService(
			convRepo as never,
			messageRepo as never,
			userRepo as never,
			socketService as never,
			notificationsService as never,
		);
	});

	it('should throw BadRequestException if starting conversation with self', async () => {
		await expect(
			service.findOrCreateConversation('user-1', 'user-1'),
		).rejects.toThrow(BadRequestException);
	});

	it('should throw NotFoundException if target user does not exist', async () => {
		userRepo.findOneBy.mockResolvedValueOnce(null);
		await expect(
			service.findOrCreateConversation('user-1', 'user-999'),
		).rejects.toThrow(NotFoundException);
	});

	it('should create new conversation if none exists', async () => {
		const result = await service.findOrCreateConversation('user-1', 'user-2');
		expect(result).toBeDefined();
		expect(convRepo.create).toHaveBeenCalled();
		expect(convRepo.save).toHaveBeenCalled();
	});

	it('should send message and emit realtime event to conversation room', async () => {
		const msg = await service.sendMessage('conv-1', 'user-1', 'Hello there!');

		expect(msg).toBeDefined();
		expect(messageRepo.save).toHaveBeenCalled();
		expect(socketService.emitToConversation).toHaveBeenCalledWith(
			'conv-1',
			'new_message',
			expect.objectContaining({ content: 'Hello there!' }),
		);
		expect(notificationsService.create).toHaveBeenCalled();
	});

	it('should throw ForbiddenException if sender is not participant', async () => {
		convRepo.findOne.mockResolvedValueOnce({
			id: 'conv-1',
			participants: [{ id: 'user-3' }, { id: 'user-4' }],
		});

		await expect(
			service.sendMessage('conv-1', 'user-1', 'Intruder message'),
		).rejects.toThrow(ForbiddenException);
	});
});

