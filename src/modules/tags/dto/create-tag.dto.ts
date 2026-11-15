import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTagDto {
	@ApiProperty({
		example: 'NestJS',
		description: 'Tag name',
		minLength: 2,
		maxLength: 80,
	})
	@IsString()
	@IsNotEmpty()
	@MinLength(2)
	@MaxLength(80)
	name: string;

	@ApiPropertyOptional({
		example: 'nestjs',
		description: 'Custom slug (auto-generated if omitted)',
		maxLength: 100,
	})
	@IsOptional()
	@IsString()
	@MaxLength(100)
	slug?: string;
}

