import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsEnum,
	IsNotEmpty,
	IsObject,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
} from 'class-validator';
import { NotificationType } from '@common/enums';

export class CreateNotificationDto {
	@ApiProperty({ enum: NotificationType, example: NotificationType.NEW_COMMENT })
	@IsEnum(NotificationType)
	type: NotificationType;

	@ApiProperty({ example: 'New comment on your post', maxLength: 255 })
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	title: string;

	@ApiPropertyOptional({ example: 'John Doe commented on "Building Realtime APIs"' })
	@IsOptional()
	@IsString()
	message?: string;

	@ApiPropertyOptional({
		example: { postId: 'c3f68744-8d48-43bf-939e-4e6ad9d7e35b', postSlug: 'building-realtime-apis' },
	})
	@IsOptional()
	@IsObject()
	data?: Record<string, any>;

	@ApiProperty({ example: 'c3f68744-8d48-43bf-939e-4e6ad9d7e35b', description: 'Recipient user ID' })
	@IsUUID('4')
	userId: string;

	@ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Actor user ID' })
	@IsOptional()
	@IsUUID('4')
	actorId?: string;
}

