import { BaseEntity } from '@modules/shared/base/base.entity';
import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
} from 'typeorm';
import { NotificationType } from '@common/enums';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
@Index('idx_notifications_user_unread', ['userId', 'isRead', 'created_at'])
@Index('idx_notifications_user_id', ['userId'])
export class Notification extends BaseEntity {
	@Column({
		type: 'enum',
		enum: NotificationType,
	})
	type: NotificationType;

	@Column({ type: 'varchar', length: 255 })
	title: string;

	@Column({ type: 'text', nullable: true })
	message?: string;

	@Column({ type: 'jsonb', nullable: true })
	data?: {
		postId?: string;
		postSlug?: string;
		commentId?: string;
		conversationId?: string;
		reason?: string;
		[key: string]: any;
	};

	@Column({ type: 'boolean', default: false })
	isRead: boolean;

	@Column({ type: 'uuid' })
	userId: string;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId' })
	user: User;

	@Column({ type: 'uuid', nullable: true })
	actorId?: string;

	@ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
	@JoinColumn({ name: 'actorId' })
	actor?: User;
}

