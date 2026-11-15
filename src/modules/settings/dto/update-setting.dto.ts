import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSettingDto {
	@ApiProperty({ description: 'Setting value (can be string, number, boolean, or object)', example: 'My Tech Blog' })
	@IsNotEmpty()
	value: any;

	@ApiPropertyOptional({ description: 'Setting description', example: 'Default website title' })
	@IsOptional()
	@IsString()
	@MaxLength(500)
	description?: string;

	@ApiPropertyOptional({ description: 'Whether this setting is publicly visible', default: false })
	@IsOptional()
	@IsBoolean()
	isPublic?: boolean;
}

