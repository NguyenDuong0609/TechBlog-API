import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostReaction } from './entities/post-reaction.entity';
import { Post } from '../posts/entities/post.entity';
import { ReactionsService } from './services/reactions.service';
import { ReactionsController } from './controllers/reactions.controller';

@Module({
	imports: [TypeOrmModule.forFeature([PostReaction, Post])],
	controllers: [ReactionsController],
	providers: [ReactionsService],
	exports: [ReactionsService],
})
export class ReactionsModule {}

