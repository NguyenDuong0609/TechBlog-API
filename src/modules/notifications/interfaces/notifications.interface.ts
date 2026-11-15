import { Notification } from '../entities/notification.entity';
import { BaseRepositoryInterface } from '@repositories/base/base.interface.repository';
import { QueryNotificationDto } from '../dto/query-notification.dto';
import { FindAllResponse } from 'src/types/common.type';

export interface NotificationsRepositoryInterface
	extends BaseRepositoryInterface<Notification> {
	findByUser(
		userId: string,
		query: QueryNotificationDto,
	): Promise<FindAllResponse<Notification>>;
	countUnread(userId: string): Promise<number>;
	markAsRead(id: string, userId: string): Promise<boolean>;
	markAllAsRead(userId: string): Promise<void>;
}

