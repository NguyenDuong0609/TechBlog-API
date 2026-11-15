import { NotificationsService, NOTIFICATIONS_CACHE_NAMESPACE } from '../services/notifications.service';
import { NotificationType } from '@common/enums';
import { Notification } from '../entities/notification.entity';

describe('NotificationsService', () => {
	let service: NotificationsService;
	let notificationRepo: Record<string, jest.Mock>;
	let socketService: Record<string, jest.Mock>;
	let cache: Record<string, jest.Mock>;

	beforeEach(() => {
		notificationRepo = {
			create: jest.fn(async (dto) => ({
				id: 'notif-1',
				...dto,
				created_at: new Date(),
			})),
			findByUser: jest.fn(async () => ({ items: [], total: 0 })),
			countUnread: jest.fn(async () => 3),
			markAsRead: jest.fn(async () => true),
			markAllAsRead: jest.fn(async () => undefined),
			findOneById: jest.fn(async (id) => ({ id, userId: 'user-1' })),
			remove: jest.fn(async () => true),
		};

		socketService = {
			emitToUser: jest.fn(),
		};

		cache = {
			invalidate: jest.fn(async () => undefined),
			getOrSet: jest.fn(async (_ns, _key, _ttl, fn) => fn()),
		};

		service = new NotificationsService(
			notificationRepo as never,
			socketService as never,
			cache as never,
		);
	});

	it('should create a notification and emit realtime event to recipient', async () => {
		const dto = {
			userId: 'user-1',
			type: NotificationType.NEW_COMMENT,
			title: 'New Comment',
			message: 'Someone commented on your post',
			actorId: 'user-2',
		};

		const result = await service.create(dto);

		expect(result).toBeDefined();
		expect(result.id).toBe('notif-1');
		expect(notificationRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({ userId: 'user-1', isRead: false }),
		);
		expect(socketService.emitToUser).toHaveBeenCalledWith(
			'user-1',
			'new_notification',
			expect.objectContaining({ id: 'notif-1', type: NotificationType.NEW_COMMENT }),
		);
		expect(cache.invalidate).toHaveBeenCalledWith(NOTIFICATIONS_CACHE_NAMESPACE);
	});

	it('should return unread count with cache support', async () => {
		const count = await service.getUnreadCount('user-1');
		expect(count).toBe(3);
		expect(cache.getOrSet).toHaveBeenCalled();
	});

	it('should mark notification as read and invalidate cache', async () => {
		const result = await service.markAsRead('notif-1', 'user-1');
		expect(result).toBe(true);
		expect(notificationRepo.markAsRead).toHaveBeenCalledWith('notif-1', 'user-1');
		expect(cache.invalidate).toHaveBeenCalledWith(NOTIFICATIONS_CACHE_NAMESPACE);
	});

	it('should mark all notifications as read for a user', async () => {
		await service.markAllAsRead('user-1');
		expect(notificationRepo.markAllAsRead).toHaveBeenCalledWith('user-1');
		expect(cache.invalidate).toHaveBeenCalledWith(NOTIFICATIONS_CACHE_NAMESPACE);
	});
});

