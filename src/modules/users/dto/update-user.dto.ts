import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import {
	IsDateString,
	IsEnum,
	IsObject,
	IsOptional,
	IsPhoneNumber,
	IsString,
	MaxLength,
} from 'class-validator';
import { GENDER } from '../entities/user.entity';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
	OmitType(CreateUserDto, ['email', 'password', 'username'] as const),
) {
	@ApiProperty({
		example: '+14155552671',
		description: 'Phone number',
		required: false,
	})
	@IsOptional()
	@IsPhoneNumber()
	phone_number?: string;

	@ApiProperty({
		example: '1995-05-15',
		description: 'Date of birth (YYYY-MM-DD)',
		required: false,
	})
	@IsOptional()
	@IsDateString()
	date_of_birth?: Date;

	@ApiProperty({
		enum: GENDER,
		example: GENDER.MALE,
		description: 'User gender',
		required: false,
	})
	@IsOptional()
	@IsEnum(GENDER)
	gender?: GENDER;

	@ApiProperty({
		example: 'Passionate language learner & flash card creator',
		description: 'Short user bio/headline',
		required: false,
	})
	@IsOptional()
	@MaxLength(200)
	headline?: string;

	@ApiProperty({
		example: 'Senior Backend Engineer writing about NestJS and high concurrency systems.',
		description: 'Author bio',
		required: false,
	})
	@IsOptional()
	@IsString()
	bio?: string;

	@ApiProperty({
		example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
		description: 'Author avatar URL',
		required: false,
	})
	@IsOptional()
	@IsString()
	avatarUrl?: string;

	@ApiProperty({
		example: {
			github: 'https://github.com/developer',
			twitter: 'https://twitter.com/developer',
			website: 'https://techblog.dev',
			linkedin: 'https://linkedin.com/in/developer',
		},
		description: 'Author social profiles',
		required: false,
	})
	@IsOptional()
	@IsObject()
	socialLinks?: {
		github?: string;
		twitter?: string;
		website?: string;
		linkedin?: string;
	};
}

export class UpdateStudentCardDto {
	student_card_front: string;

	student_card_back: string;
}
