import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsArray,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
	MinLength,
} from 'class-validator';
import { PostLevel } from '@common/enums';

export class CreatePostDto {
	@ApiProperty({
		example: 'Building Scalable Realtime APIs with NestJS and Redis',
		description: 'Post title',
		minLength: 5,
		maxLength: 255,
	})
	@IsString()
	@IsNotEmpty()
	@MinLength(5)
	@MaxLength(255)
	title: string;

	@ApiPropertyOptional({
		example: 'building-scalable-realtime-apis-with-nestjs-and-redis',
		description: 'Post unique slug (auto-generated from title if omitted)',
		maxLength: 255,
	})
	@IsOptional()
	@IsString()
	@MaxLength(255)
	slug?: string;

	@ApiProperty({
		example:
			'# Introduction\nIn this comprehensive guide, we explore how to build resilient realtime systems...',
		description: 'Post markdown content',
		minLength: 50,
	})
	@IsString()
	@IsNotEmpty()
	@MinLength(50)
	content: string;

	@ApiPropertyOptional({
		example: 'A deep dive into NestJS WebSockets, Redis adapter, and performance optimizations.',
		description: 'Short summary or excerpt for feed previews',
	})
	@IsOptional()
	@IsString()
	excerpt?: string;

	@ApiPropertyOptional({
		example: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
		description: 'Cover image URL uploaded via media module',
	})
	@IsOptional()
	@IsString()
	coverImage?: string;

	@ApiPropertyOptional({
		example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
		description: 'Category UUID',
	})
	@IsOptional()
	@IsUUID('4')
	categoryId?: string;

	@ApiPropertyOptional({
		example: ['b2c3d4e5-f6a7-8901-bcde-f12345678901'],
		description: 'List of existing tag UUIDs',
		type: [String],
	})
	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	tagIds?: string[];

	@ApiPropertyOptional({
		example: ['NestJS', 'Redis', 'Architecture'],
		description: 'List of tag names to auto-attach or create on the fly',
		type: [String],
	})
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	tagNames?: string[];

	@ApiPropertyOptional({
		enum: PostLevel,
		example: PostLevel.BASIC,
		description: 'Post complexity / type level',
	})
	@IsOptional()
	@IsEnum(PostLevel)
	level?: PostLevel;

	@ApiPropertyOptional({
		example: 'NestJS Realtime APIs Guide',
		description: 'Custom SEO title',
		maxLength: 255,
	})
	@IsOptional()
	@IsString()
	@MaxLength(255)
	metaTitle?: string;

	@ApiPropertyOptional({
		example: 'Step by step tutorial to build and scale NestJS realtime applications.',
		description: 'Custom SEO description',
		maxLength: 500,
	})
	@IsOptional()
	@IsString()
	@MaxLength(500)
	metaDescription?: string;
}

