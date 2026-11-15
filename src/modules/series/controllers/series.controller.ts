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
import { SeriesService } from '../services/series.service';
import { CreateSeriesDto } from '../dto/create-series.dto';
import { UpdateSeriesDto } from '../dto/update-series.dto';
import {
	AddSeriesPostDto,
	ReorderSeriesPostsDto,
} from '../dto/add-series-post.dto';
import { JwtAccessTokenGuard } from '@modules/auth/guards/jwt-access-token.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { USER_ROLE } from '@modules/user-roles/entities/user-role.entity';
import { ApiSuccessMessage } from 'src/decorators/api-success-message.decorator';
import { RequestWithUser } from 'src/types/requests.type';

@Controller('series')
@ApiTags('series')
@UseInterceptors(ClassSerializerInterceptor)
export class SeriesController {
	constructor(private readonly seriesService: SeriesService) {}

	// 1. Author: List my series
	@Get('my')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN, USER_ROLE.AUTHOR)
	@ApiOperation({ summary: 'Get current author series' })
	async findMySeries(@Req() request: RequestWithUser) {
		return this.seriesService.findMySeries(request.user.id);
	}

	// 2. Public: Get series detail by slug
	@Get(':slug')
	@ApiOperation({
		summary: 'Get series detail by slug with ordered posts (Public)',
	})
	@ApiParam({ name: 'slug', description: 'Series slug' })
	async findBySlug(@Param('slug') slug: string) {
		return this.seriesService.findBySlug(slug);
	}

	// 3. Public: Get post reading progress in series (prev/next)
	@Get(':slug/posts/:postSlug')
	@ApiOperation({
		summary:
			'Get current post progress, previous post, and next post in series (Public)',
	})
	@ApiParam({ name: 'slug', description: 'Series slug' })
	@ApiParam({ name: 'postSlug', description: 'Post slug' })
	async getSeriesProgress(
		@Param('slug') seriesSlug: string,
		@Param('postSlug') postSlug: string,
	) {
		return this.seriesService.getSeriesPostProgress(seriesSlug, postSlug);
	}

	// 4. Author / Admin: Create series
	@Post()
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN, USER_ROLE.AUTHOR)
	@ApiSuccessMessage('SERIES_CREATED')
	@ApiOperation({ summary: 'Create new series' })
	@ApiBody({ type: CreateSeriesDto })
	async create(
		@Body() createDto: CreateSeriesDto,
		@Req() request: RequestWithUser,
	) {
		return this.seriesService.create(createDto, request.user.id);
	}

	// 5. Author / Admin: Update series
	@Patch(':id')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN, USER_ROLE.AUTHOR)
	@ApiSuccessMessage('SERIES_UPDATED')
	@ApiOperation({ summary: 'Update series' })
	@ApiParam({ name: 'id', description: 'Series UUID' })
	async update(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() updateDto: UpdateSeriesDto,
		@Req() request: RequestWithUser,
	) {
		return this.seriesService.update(id, updateDto, request.user);
	}

	// 6. Author / Admin: Delete series
	@Delete(':id')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN, USER_ROLE.AUTHOR)
	@ApiSuccessMessage('SERIES_DELETED')
	@ApiOperation({ summary: 'Delete series' })
	@ApiParam({ name: 'id', description: 'Series UUID' })
	async remove(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: RequestWithUser,
	) {
		await this.seriesService.remove(id, request.user);
		return { success: true };
	}

	// 7. Add post to series
	@Post(':id/posts')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN, USER_ROLE.AUTHOR)
	@ApiOperation({ summary: 'Add post to series with order' })
	@ApiParam({ name: 'id', description: 'Series UUID' })
	@ApiBody({ type: AddSeriesPostDto })
	async addPost(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() body: AddSeriesPostDto,
		@Req() request: RequestWithUser,
	) {
		return this.seriesService.addPostToSeries(
			id,
			body.postId,
			body.order,
			request.user,
		);
	}

	// 8. Remove post from series
	@Delete(':id/posts/:postId')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN, USER_ROLE.AUTHOR)
	@ApiOperation({ summary: 'Remove post from series' })
	@ApiParam({ name: 'id', description: 'Series UUID' })
	@ApiParam({ name: 'postId', description: 'Post UUID' })
	async removePost(
		@Param('id', ParseUUIDPipe) id: string,
		@Param('postId', ParseUUIDPipe) postId: string,
		@Req() request: RequestWithUser,
	) {
		await this.seriesService.removePostFromSeries(id, postId, request.user);
		return { success: true };
	}

	// 9. Reorder posts in series
	@Patch(':id/posts/reorder')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard, RolesGuard)
	@Roles(USER_ROLE.ADMIN, USER_ROLE.AUTHOR)
	@ApiOperation({ summary: 'Reorder posts in series' })
	@ApiParam({ name: 'id', description: 'Series UUID' })
	@ApiBody({ type: ReorderSeriesPostsDto })
	async reorderPosts(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() body: ReorderSeriesPostsDto,
		@Req() request: RequestWithUser,
	) {
		await this.seriesService.reorderPosts(
			id,
			body.orderedPostIds,
			request.user,
		);
		return { success: true };
	}
}

