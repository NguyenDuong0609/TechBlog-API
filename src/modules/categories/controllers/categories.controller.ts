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
	ApiTags,
} from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { CategoriesService } from '../services/categories.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { JwtAccessTokenGuard } from '@modules/auth/guards/jwt-access-token.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { USER_ROLE } from '@modules/user-roles/entities/user-role.entity';
import { ApiSuccessMessage } from 'src/decorators/api-success-message.decorator';
import { ParsePaginationPipe } from '@modules/shared/base/pipes/parse-pagination.pipe';
import { AuditLogService } from 'src/observability/audit-log.service';
import { RequestWithUser } from 'src/types/requests.type';

@Controller('categories')
@ApiTags('categories')
@UseInterceptors(ClassSerializerInterceptor)
export class CategoriesController {
	constructor(
		private readonly categoriesService: CategoriesService,
		private readonly auditLog: AuditLogService,
		private readonly dataSource: DataSource,
	) {}

	@Get()
	@ApiOperation({
		summary: 'Get all categories (Public)',
		description: 'Returns list of published categories with post counts',
	})
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
	) {
		return this.categoriesService.findAll({
			skip: offset,
			take: limit,
			order: { postCount: 'DESC', name: 'ASC' },
		});
	}

	@Get(':slug')
	@ApiOperation({
		summary: 'Get category detail by slug (Public)',
	})
	@ApiParam({
		name: 'slug',
		example: 'backend-development',
		description: 'Category slug',
	})
	async findBySlug(@Param('slug') slug: string) {
		return this.categoriesService.findBySlug(slug);
	}

	@Post()
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN)
	@ApiSuccessMessage('CATEGORY_CREATED')
	@ApiOperation({
		summary: 'Admin create new category',
	})
	@ApiBody({ type: CreateCategoryDto })
	async create(
		@Body() createDto: CreateCategoryDto,
		@Req() request: RequestWithUser,
	) {
		return this.dataSource.transaction(async (manager) => {
			const category = await this.categoriesService.createInTransaction(
				createDto,
				manager,
			);
			await this.auditLog.recordEvent(
				{
					eventType: 'business',
					action: 'CATEGORY_CREATED',
					actorUserId: request.user.id,
					resourceType: 'Category',
					resourceId: category.id,
					metadata: { name: category.name, slug: category.slug },
				},
				manager,
			);
			return category;
		});
	}

	@Patch(':id')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN)
	@ApiSuccessMessage('CATEGORY_UPDATED')
	@ApiOperation({
		summary: 'Admin update category',
	})
	@ApiParam({ name: 'id', description: 'Category UUID' })
	async update(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() updateDto: UpdateCategoryDto,
		@Req() request: RequestWithUser,
	) {
		return this.dataSource.transaction(async (manager) => {
			const category = await this.categoriesService.updateInTransaction(
				id,
				updateDto,
				manager,
			);
			await this.auditLog.recordEvent(
				{
					eventType: 'business',
					action: 'CATEGORY_UPDATED',
					actorUserId: request.user.id,
					resourceType: 'Category',
					resourceId: id,
					metadata: { changedFields: Object.keys(updateDto).length },
				},
				manager,
			);
			return category;
		});
	}

	@Delete(':id')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN)
	@ApiSuccessMessage('CATEGORY_DELETED')
	@ApiOperation({
		summary: 'Admin delete category (soft delete)',
	})
	@ApiParam({ name: 'id', description: 'Category UUID' })
	async remove(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: RequestWithUser,
	) {
		await this.dataSource.transaction(async (manager) => {
			await this.categoriesService.removeInTransaction(id, manager);
			await this.auditLog.recordEvent(
				{
					eventType: 'business',
					action: 'CATEGORY_DELETED',
					actorUserId: request.user.id,
					resourceType: 'Category',
					resourceId: id,
				},
				manager,
			);
		});
	}
}

