import { BaseEntity } from '@modules/shared/base/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Series } from './series.entity';
import { Post } from '../../posts/entities/post.entity';

@Entity('series_posts')
@Unique('uq_series_post', ['seriesId', 'postId'])
@Index('idx_series_posts_series_id', ['seriesId'])
@Index('idx_series_posts_post_id', ['postId'])
@Index('idx_series_posts_order', ['seriesId', 'order'])
export class SeriesPost extends BaseEntity {
	@Column({ type: 'uuid' })
	seriesId: string;

	@ManyToOne(() => Series, (series) => series.seriesPosts, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'seriesId' })
	series: Series;

	@Column({ type: 'uuid' })
	postId: string;

	@ManyToOne(() => Post, (post) => post.seriesPosts, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'postId' })
	post: Post;

	@Column({ type: 'int', default: 0 })
	order: number;
}

