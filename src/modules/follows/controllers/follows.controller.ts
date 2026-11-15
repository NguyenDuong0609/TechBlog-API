import {
	ClassSerializerInterceptor,
	Controller,
	Delete,
	Get,
	Param,
	ParseUUIDPipe,
	Post,
	Query,
	Req,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiTags,
} from '@nestjs/swagger';
import { FollowsService } from '../services/follows.service';
import { JwtAccessTokenGuard } from '@modules/auth/guards/jwt-access-token.guard';
import { ParsePaginationPipe } from '@modules/shared/base/pipes/parse-pagination.pipe';
import { RequestWithUser } from 'src/types/requests.type';

@Controller()
@ApiTags('follows')
@ApiBearerAuth('token')
@UseGuards(JwtAccessTokenGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class FollowsController {
	constructor(private readonly followsService: FollowsService) {}

	// 1. Follow Author
	@Post('users/:id/follow')
	@ApiOperation({ summary: 'Follow an author' })
	@ApiParam({ name: 'id', description: 'Author UUID to follow' })
	async followAuthor(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: RequestWithUser,
	) {
		await this.followsService.followUser(request.user.id, id);
		return { success: true, message: 'Followed author successfully' };
	}

	// 2. Unfollow Author
	@Delete('users/:id/follow')
	@ApiOperation({ summary: 'Unfollow an author' })
	@ApiParam({ name: 'id', description: 'Author UUID to unfollow' })
	async unfollowAuthor(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: RequestWithUser,
	) {
		await this.followsService.unfollowUser(request.user.id, id);
		return { success: true, message: 'Unfollowed author successfully' };
	}

	// 3. Check if following author
	@Get('users/:id/is-following')
	@ApiOperation({ summary: 'Check if current user is following this author' })
	@ApiParam({ name: 'id', description: 'Author UUID' })
	async isFollowingAuthor(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: RequestWithUser,
	) {
		const isFollowing = await this.followsService.isFollowingUser(
			request.user.id,
			id,
		);
		return { isFollowing };
	}

	// 4. Get Author's followers
	@Get('users/:id/followers')
	@ApiOperation({ summary: 'Get list of followers for an author' })
	@ApiParam({ name: 'id', description: 'Author UUID' })
	async getFollowers(
		@Param('id', ParseUUIDPipe) id: string,
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
			new ParsePaginationPipe({ defaultValue: 20, minimum: 1, maximum: 100 }),
		)
		limit: number,
	) {
		return this.followsService.getFollowers(id, offset, limit);
	}

	// 5. Get current user's following list
	@Get('users/me/following')
	@ApiOperation({ summary: 'Get list of authors current user is following' })
	async getMyFollowing(
		@Req() request: RequestWithUser,
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
			new ParsePaginationPipe({ defaultValue: 20, minimum: 1, maximum: 100 }),
		)
		limit: number,
	) {
		return this.followsService.getFollowing(request.user.id, offset, limit);
	}

	// 6. Follow Category
	@Post('categories/:id/follow')
	@ApiOperation({ summary: 'Follow a category / topic' })
	@ApiParam({ name: 'id', description: 'Category UUID' })
	async followCategory(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: RequestWithUser,
	) {
		await this.followsService.followCategory(request.user.id, id);
		return { success: true, message: 'Followed category successfully' };
	}

	// 7. Unfollow Category
	@Delete('categories/:id/follow')
	@ApiOperation({ summary: 'Unfollow a category' })
	@ApiParam({ name: 'id', description: 'Category UUID' })
	async unfollowCategory(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: RequestWithUser,
	) {
		await this.followsService.unfollowCategory(request.user.id, id);
		return { success: true, message: 'Unfollowed category successfully' };
	}

	// 8. Check if following category
	@Get('categories/:id/is-following')
	@ApiOperation({ summary: 'Check if current user is following this category' })
	@ApiParam({ name: 'id', description: 'Category UUID' })
	async isFollowingCategory(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: RequestWithUser,
	) {
		const isFollowing = await this.followsService.isFollowingCategory(
			request.user.id,
			id,
		);
		return { isFollowing };
	}

	// 9. Get followed categories
	@Get('users/me/followed-categories')
	@ApiOperation({ summary: 'Get list of categories followed by current user' })
	async getMyFollowedCategories(@Req() request: RequestWithUser) {
		return this.followsService.getFollowedCategories(request.user.id);
	}
}

