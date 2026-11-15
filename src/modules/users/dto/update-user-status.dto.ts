import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateUserStatusDto {
	@ApiProperty({ description: 'New active status', example: false })
	@IsNotEmpty()
	@IsBoolean()
	isActive: boolean;
}

