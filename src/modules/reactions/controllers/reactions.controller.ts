import {
	Body,
	ClassSerializerInterceptor,
	Controller,
	Get,
	Param,
	ParseUUIDPipe,
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
import { ReactionsService } from '../services/reactions.service';
import { JwtAccessTokenGuard } from '@modules/auth/guards/jwt-access-token.guard';
import { RequestWithUser } from 'src/types/requests.type';

@Controller('posts/:id/reactions')
@ApiTags('reactions')
@UseInterceptors(ClassSerializerInterceptor)
export class ReactionsController {
	constructor(private readonly reactionsService: ReactionsService) {}

	@Post()
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard)
	@ApiOperation({ summary: 'Toggle like / reaction on a post' })
	@ApiParam({ name: 'id', description: 'Post UUID' })
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				type: { type: 'string', example: 'like', default: 'like' },
			},
		},
		required: false,
	})
	async toggle(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: RequestWithUser,
		@Body('type') type = 'like',
	) {
		return this.reactionsService.toggleReaction(id, request.user.id, type);
	}

	@Get('me')
	@ApiBearerAuth('token')
	@UseGuards(JwtAccessTokenGuard)
	@ApiOperation({ summary: 'Check if current user reacted to this post' })
	@ApiParam({ name: 'id', description: 'Post UUID' })
	async getMyReaction(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: RequestWithUser,
	) {
		return this.reactionsService.getMyReaction(id, request.user.id);
	}

	@Get('count')
	@ApiOperation({ summary: 'Get total reaction count for a post (Public)' })
	@ApiParam({ name: 'id', description: 'Post UUID' })
	async getCount(@Param('id', ParseUUIDPipe) id: string) {
		const count = await this.reactionsService.getReactionCount(id);
		return { reactionCount: count };
	}
}

