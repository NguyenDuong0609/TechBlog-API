import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SearchPostDto {
	@ApiPropertyOptional({
		example: 'nestjs realtime',
		description: 'Search query keyword for title, excerpt, and content',
	})
	@IsOptional()
	@IsString()
	q?: string;

	@ApiPropertyOptional({ example: 1, default: 1, description: 'Page number' })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number = 1;

	@ApiPropertyOptional({ example: 10, default: 10, description: 'Items per page' })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number = 10;

	@ApiPropertyOptional({ example: 0, default: 0, description: 'Offset override' })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	offset?: number;
}
