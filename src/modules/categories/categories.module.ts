import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Post } from '../posts/entities/post.entity';
import { CategoriesService } from './services/categories.service';
import { CategoriesController } from './controllers/categories.controller';
import { CategoryRepository } from '@repositories/category.repository';
import { AuditLogModule } from 'src/observability/audit-log.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Category, Post]),
		AuditLogModule,
	],
	controllers: [CategoriesController],
	providers: [
		CategoriesService,
		{
			provide: 'CategoriesRepositoryInterface',
			useClass: CategoryRepository,
		},
	],
	exports: [CategoriesService, 'CategoriesRepositoryInterface'],
})
export class CategoriesModule {}

