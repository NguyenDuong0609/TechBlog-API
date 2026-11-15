import { BaseEntity } from '@modules/shared/base/base.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { Post } from '../../posts/entities/post.entity';

@Entity('categories')
export class Category extends BaseEntity {
	@Column({ type: 'varchar', length: 100 })
	name: string;

	@Index('idx_categories_slug', { unique: true })
	@Column({ type: 'varchar', length: 120, unique: true })
	slug: string;

	@Column({ type: 'text', nullable: true })
	description?: string;

	@Column({ type: 'varchar', length: 50, nullable: true })
	color?: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	icon?: string;

	@Column({ type: 'int', default: 0 })
	postCount: number;

	@OneToMany(() => Post, (post) => post.category)
	posts: Post[];
}

