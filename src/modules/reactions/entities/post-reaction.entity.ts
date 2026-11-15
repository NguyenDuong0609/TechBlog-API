import { BaseEntity } from '@modules/shared/base/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { User } from '../../users/entities/user.entity';

@Entity('post_reactions')
@Unique('uq_post_reactions', ['postId', 'userId', 'type'])
@Index('idx_post_reactions_post', ['postId'])
@Index('idx_post_reactions_user', ['userId'])
export class PostReaction extends BaseEntity {
	@Column({ type: 'uuid' })
	postId: string;

	@ManyToOne(() => Post, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'postId' })
	post: Post;

	@Column({ type: 'uuid' })
	userId: string;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId' })
	user: User;

	@Column({ type: 'varchar', length: 20, default: 'like' })
	type: string;
}

