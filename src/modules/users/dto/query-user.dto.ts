import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { USER_ROLE } from '../../user-roles/entities/user-role.entity';

export class QueryUserDto {
	@ApiPropertyOptional({ default: 1 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number;

	@ApiPropertyOptional({ default: 0 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	offset?: number = 0;

	@ApiPropertyOptional({ default: 20 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number = 20;

	@ApiPropertyOptional({ description: 'Filter by user role', enum: USER_ROLE })
	@IsOptional()
	@IsEnum(USER_ROLE)
	role?: USER_ROLE;

	@ApiPropertyOptional({ description: 'Filter by active status' })
	@IsOptional()
	@Type(() => Boolean)
	@IsBoolean()
	isActive?: boolean;

	@ApiPropertyOptional({ description: 'Search by email or fullName' })
	@IsOptional()
	@IsString()
	search?: string;
}

