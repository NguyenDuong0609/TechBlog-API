import { BaseEntity } from '@modules/shared/base/base.entity';
import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_conversations')
export class ChatConversation extends BaseEntity {
	@ManyToMany(() => User)
	@JoinTable({
		name: 'conversation_participants',
		joinColumn: { name: 'conversationId', referencedColumnName: 'id' },
		inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
	})
	participants: User[];

	@Column({ type: 'timestamp', nullable: true })
	lastMessageAt: Date;

	@OneToMany(() => ChatMessage, (msg) => msg.conversation)
	messages: ChatMessage[];
}
