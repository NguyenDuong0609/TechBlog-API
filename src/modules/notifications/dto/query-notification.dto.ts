import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryNotificationDto {
	@ApiPropertyOptional({ example: false, description: 'Filter by read/unread status' })
	@IsOptional()
	@Type(() => Boolean)
	@IsBoolean()
	isRead?: boolean;

	@ApiPropertyOptional({ example: 0, default: 0 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	offset = 0;

	@ApiPropertyOptional({ example: 20, default: 20 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit = 20;
}

