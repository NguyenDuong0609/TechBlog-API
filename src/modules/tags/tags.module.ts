import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { TagsService } from './services/tags.service';
import { TagsController } from './controllers/tags.controller';
import { TagRepository } from '@repositories/tag.repository';
import { AuditLogModule } from 'src/observability/audit-log.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Tag]),
		AuditLogModule,
	],
	controllers: [TagsController],
	providers: [
		TagsService,
		{ provide: 'TagsRepositoryInterface', useClass: TagRepository },
	],
	exports: [TagsService, 'TagsRepositoryInterface'],
})
export class TagsModule {}

