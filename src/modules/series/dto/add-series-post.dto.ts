import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';

export class AddSeriesPostDto {
	@ApiProperty({
		example: 'c3f68744-8d48-43bf-939e-4e6ad9d7e35b',
		description: 'Post UUID to add to series',
	})
	@IsUUID('4')
	@IsNotEmpty()
	postId: string;

	@ApiPropertyOptional({
		example: 1,
		description: 'Order in series (defaults to next order)',
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	order?: number;
}

export class ReorderSeriesPostsDto {
	@ApiProperty({
		example: [
			'c3f68744-8d48-43bf-939e-4e6ad9d7e35b',
			'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
		],
		description: 'Ordered array of post UUIDs in sequence',
		type: [String],
	})
	@IsNotEmpty()
	orderedPostIds: string[];
}

