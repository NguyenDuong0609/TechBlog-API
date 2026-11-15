import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RejectPostDto {
	@ApiProperty({
		example: 'The technical depth is insufficient; please provide code examples for error handling and socket reconnection.',
		description: 'Reason for rejection to guide author revisions',
		minLength: 5,
		maxLength: 1000,
	})
	@IsString()
	@IsNotEmpty()
	@MinLength(5)
	@MaxLength(1000)
	reason: string;
}

