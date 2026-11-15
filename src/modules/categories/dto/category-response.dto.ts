import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
	@ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
	id: string;

	@ApiProperty({ example: 'Backend Development' })
	name: string;

	@ApiProperty({ example: 'backend-development' })
	slug: string;

	@ApiPropertyOptional({ example: 'Articles and deep dives on backend architecture.' })
	description?: string;

	@ApiPropertyOptional({ example: '#3B82F6' })
	color?: string;

	@ApiPropertyOptional({ example: 'server' })
	icon?: string;

	@ApiProperty({ example: 12 })
	postCount: number;

	@ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
	created_at: Date;

	@ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
	updated_at: Date;
}

