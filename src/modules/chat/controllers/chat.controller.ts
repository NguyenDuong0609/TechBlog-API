import {
	Body,
	ClassSerializerInterceptor,
	Controller,
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
	ApiOperation,
	ApiParam,
	ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ChatService } from '../services/chat.service';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { QueryMessagesDto } from '../dto/query-messages.dto';
import { JwtAccessTokenGuard } from '@modules/auth/guards/jwt-access-token.guard';
import { RequestWithUser } from 'src/types/requests.type';

@Controller('chat')
@ApiTags('chat')
@ApiBearerAuth('token')
@UseGuards(JwtAccessTokenGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	@Get('conversations')
	@ApiOperation({ summary: 'List all conversations for current user' })
	async getMyConversations(@Req() request: RequestWithUser) {
		return this.chatService.getMyConversations(request.user.id);
	}

	@Post('conversations')
	@ApiOperation({ summary: 'Find or create 1-on-1 conversation with target participant' })
	async createConversation(
		@Body() dto: CreateConversationDto,
		@Req() request: RequestWithUser,
	) {
		return this.chatService.findOrCreateConversation(
			request.user.id,
			dto.participantId,
		);
	}

	@Get('conversations/:id/messages')
	@ApiOperation({ summary: 'Get message history of a conversation' })
	@ApiParam({ name: 'id', description: 'Conversation UUID' })
	async getMessages(
		@Param('id', ParseUUIDPipe) id: string,
		@Query() query: QueryMessagesDto,
		@Req() request: RequestWithUser,
	) {
		return this.chatService.getMessages(id, request.user.id, query);
	}

	@Post('conversations/:id/messages')
	@Throttle({ default: { limit: 30, ttl: 60000 } })
	@ApiOperation({ summary: 'Send message in conversation (HTTP fallback)' })
	@ApiParam({ name: 'id', description: 'Conversation UUID' })
	async sendMessage(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: SendMessageDto,
		@Req() request: RequestWithUser,
	) {
		return this.chatService.sendMessage(id, request.user.id, dto.content);
	}

	@Patch('conversations/:id/read')
	@ApiOperation({ summary: 'Mark all messages in conversation as read' })
	@ApiParam({ name: 'id', description: 'Conversation UUID' })
	async markAsRead(
		@Param('id', ParseUUIDPipe) id: string,
		@Req() request: RequestWithUser,
	) {
		await this.chatService.markMessagesAsRead(id, request.user.id);
		return { success: true };
	}
}

