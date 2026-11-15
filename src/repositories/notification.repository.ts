import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '@modules/notifications/entities/notification.entity';
import { NotificationsRepositoryInterface } from '@modules/notifications/interfaces/notifications.interface';
import { QueryNotificationDto } from '@modules/notifications/dto/query-notification.dto';
import { BaseRepositoryAbstract } from './base/base.abstract.repository';
import { FindAllResponse } from 'src/types/common.type';

@Injectable()
export class NotificationRepository
	extends BaseRepositoryAbstract<Notification>
	implements NotificationsRepositoryInterface
{
	constructor(
		@InjectRepository(Notification)
		private readonly notificationRepository: Repository<Notification>,
	) {
		super(notificationRepository);
	}

	async findByUser(
		userId: string,
		query: QueryNotificationDto,
	): Promise<FindAllResponse<Notification>> {
		const qb = this.notificationRepository
			.createQueryBuilder('notification')
			.leftJoinAndSelect('notification.actor', 'actor')
			.where('notification.userId = :userId', { userId });

		if (query.isRead !== undefined) {
			qb.andWhere('notification.isRead = :isRead', { isRead: query.isRead });
		}

		qb.orderBy('notification.created_at', 'DESC');
		qb.skip(query.offset || 0).take(query.limit || 20);

		const [items, count] = await qb.getManyAndCount();
		return { items, count };
	}

	async countUnread(userId: string): Promise<number> {
		return this.notificationRepository.count({
			where: { userId, isRead: false },
		});
	}

	async markAsRead(id: string, userId: string): Promise<boolean> {
		const result = await this.notificationRepository.update(
			{ id, userId },
			{ isRead: true },
		);
		return (result.affected || 0) > 0;
	}

	async markAllAsRead(userId: string): Promise<void> {
		await this.notificationRepository.update(
			{ userId, isRead: false },
			{ isRead: true },
		);
	}
}

