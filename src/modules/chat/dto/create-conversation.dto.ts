import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateConversationDto {
	@ApiProperty({ description: 'Target user ID to start conversation with', example: 'c3f68744-8d48-43bf-939e-4e6ad9d7e35b' })
	@IsNotEmpty()
	@IsUUID()
	participantId: string;
}
