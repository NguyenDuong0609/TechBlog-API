import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { USER_ROLE } from '../../user-roles/entities/user-role.entity';

export class UpdateUserRoleDto {
	@ApiProperty({ description: 'New user role', enum: USER_ROLE, example: USER_ROLE.AUTHOR })
	@IsNotEmpty()
	@IsEnum(USER_ROLE)
	role: USER_ROLE;
}

