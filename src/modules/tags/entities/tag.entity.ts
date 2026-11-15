import { BaseEntity } from '@modules/shared/base/base.entity';
import { Column, Entity, Index, ManyToMany } from 'typeorm';
import { Post } from '../../posts/entities/post.entity';

@Entity('tags')
export class Tag extends BaseEntity {
	@Column({ type: 'varchar', length: 80 })
	name: string;

	@Index('idx_tags_slug', { unique: true })
	@Column({ type: 'varchar', length: 100, unique: true })
	slug: string;

	@Column({ type: 'int', default: 0 })
	usageCount: number;

	@ManyToMany(() => Post, (post) => post.tags)
	posts: Post[];
}

