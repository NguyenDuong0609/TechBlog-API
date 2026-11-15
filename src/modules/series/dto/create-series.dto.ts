import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSeriesDto {
	@ApiProperty({
		example: 'Chinh Phục Kubernetes Từ Zero Đến Pro',
		description: 'Series title',
		minLength: 3,
		maxLength: 200,
	})
	@IsString()
	@IsNotEmpty()
	@MinLength(3)
	@MaxLength(200)
	title: string;

	@ApiPropertyOptional({
		example: 'chinh-phuc-kubernetes-tu-zero-den-pro',
		description: 'Series slug (auto-generated if omitted)',
		maxLength: 220,
	})
	@IsOptional()
	@IsString()
	@MaxLength(220)
	slug?: string;

	@ApiPropertyOptional({
		example: 'Hành trình từ kiến trúc cơ bản đến triển khai Helm, Ingress và CI/CD trên K8s.',
		description: 'Series description',
	})
	@IsOptional()
	@IsString()
	description?: string;

	@ApiPropertyOptional({
		example: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9',
		description: 'Series cover image URL',
	})
	@IsOptional()
	@IsString()
	coverImage?: string;
}

