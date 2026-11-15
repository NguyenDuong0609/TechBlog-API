import { ApiProperty } from '@nestjs/swagger';

export class TagResponseDto {
	@ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
	id: string;

	@ApiProperty({ example: 'NestJS' })
	name: string;

	@ApiProperty({ example: 'nestjs' })
	slug: string;

	@ApiProperty({ example: 45 })
	usageCount: number;

	@ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
	created_at: Date;
}

