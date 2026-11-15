import { BaseEntity } from '@modules/shared/base/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SeriesPost } from './series-post.entity';

@Entity('series')
@Index('idx_series_slug', ['slug'], { unique: true })
@Index('idx_series_author_id', ['authorId'])
export class Series extends BaseEntity {
	@Column({ type: 'varchar', length: 200 })
	title: string;

	@Column({ type: 'varchar', length: 220, unique: true })
	slug: string;

	@Column({ type: 'text', nullable: true })
	description?: string;

	@Column({ type: 'varchar', length: 500, nullable: true })
	coverImage?: string;

	@Column({ type: 'int', default: 0 })
	postCount: number;

	@Column({ type: 'uuid' })
	authorId: string;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'authorId' })
	author: User;

	@OneToMany(() => SeriesPost, (seriesPost) => seriesPost.series, {
		cascade: true,
	})
	seriesPosts: SeriesPost[];
}

