import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsBoolean,
	IsEnum,
	IsIn,
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	Max,
	Min,
} from 'class-validator';
import { PostLevel, PostStatus } from '@common/enums';

export class QueryPostDto {
	@ApiPropertyOptional({
		enum: PostStatus,
		description: 'Filter by status (DRAFT, PENDING, PUBLISHED, ARCHIVED)',
	})
	@IsOptional()
	@IsEnum(PostStatus)
	status?: PostStatus;

	@ApiPropertyOptional({
		example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
		description: 'Filter by category UUID',
	})
	@IsOptional()
	@IsUUID('4')
	categoryId?: string;

	@ApiPropertyOptional({
		example: 'nestjs',
		description: 'Filter by tag slug',
	})
	@IsOptional()
	@IsString()
	tag?: string;

	@ApiPropertyOptional({
		enum: PostLevel,
		description: 'Filter by post level (basic, series, lab, advanced)',
	})
	@IsOptional()
	@IsEnum(PostLevel)
	level?: PostLevel;

	@ApiPropertyOptional({
		example: 'c3f68744-8d48-43bf-939e-4e6ad9d7e35b',
		description: 'Filter by author UUID',
	})
	@IsOptional()
	@IsUUID('4')
	authorId?: string;

	@ApiPropertyOptional({
		example: 'redis realtime',
		description: 'Search keyword in title, excerpt, and content',
	})
	@IsOptional()
	@IsString()
	search?: string;

	@ApiPropertyOptional({
		example: true,
		description: 'Filter featured posts',
	})
	@IsOptional()
	@Type(() => Boolean)
	@IsBoolean()
	isFeatured?: boolean;

	@ApiPropertyOptional({
		example: true,
		description: 'Filter editor choice posts',
	})
	@IsOptional()
	@Type(() => Boolean)
	@IsBoolean()
	isEditorsChoice?: boolean;

	@ApiPropertyOptional({
		enum: ['newest', 'oldest', 'popular', 'trending'],
		default: 'newest',
		description: 'Sort criteria',
	})
	@IsOptional()
	@IsIn(['newest', 'oldest', 'popular', 'trending'])
	sort?: 'newest' | 'oldest' | 'popular' | 'trending' = 'newest';

	@ApiPropertyOptional({
		example: 0,
		default: 0,
		description: 'Pagination offset',
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	offset = 0;

	@ApiPropertyOptional({
		example: 10,
		default: 10,
		description: 'Pagination limit',
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit = 10;
}

