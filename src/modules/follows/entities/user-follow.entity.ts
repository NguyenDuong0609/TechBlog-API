import { BaseEntity } from '@modules/shared/base/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_follows')
@Unique('uq_user_follows', ['followerId', 'followingId'])
@Index('idx_user_follows_follower', ['followerId'])
@Index('idx_user_follows_following', ['followingId'])
export class UserFollow extends BaseEntity {
	@Column({ type: 'uuid' })
	followerId: string;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'followerId' })
	follower: User;

	@Column({ type: 'uuid' })
	followingId: string;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'followingId' })
	following: User;
}

