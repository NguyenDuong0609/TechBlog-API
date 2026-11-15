import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Category } from '../categories/entities/category.entity';
import { Tag } from '../tags/entities/tag.entity';
import { User } from '../users/entities/user.entity';
import { PostsService } from './services/posts.service';
import { PostsController } from './controllers/posts.controller';
import { PostRepository } from '@repositories/post.repository';
import { AuditLogModule } from 'src/observability/audit-log.module';
import { CategoriesModule } from '../categories/categories.module';
import { TagsModule } from '../tags/tags.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FollowsModule } from '../follows/follows.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Post, Category, Tag, User]),
		AuditLogModule,
		CategoriesModule,
		TagsModule,
		NotificationsModule,
		FollowsModule,
	],
	controllers: [PostsController],
	providers: [
		PostsService,
		{ provide: 'PostsRepositoryInterface', useClass: PostRepository },
	],
	exports: [PostsService, 'PostsRepositoryInterface'],
})
export class PostsModule {}

