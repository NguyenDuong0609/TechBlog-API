import { BaseEntity } from '@modules/shared/base/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('category_follows')
@Unique('uq_category_follows', ['userId', 'categoryId'])
@Index('idx_category_follows_user', ['userId'])
@Index('idx_category_follows_category', ['categoryId'])
export class CategoryFollow extends BaseEntity {
	@Column({ type: 'uuid' })
	userId: string;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId' })
	user: User;

	@Column({ type: 'uuid' })
	categoryId: string;

	@ManyToOne(() => Category, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'categoryId' })
	category: Category;
}

