import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Series } from './entities/series.entity';
import { SeriesPost } from './entities/series-post.entity';
import { Post } from '../posts/entities/post.entity';
import { SeriesService } from './services/series.service';
import { SeriesController } from './controllers/series.controller';

@Module({
	imports: [TypeOrmModule.forFeature([Series, SeriesPost, Post])],
	controllers: [SeriesController],
	providers: [SeriesService],
	exports: [SeriesService],
})
export class SeriesModule {}

