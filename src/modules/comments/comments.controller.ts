import {
	Controller,
	Post,
	Get,
	Patch,
	Delete,
	Param,
	Body,
	UseGuards,
	UseInterceptors,
	ClassSerializerInterceptor,
	Req,
	Query,
} from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiBearerAuth,
	ApiBody,
	ApiParam,
	ApiQuery,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CurrentUserId } from 'src/decorators/current-user.decorator';
import { JwtAccessTokenGuard } from '@modules/auth/guards/jwt-access-token.guard';
import { RequestWithUser } from 'src/types/requests.type';
import { USER_ROLE } from '@modules/user-roles/entities/user-role.entity';
import { ApiSuccessMessage } from 'src/decorators/api-success-message.decorator';
import { FeatureFlag } from '../../decorators/feature-flag.decorator';
import { ParsePaginationPipe } from '@modules/shared/base/pipes/parse-pagination.pipe';
import {
	CreateReplyDto,
	CreateRootCommentDto,
	HideCommentDto,
	UpdateCommentDto,
} from './dto/comment.dto';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Comments')
@ApiBearerAuth('token')
@UseGuards(JwtAccessTokenGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('comments')
@FeatureFlag('comments')
export class CommentsController {
	constructor(private readonly commentsService: CommentsService) {}

	@Post('posts/:postId')
	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@ApiSuccessMessage('COMMENT_CREATED')
	@ApiOperation({ summary: 'Create a root comment on a post' })
	@ApiParam({
		name: 'postId',
		example: 'c3f68744-8d48-43bf-939e-4e6ad9d7e35b',
		description: 'Post UUID',
	})
	@ApiBody({
		type: CreateRootCommentDto,
		examples: {
			comment_1: {
				value: {
					content: 'Excellent guide! Could you explain how to configure Redis TLS certificates?',
				} as CreateRootCommentDto,
			},
			comment_2: {
				value: {
					content:
						'Very helpful and clear explanation of WebSocket scaling with Redis Adapter.',
				} as CreateRootCommentDto,
			},
		},
	})
	async createRootComment(
		@Param('postId') postId: string,
		@Body() body: CreateRootCommentDto,
		@CurrentUserId() authorId: string,
	) {
		return this.commentsService.createComment(
			{ content: body.content, postId },
			authorId,
		);
	}

	@Post(':commentId/replies')
	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@ApiSuccessMessage('COMMENT_CREATED')
	@ApiOperation({ summary: 'Reply to a comment' })
	@ApiParam({
		name: 'commentId',
		example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
		description: 'Parent Comment UUID',
	})
	@ApiBody({
		type: CreateReplyDto,
		examples: {
			reply_1: {
				value: {
					content: 'I agree with this explanation!',
					postId: 'c3f68744-8d48-43bf-939e-4e6ad9d7e35b',
				} as CreateReplyDto,
			},
			reply_2: {
				value: {
					content: 'Thanks for the clarification.',
					postId: 'c3f68744-8d48-43bf-939e-4e6ad9d7e35b',
				} as CreateReplyDto,
			},
		},
	})
	async createReply(
		@Param('commentId') parentId: string,
		@Body() body: CreateReplyDto,
		@CurrentUserId() authorId: string,
	) {
		return this.commentsService.createComment(
			{ content: body.content, postId: body.postId, parentId },
			authorId,
		);
	}

	@Get('posts/:postId/tree')
	@ApiOperation({ summary: 'Get comment tree for a post' })
	@ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
	@ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
	@ApiParam({
		name: 'postId',
		example: 'c3f68744-8d48-43bf-939e-4e6ad9d7e35b',
		description: 'Post UUID',
	})
	async getCommentTree(
		@Param('postId') postId: string,
		@Query(
			'offset',
			new ParsePaginationPipe({
				defaultValue: 0,
				minimum: 0,
				maximum: 1_000_000,
			}),
		)
		offset = 0,
		@Query(
			'limit',
			new ParsePaginationPipe({ defaultValue: 20, minimum: 1, maximum: 100 }),
		)
		limit = 20,
	) {
		return this.commentsService.getCommentTree(postId, offset, limit);
	}

	@Get(':id/ancestors')
	@ApiOperation({ summary: 'Get all ancestors of a comment' })
	@ApiParam({
		name: 'id',
		example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
		description: 'Comment UUID',
	})
	async getAncestors(@Param('id') id: string) {
		return this.commentsService.getCommentAncestors(id);
	}

	@Get(':id/descendants')
	@ApiOperation({ summary: 'Get all descendants of a comment' })
	@ApiParam({
		name: 'id',
		example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
		description: 'Comment UUID',
	})
	async getDescendants(@Param('id') id: string) {
		return this.commentsService.getCommentDescendants(id);
	}

	@Patch(':id')
	@ApiSuccessMessage('COMMENT_UPDATED')
	@ApiOperation({ summary: 'Update a comment' })
	@ApiParam({
		name: 'id',
		example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
		description: 'Comment UUID',
	})
	@ApiBody({
		type: UpdateCommentDto,
		examples: {
			update_1: {
				value: {
					content: 'Updated comment text content.',
				} as UpdateCommentDto,
			},
		},
	})
	async updateComment(
		@Param('id') id: string,
		@Body() body: UpdateCommentDto,
		@CurrentUserId() userId: string,
	) {
		return this.commentsService.updateComment(id, body.content, userId);
	}

	@Delete(':id')
	@ApiSuccessMessage('COMMENT_DELETED')
	@ApiOperation({ summary: 'Delete a comment and its descendants' })
	@ApiParam({
		name: 'id',
		example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
		description: 'Comment UUID',
	})
	async deleteComment(
		@Param('id') id: string,
		@CurrentUserId() userId: string,
		@Req() request: RequestWithUser,
	) {
		await this.commentsService.deleteComment(
			id,
			userId,
			request.user.role?.name === USER_ROLE.ADMIN,
		);
		return { message: 'Comment deleted successfully' };
	}

	@Post(':id/hide')
	@UseGuards(RolesGuard)
	@Roles(USER_ROLE.ADMIN)
	@ApiOperation({ summary: 'Admin hide a comment' })
	@ApiParam({ name: 'id', description: 'Comment UUID' })
	async hideComment(
		@Param('id') id: string,
		@Body() body: HideCommentDto,
		@CurrentUserId() adminId: string,
	) {
		return this.commentsService.hide(id, adminId, body.reason);
	}

	@Post(':id/unhide')
	@UseGuards(RolesGuard)
	@Roles(USER_ROLE.ADMIN)
	@ApiOperation({ summary: 'Admin unhide a comment' })
	@ApiParam({ name: 'id', description: 'Comment UUID' })
	async unhideComment(
		@Param('id') id: string,
		@CurrentUserId() adminId: string,
	) {
		return this.commentsService.unhide(id, adminId);
	}
}
