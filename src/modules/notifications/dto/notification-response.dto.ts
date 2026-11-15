import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@common/enums';

export class NotificationActorDto {
	@ApiProperty({ example: 'c3f68744-8d48-43bf-939e-4e6ad9d7e35b' })
	id: string;

	@ApiProperty({ example: 'John Doe' })
	fullName: string;

	@ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
	avatarUrl?: string;
}

export class NotificationResponseDto {
	@ApiProperty({ example: 'd4e5f6a7-b8c9-0123-def4-567890abcdef' })
	id: string;

	@ApiProperty({ enum: NotificationType, example: NotificationType.NEW_COMMENT })
	type: NotificationType;

	@ApiProperty({ example: 'New comment on your post' })
	title: string;

	@ApiPropertyOptional({ example: 'John Doe commented on your post' })
	message?: string;

	@ApiPropertyOptional({ example: { postId: 'post-uuid', postSlug: 'post-slug' } })
	data?: Record<string, any>;

	@ApiProperty({ example: false })
	isRead: boolean;

	@ApiProperty({ example: 'c3f68744-8d48-43bf-939e-4e6ad9d7e35b' })
	userId: string;

	@ApiPropertyOptional({ type: NotificationActorDto })
	actor?: NotificationActorDto;

	@ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
	created_at: Date;
}

