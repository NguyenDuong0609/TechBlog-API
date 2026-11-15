import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserFollow } from './entities/user-follow.entity';
import { CategoryFollow } from './entities/category-follow.entity';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { FollowsService } from './services/follows.service';
import { FollowsController } from './controllers/follows.controller';

@Module({
	imports: [
		TypeOrmModule.forFeature([UserFollow, CategoryFollow, User, Category]),
	],
	controllers: [FollowsController],
	providers: [FollowsService],
	exports: [FollowsService],
})
export class FollowsModule {}

