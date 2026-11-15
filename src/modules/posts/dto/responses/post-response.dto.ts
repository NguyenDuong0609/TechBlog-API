import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostLevel, PostStatus } from '@common/enums';

export class AuthorPublicDto {
	@ApiProperty({ example: 'c3f68744-8d48-43bf-939e-4e6ad9d7e35b' })
	id: string;

	@ApiProperty({ example: 'John Doe' })
	fullName: string;

	@ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
	avatarUrl?: string;

	@ApiPropertyOptional({ example: 'Senior Backend Engineer' })
	bio?: string;
}

export class CategoryBriefDto {
	@ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
	id: string;

	@ApiProperty({ example: 'Backend' })
	name: string;

	@ApiProperty({ example: 'backend' })
	slug: string;

	@ApiPropertyOptional({ example: '#3B82F6' })
	color?: string;
}

export class TagBriefDto {
	@ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
	id: string;

	@ApiProperty({ example: 'NestJS' })
	name: string;

	@ApiProperty({ example: 'nestjs' })
	slug: string;
}

export class PostResponseDto {
	@ApiProperty({ example: 'f1e2d3c4-b5a6-7890-1234-56789abcdef0' })
	id: string;

	@ApiProperty({ example: 'Building Scalable Realtime APIs with NestJS' })
	title: string;

	@ApiProperty({ example: 'building-scalable-realtime-apis-with-nestjs' })
	slug: string;

	@ApiPropertyOptional({ example: 'Detailed technical guide...' })
	content?: string;

	@ApiPropertyOptional({ example: 'A deep dive into NestJS WebSockets...' })
	excerpt?: string;

	@ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
	coverImage?: string;

	@ApiProperty({ enum: PostStatus, example: PostStatus.PUBLISHED })
	status: PostStatus;

	@ApiProperty({ enum: PostLevel, example: PostLevel.BASIC })
	level: PostLevel;

	@ApiProperty({ example: 1250 })
	viewCount: number;

	@ApiProperty({ example: 6 })
	readingTime: number;

	@ApiProperty({ example: 88 })
	reactionCount: number;

	@ApiProperty({ example: 14 })
	commentCount: number;

	@ApiProperty({ example: true })
	isFeatured: boolean;

	@ApiProperty({ example: false })
	isEditorsChoice: boolean;

	@ApiPropertyOptional({ example: '2026-10-01T12:00:00.000Z' })
	publishedAt?: Date;

	@ApiPropertyOptional({ example: 'NestJS Realtime APIs Guide' })
	metaTitle?: string;

	@ApiPropertyOptional({ example: 'Step by step guide...' })
	metaDescription?: string;

	@ApiPropertyOptional({ example: 'Need more code samples' })
	rejectReason?: string;

	@ApiPropertyOptional({ type: AuthorPublicDto })
	author?: AuthorPublicDto;

	@ApiPropertyOptional({ type: CategoryBriefDto })
	category?: CategoryBriefDto;

	@ApiPropertyOptional({ type: [TagBriefDto] })
	tags?: TagBriefDto[];

	@ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
	created_at: Date;

	@ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
	updated_at: Date;
}

