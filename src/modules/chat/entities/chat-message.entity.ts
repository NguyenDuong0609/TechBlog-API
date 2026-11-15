import { BaseEntity } from '@modules/shared/base/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ChatConversation } from './chat-conversation.entity';

@Entity('chat_messages')
export class ChatMessage extends BaseEntity {
	@Column({ type: 'uuid' })
	conversationId: string;

	@ManyToOne(() => ChatConversation, (conv) => conv.messages, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'conversationId' })
	conversation: ChatConversation;

	@Column({ type: 'uuid' })
	senderId: string;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'senderId' })
	sender: User;

	@Column({ type: 'text' })
	content: string;

	@Column({ type: 'boolean', default: false })
	isRead: boolean;
}
