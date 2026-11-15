import {
	ClassSerializerInterceptor,
	Controller,
	Delete,
	Get,
	Param,
	ParseUUIDPipe,
	Patch,
	Query,
	Req,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiTags,
} from '@nestjs/swagger';
import { NotificationsService } from '../services/notifications.service';
import { QueryNotificationDto } from '../dto/query-notification.dto';
import { JwtAccessTokenGuard } from '@modules/auth/guards/jwt-access-token.guard';
import { ApiSuccessMessage } from 'src/decorators/api-success-message.decorator';
import { RequestWithUser } from 'src/types/requests.type';

@Controller('notifications')
@ApiTags('notifications')
@ApiBearerAuth('token')
@UseGuards(JwtAccessTokenGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class NotificationsController {
	constructor(private readonly notificationsService: NotificationsService) {}

	@Get()
	@ApiOperation({ summary: 'Get current user notifications' })
	async findMyNotifications(
		@Req() request: RequestWithUser,
		@Query() query: QueryNotificationDto,
	) {
		return this.notificationsService.findByUser(request.user.id, query);
	}

	@Get('unread-count')
	@ApiOperation({ summary: 'Get count of unread notifications' })
	async getUnreadCount(@Req() request: RequestWithUser) {
		const count = await this.notificationsService.getUnreadCount(
			request.user.id,
		);
		return { unreadCount: count };
	}

	@Patch(':id/read')
	@ApiSuccessMessage('NOTIFICATION_READ')
	@ApiOperation({ summary: 'Mark a notification as read' })
	@ApiParam({ name: 'id', description: 'Notification UUID' })
	async markAsRead(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: RequestWithUser,
	) {
		await this.notificationsService.markAsRead(id, request.user.id);
		return { success: true };
	}

	@Patch('read-all')
	@ApiSuccessMessage('NOTIFICATIONS_READ_ALL')
	@ApiOperation({ summary: 'Mark all notifications as read' })
	async markAllAsRead(@Req() request: RequestWithUser) {
		await this.notificationsService.markAllAsRead(request.user.id);
		return { success: true };
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete a notification' })
	@ApiParam({ name: 'id', description: 'Notification UUID' })
	async remove(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: RequestWithUser,
	) {
		await this.notificationsService.remove(id, request.user.id);
		return { success: true };
	}
}

