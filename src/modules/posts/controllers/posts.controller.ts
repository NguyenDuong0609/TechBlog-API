import {
	Body,
	ClassSerializerInterceptor,
	Controller,
	Delete,
	Get,
	Header,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	Query,
	Req,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiTags,
} from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { PostsService } from '../services/posts.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { QueryPostDto } from '../dto/query-post.dto';
import { SearchPostDto } from '../dto/search-post.dto';
import { RejectPostDto } from '../dto/approve-reject.dto';
import { JwtAccessTokenGuard } from '@modules/auth/guards/jwt-access-token.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { USER_ROLE } from '@modules/user-roles/entities/user-role.entity';
import { ApiSuccessMessage } from 'src/decorators/api-success-message.decorator';
import { AuditLogService } from 'src/observability/audit-log.service';
import { RequestWithUser } from 'src/types/requests.type';

@Controller('posts')
@ApiTags('posts')
@UseInterceptors(ClassSerializerInterceptor)
export class PostsController {
	constructor(
		private readonly postsService: PostsService,
		private readonly auditLog: AuditLogService,
		private readonly dataSource: DataSource,
	) {}

	// 1. PUBLIC LIST
	@Get()
	@ApiOperation({
		summary: 'Get published posts (Public feed)',
		description:
			'Retrieve paginated published posts with category, tags, sorting and full-text search',
	})
	async findPublic(@Query() query: QueryPostDto) {
		return this.postsService.findPublic(query);
	}

	// 2. AUTHOR / ADMIN: GET MY POSTS
	@Get('my')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN, USER_ROLE.AUTHOR)
	@ApiOperation({ summary: 'Get current author posts' })
	async findMyPosts(
		@Req() request: RequestWithUser,
		@Query() query: QueryPostDto,
	) {
		return this.postsService.findMyPosts(request.user.id, query);
	}

	// 3. AUTHOR / ADMIN: GET MY POST DETAIL
	@Get('my/:id')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN, USER_ROLE.AUTHOR)
	@ApiOperation({ summary: 'Get current author post detail by ID' })
	@ApiParam({ name: 'id', description: 'Post UUID' })
	async findMyPostById(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: RequestWithUser,
	) {
		return this.postsService.findMyPostById(id, request.user.id);
	}

	// 4. ADMIN: LIST ALL POSTS (ALL STATUSES)
	@Get('admin')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN)
	@ApiOperation({ summary: 'Admin get all posts across all statuses' })
	async findAllAdmin(@Query() query: QueryPostDto) {
		return this.postsService.findAllAdmin(query);
	}

	// 5. FULL-TEXT SEARCH
	@Get('search')
	@ApiOperation({
		summary: 'Full-text search published posts by title and content',
	})
	async search(@Query() query: SearchPostDto) {
		return this.postsService.search(query);
	}

	// 6. SITEMAP XML
	@Get('sitemap.xml')
	@Header('Content-Type', 'application/xml')
	@ApiOperation({ summary: 'Generate public SEO sitemap XML of published posts' })
	async getSitemap() {
		return this.postsService.generateSitemapXml();
	}

	// 7. PUBLIC DETAIL BY SLUG
	@Get(':slug')
	@ApiOperation({
		summary: 'Get post detail by slug (Public) + increments viewCount',
	})
	@ApiParam({
		name: 'slug',
		example: 'building-scalable-realtime-apis-with-nestjs',
	})
	async findBySlug(@Param('slug') slug: string) {
		return this.postsService.findBySlug(slug);
	}

	// 8. CREATE POST
	@Post()
	@Throttle({ default: { limit: 5, ttl: 3600000 } })
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN, USER_ROLE.AUTHOR)
	@ApiSuccessMessage('POST_CREATED')
	@ApiOperation({ summary: 'Create new post in DRAFT status' })
	@ApiBody({ type: CreatePostDto })
	async create(
		@Body() createDto: CreatePostDto,
		@Req() request: RequestWithUser,
	) {
		return this.dataSource.transaction(async (manager) => {
			const post = await this.postsService.createInTransaction(
				createDto,
				request.user.id,
				manager,
			);
			await this.auditLog.recordEvent(
				{
					eventType: 'business',
					action: 'POST_CREATED',
					actorUserId: request.user.id,
					resourceType: 'Post',
					resourceId: post.id,
					metadata: { title: post.title, slug: post.slug },
				},
				manager,
			);
			return post;
		});
	}

	// 7. UPDATE POST
	@Patch(':id')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN, USER_ROLE.AUTHOR)
	@ApiSuccessMessage('POST_UPDATED')
	@ApiOperation({ summary: 'Update post (Author or Admin)' })
	@ApiParam({ name: 'id', description: 'Post UUID' })
	async update(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() updateDto: UpdatePostDto,
		@Req() request: RequestWithUser,
	) {
		return this.dataSource.transaction(async (manager) => {
			const post = await this.postsService.updateInTransaction(
				id,
				updateDto,
				request.user,
				manager,
			);
			await this.auditLog.recordEvent(
				{
					eventType: 'business',
					action: 'POST_UPDATED',
					actorUserId: request.user.id,
					resourceType: 'Post',
					resourceId: id,
					metadata: { changedFields: Object.keys(updateDto).length },
				},
				manager,
			);
			return post;
		});
	}

	// 8. DELETE POST (SOFT DELETE)
	@Delete(':id')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN, USER_ROLE.AUTHOR)
	@ApiSuccessMessage('POST_DELETED')
	@ApiOperation({ summary: 'Soft delete post (Author or Admin)' })
	@ApiParam({ name: 'id', description: 'Post UUID' })
	async remove(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: RequestWithUser,
	) {
		await this.dataSource.transaction(async (manager) => {
			await this.postsService.softDeleteInTransaction(
				id,
				request.user,
				manager,
			);
			await this.auditLog.recordEvent(
				{
					eventType: 'business',
					action: 'POST_DELETED',
					actorUserId: request.user.id,
					resourceType: 'Post',
					resourceId: id,
				},
				manager,
			);
		});
	}

	// 8b. RESTORE POST
	@Post(':id/restore')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN, USER_ROLE.AUTHOR)
	@ApiSuccessMessage('POST_RESTORED')
	@ApiOperation({ summary: 'Restore soft-deleted post (Author or Admin)' })
	@ApiParam({ name: 'id', description: 'Post UUID' })
	async restore(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: RequestWithUser,
	) {
		return this.dataSource.transaction(async (manager) => {
			const post = await this.postsService.restoreInTransaction(
				id,
				request.user,
				manager,
			);
			await this.auditLog.recordEvent(
				{
					eventType: 'business',
					action: 'POST_RESTORED',
					actorUserId: request.user.id,
					resourceType: 'Post',
					resourceId: id,
				},
				manager,
			);
			return post;
		});
	}

	// 9. SUBMIT FOR REVIEW (DRAFT -> PENDING)
	@Post(':id/submit')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN, USER_ROLE.AUTHOR)
	@ApiSuccessMessage('POST_SUBMITTED')
	@ApiOperation({ summary: 'Submit post for review (DRAFT -> PENDING)' })
	@ApiParam({ name: 'id', description: 'Post UUID' })
	async submit(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: RequestWithUser,
	) {
		const post = await this.postsService.submit(id, request.user);
		await this.auditLog.recordEvent({
			eventType: 'business',
			action: 'POST_SUBMITTED_FOR_REVIEW',
			actorUserId: request.user.id,
			resourceType: 'Post',
			resourceId: id,
		});
		return post;
	}

	// 10. PUBLISH POST (DIRECT PUBLISH)
	@Post(':id/publish')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN, USER_ROLE.AUTHOR)
	@ApiSuccessMessage('POST_PUBLISHED')
	@ApiOperation({ summary: 'Publish post directly (DRAFT/PENDING -> PUBLISHED)' })
	@ApiParam({ name: 'id', description: 'Post UUID' })
	async publish(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: RequestWithUser,
	) {
		return this.dataSource.transaction(async (manager) => {
			const post = await this.postsService.publishInTransaction(
				id,
				request.user,
				manager,
			);
			await this.auditLog.recordEvent(
				{
					eventType: 'business',
					action: 'POST_PUBLISHED',
					actorUserId: request.user.id,
					resourceType: 'Post',
					resourceId: id,
				},
				manager,
			);
			return post;
		});
	}

	// 11. ARCHIVE POST
	@Post(':id/archive')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN, USER_ROLE.AUTHOR)
	@ApiSuccessMessage('POST_ARCHIVED')
	@ApiOperation({ summary: 'Archive post (Author or Admin)' })
	@ApiParam({ name: 'id', description: 'Post UUID' })
	async archive(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: RequestWithUser,
	) {
		const post = await this.postsService.archive(id, request.user);
		await this.auditLog.recordEvent({
			eventType: 'business',
			action: 'POST_ARCHIVED',
			actorUserId: request.user.id,
			resourceType: 'Post',
			resourceId: id,
		});
		return post;
	}

	// 12. ADMIN APPROVE
	@Post(':id/approve')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN)
	@ApiSuccessMessage('POST_APPROVED')
	@ApiOperation({ summary: 'Admin approve pending post (PENDING -> PUBLISHED)' })
	@ApiParam({ name: 'id', description: 'Post UUID' })
	async approve(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: RequestWithUser,
	) {
		return this.dataSource.transaction(async (manager) => {
			const post = await this.postsService.approveInTransaction(
				id,
				request.user.id,
				manager,
			);
			await this.auditLog.recordEvent(
				{
					eventType: 'business',
					action: 'POST_APPROVED',
					actorUserId: request.user.id,
					resourceType: 'Post',
					resourceId: id,
				},
				manager,
			);
			return post;
		});
	}

	// 13. ADMIN REJECT
	@Post(':id/reject')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN)
	@ApiSuccessMessage('POST_REJECTED')
	@ApiOperation({ summary: 'Admin reject pending post with reason' })
	@ApiParam({ name: 'id', description: 'Post UUID' })
	@ApiBody({ type: RejectPostDto })
	async reject(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() rejectDto: RejectPostDto,
		@Req() request: RequestWithUser,
	) {
		return this.dataSource.transaction(async (manager) => {
			const post = await this.postsService.rejectInTransaction(
				id,
				request.user.id,
				rejectDto.reason,
				manager,
			);
			await this.auditLog.recordEvent(
				{
					eventType: 'business',
					action: 'POST_REJECTED',
					actorUserId: request.user.id,
					resourceType: 'Post',
					resourceId: id,
					metadata: { reason: rejectDto.reason },
				},
				manager,
			);
			return post;
		});
	}
}

