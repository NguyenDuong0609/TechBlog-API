import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './services/notifications.service';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationRepository } from '@repositories/notification.repository';
import { AuditLogModule } from 'src/observability/audit-log.module';
import { QueueModule } from '../queue/queue.module';
import { QueueService } from '../queue/queue.service';
import { User } from '../users/entities/user.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([Notification, User]),
		AuditLogModule,
		QueueModule,
	],
	controllers: [NotificationsController],
	providers: [
		NotificationsService,
		{
			provide: 'NotificationsRepositoryInterface',
			useClass: NotificationRepository,
		},
		{
			provide: 'EmailQueueDispatcherInterface',
			useExisting: QueueService,
		},
	],
	exports: [NotificationsService, 'NotificationsRepositoryInterface'],
})
export class NotificationsModule {}

