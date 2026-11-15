import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
	@ApiProperty({ description: 'Message content text', example: 'Hello! I have a question about your post.' })
	@IsNotEmpty()
	@IsString()
	@MaxLength(5000)
	content: string;
}

