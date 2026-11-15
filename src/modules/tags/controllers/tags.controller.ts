import {
	Body,
	ClassSerializerInterceptor,
	Controller,
	Delete,
	Get,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	Query,
	Req,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiTags,
} from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { TagsService } from '../services/tags.service';
import { CreateTagDto } from '../dto/create-tag.dto';
import { UpdateTagDto } from '../dto/update-tag.dto';
import { JwtAccessTokenGuard } from '@modules/auth/guards/jwt-access-token.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { USER_ROLE } from '@modules/user-roles/entities/user-role.entity';
import { ApiSuccessMessage } from 'src/decorators/api-success-message.decorator';
import { ParsePaginationPipe } from '@modules/shared/base/pipes/parse-pagination.pipe';
import { AuditLogService } from 'src/observability/audit-log.service';
import { RequestWithUser } from 'src/types/requests.type';

@Controller('tags')
@ApiTags('tags')
@UseInterceptors(ClassSerializerInterceptor)
export class TagsController {
	constructor(
		private readonly tagsService: TagsService,
		private readonly auditLog: AuditLogService,
		private readonly dataSource: DataSource,
	) {}

	@Get()
	@ApiOperation({
		summary: 'Get all tags (Public)',
		description: 'Returns list of tags with usage counts',
	})
	@ApiQuery({ name: 'popular', required: false, type: Boolean })
	async findAll(
		@Query(
			'offset',
			new ParsePaginationPipe({
				defaultValue: 0,
				minimum: 0,
				maximum: 1_000_000,
			}),
		)
		offset: number,
		@Query(
			'limit',
			new ParsePaginationPipe({ defaultValue: 50, minimum: 1, maximum: 100 }),
		)
		limit: number,
		@Query('popular') popular?: string,
	) {
		if (popular === 'true') {
			return this.tagsService.findPopular(limit);
		}

		return this.tagsService.findAll({
			skip: offset,
			take: limit,
			order: { usageCount: 'DESC', name: 'ASC' },
		});
	}

	@Get('popular')
	@ApiOperation({
		summary: 'Get popular tags (Public)',
	})
	@ApiQuery({ name: 'limit', required: false, type: Number })
	async getPopular(@Query('limit') limit = 10) {
		return this.tagsService.findPopular(Number(limit) || 10);
	}

	@Get(':slug')
	@ApiOperation({
		summary: 'Get tag detail by slug (Public)',
	})
	@ApiParam({ name: 'slug', description: 'Tag slug' })
	async findBySlug(@Param('slug') slug: string) {
		return this.tagsService.findBySlug(slug);
	}

	@Post()
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN, USER_ROLE.AUTHOR)
	@ApiSuccessMessage('TAG_CREATED')
	@ApiOperation({
		summary: 'Create new tag (Author or Admin)',
	})
	@ApiBody({ type: CreateTagDto })
	async create(@Body() createDto: CreateTagDto, @Req() request: RequestWithUser) {
		return this.dataSource.transaction(async (manager) => {
			const tag = await this.tagsService.createInTransaction(createDto, manager);
			await this.auditLog.recordEvent(
				{
					eventType: 'business',
					action: 'TAG_CREATED',
					actorUserId: request.user.id,
					resourceType: 'Tag',
					resourceId: tag.id,
					metadata: { name: tag.name, slug: tag.slug },
				},
				manager,
			);
			return tag;
		});
	}

	@Patch(':id')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN)
	@ApiSuccessMessage('TAG_UPDATED')
	@ApiOperation({
		summary: 'Admin update tag',
	})
	@ApiParam({ name: 'id', description: 'Tag UUID' })
	async update(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() updateDto: UpdateTagDto,
		@Req() request: RequestWithUser,
	) {
		return this.dataSource.transaction(async (manager) => {
			const tag = await this.tagsService.updateInTransaction(
				id,
				updateDto,
				manager,
			);
			await this.auditLog.recordEvent(
				{
					eventType: 'business',
					action: 'TAG_UPDATED',
					actorUserId: request.user.id,
					resourceType: 'Tag',
					resourceId: id,
					metadata: { changedFields: Object.keys(updateDto).length },
				},
				manager,
			);
			return tag;
		});
	}

	@Delete(':id')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN)
	@ApiSuccessMessage('TAG_DELETED')
	@ApiOperation({
		summary: 'Admin delete tag (only when usageCount is 0)',
	})
	@ApiParam({ name: 'id', description: 'Tag UUID' })
	async remove(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: RequestWithUser,
	) {
		await this.dataSource.transaction(async (manager) => {
			await this.tagsService.removeInTransaction(id, manager);
			await this.auditLog.recordEvent(
				{
					eventType: 'business',
					action: 'TAG_DELETED',
					actorUserId: request.user.id,
					resourceType: 'Tag',
					resourceId: id,
				},
				manager,
			);
		});
	}
}

