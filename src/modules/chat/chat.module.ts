import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatConversation } from './entities/chat-conversation.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { User } from '../users/entities/user.entity';
import { ChatService } from './services/chat.service';
import { ChatController } from './controllers/chat.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([ChatConversation, ChatMessage, User]),
		NotificationsModule,
	],
	controllers: [ChatController],
	providers: [ChatService],
	exports: [ChatService],
})
export class ChatModule {}

