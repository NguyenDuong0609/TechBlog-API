import {
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
	Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseServiceAbstract } from 'src/services/base/base.abstract.service';
import { Notification } from '../entities/notification.entity';
import { NotificationsRepositoryInterface } from '../interfaces/notifications.interface';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { QueryNotificationDto } from '../dto/query-notification.dto';
import { SocketService } from '../../socket/services/socket.service';
import { AppCacheService } from '@modules/shared/base/cache/app-cache.service';
import { AppCacheKeyBuilder } from '@modules/shared/base/cache/app-cache-key.builder';
import { FindAllResponse } from 'src/types/common.type';
import { NotificationType } from '@common/enums';
import { User } from '../../users/entities/user.entity';

export interface EmailQueueDispatcherInterface {
	addEmailJob(data: any): Promise<string>;
}

export const NOTIFICATIONS_CACHE_NAMESPACE = 'notifications';
const NOTIFICATIONS_CACHE_TTL_MS = 15_000;

@Injectable()
export class NotificationsService extends BaseServiceAbstract<Notification> {
	constructor(
		@Inject('NotificationsRepositoryInterface')
		private readonly notificationRepository: NotificationsRepositoryInterface,
		private readonly socketService: SocketService,
		@Optional() private readonly cache?: AppCacheService,
		@Optional()
		@Inject('EmailQueueDispatcherInterface')
		private readonly queueService?: EmailQueueDispatcherInterface,
		@Optional()
		@InjectRepository(User)
		private readonly userRepository?: Repository<User>,
	) {
		super(notificationRepository);
	}

	override async create(dto: CreateNotificationDto): Promise<Notification> {
		const notification = await this.notificationRepository.create({
			...dto,
			isRead: false,
		});

		// Realtime push to recipient's private room
		this.socketService.emitToUser(dto.userId, 'new_notification', {
			id: notification.id,
			type: notification.type,
			title: notification.title,
			message: notification.message,
			data: notification.data,
			createdAt: notification.created_at,
			isRead: false,
			actorId: notification.actorId,
		});

		// Send email notification via BullMQ for important events
		if (
			this.queueService &&
			this.userRepository &&
			[
				NotificationType.POST_APPROVED,
				NotificationType.POST_REJECTED,
				NotificationType.NEW_POST_FROM_FOLLOWING,
				NotificationType.REPLY,
			].includes(dto.type as NotificationType)
		) {
			this.userRepository
				.findOneBy({ id: dto.userId })
				.then((user) => {
					if (user?.email) {
						this.queueService
							?.addEmailJob({
								to: [user.email],
								subject: dto.title,
								template: 'notification',
								context: {
									name:
										`${user.first_name || ''} ${user.last_name || ''}`.trim() ||
										user.username,
									title: dto.title,
									message: dto.message,
									data: dto.data,
								},
							})
							.catch(() => {});
					}
				})
				.catch(() => {});
		}

		await this.cache?.invalidate(NOTIFICATIONS_CACHE_NAMESPACE);
		return notification;
	}

	async createMany(dtos: CreateNotificationDto[]): Promise<Notification[]> {
		const results: Notification[] = [];
		for (const dto of dtos) {
			results.push(await this.create(dto));
		}
		return results;
	}

	async findByUser(
		userId: string,
		query: QueryNotificationDto,
	): Promise<FindAllResponse<Notification>> {
		return this.notificationRepository.findByUser(userId, query);
	}

	async getUnreadCount(userId: string): Promise<number> {
		if (!this.cache) {
			return this.notificationRepository.countUnread(userId);
		}

		return this.cache.getOrSet(
			NOTIFICATIONS_CACHE_NAMESPACE,
			AppCacheKeyBuilder.build({
				route: '/notifications/unread-count',
				params: { userId },
			}),
			NOTIFICATIONS_CACHE_TTL_MS,
			() => this.notificationRepository.countUnread(userId),
		);
	}

	async markAsRead(id: string, userId: string): Promise<boolean> {
		const success = await this.notificationRepository.markAsRead(id, userId);
		if (!success) {
			throw new NotFoundException(
				`Notification #${id} not found or you do not have permission`,
			);
		}
		await this.cache?.invalidate(NOTIFICATIONS_CACHE_NAMESPACE);
		return true;
	}

	async markAllAsRead(userId: string): Promise<void> {
		await this.notificationRepository.markAllAsRead(userId);
		await this.cache?.invalidate(NOTIFICATIONS_CACHE_NAMESPACE);
	}

	override async remove(id: string, userId?: string): Promise<boolean> {
		const existing = await this.notificationRepository.findOneById(id);
		if (!existing) {
			throw new NotFoundException(`Notification #${id} not found`);
		}

		if (userId && existing.userId !== userId) {
			throw new ForbiddenException('You can only delete your own notifications');
		}

		const result = await super.remove(id);
		await this.cache?.invalidate(NOTIFICATIONS_CACHE_NAMESPACE);
		return result;
	}
}

