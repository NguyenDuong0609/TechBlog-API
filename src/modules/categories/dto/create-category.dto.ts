import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
	@ApiProperty({
		example: 'Backend Development',
		description: 'Category name',
		minLength: 2,
		maxLength: 100,
	})
	@IsString()
	@IsNotEmpty()
	@MinLength(2)
	@MaxLength(100)
	name: string;

	@ApiPropertyOptional({
		example: 'backend-development',
		description: 'Custom slug (auto-generated if omitted)',
		maxLength: 120,
	})
	@IsOptional()
	@IsString()
	@MaxLength(120)
	slug?: string;

	@ApiPropertyOptional({
		example: 'Articles and deep dives on backend architecture, NestJS, Go, and distributed systems.',
		description: 'Category description',
	})
	@IsOptional()
	@IsString()
	description?: string;

	@ApiPropertyOptional({
		example: '#3B82F6',
		description: 'Color code for category badge / UI highlight',
	})
	@IsOptional()
	@IsString()
	@MaxLength(50)
	color?: string;

	@ApiPropertyOptional({
		example: 'server',
		description: 'Icon name or URL',
	})
	@IsOptional()
	@IsString()
	@MaxLength(100)
	icon?: string;
}

