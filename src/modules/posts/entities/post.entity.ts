import { BaseEntity } from '@modules/shared/base/base.entity';
import {
	Column,
	Entity,
	Index,
	JoinColumn,
	JoinTable,
	ManyToMany,
	ManyToOne,
	OneToMany,
} from 'typeorm';
import { PostLevel, PostStatus } from '@common/enums';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { SeriesPost } from '../../series/entities/series-post.entity';

@Entity('posts')
@Index('idx_posts_slug', ['slug'], { unique: true })
@Index('idx_posts_status', ['status'])
@Index('idx_posts_author_id', ['authorId'])
@Index('idx_posts_published_at', ['publishedAt'])
@Index('idx_posts_category_id', ['categoryId'])
@Index('idx_posts_level', ['level'])
export class Post extends BaseEntity {
	@Column({ type: 'varchar', length: 255 })
	title: string;

	@Column({ type: 'varchar', length: 255, unique: true })
	slug: string;

	@Column({ type: 'text' })
	content: string;

	@Column({ type: 'text', nullable: true })
	excerpt?: string;

	@Column({ type: 'varchar', length: 500, nullable: true })
	coverImage?: string;

	@Column({
		type: 'enum',
		enum: PostStatus,
		default: PostStatus.DRAFT,
	})
	status: PostStatus;

	@Column({
		type: 'enum',
		enum: PostLevel,
		default: PostLevel.BASIC,
	})
	level: PostLevel;

	@Column({ type: 'int', default: 0 })
	viewCount: number;

	@Column({ type: 'int', default: 1 })
	readingTime: number;

	@Column({ type: 'int', default: 0 })
	reactionCount: number;

	@Column({ type: 'int', default: 0 })
	commentCount: number;

	@Column({ type: 'boolean', default: false })
	isFeatured: boolean;

	@Column({ type: 'boolean', default: false })
	isEditorsChoice: boolean;

	@Column({ type: 'timestamptz', nullable: true })
	publishedAt?: Date;

	@Column({ type: 'varchar', length: 255, nullable: true })
	metaTitle?: string;

	@Column({ type: 'varchar', length: 500, nullable: true })
	metaDescription?: string;

	@Column({ type: 'text', nullable: true })
	rejectReason?: string;

	@Column({ type: 'uuid' })
	authorId: string;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'authorId' })
	author: User;

	@Column({ type: 'uuid', nullable: true })
	categoryId?: string;

	@ManyToOne(() => Category, (category) => category.posts, {
		nullable: true,
		onDelete: 'SET NULL',
	})
	@JoinColumn({ name: 'categoryId' })
	category?: Category;

	@ManyToMany(() => Tag, (tag) => tag.posts, { cascade: false })
	@JoinTable({
		name: 'post_tags',
		joinColumn: { name: 'postId', referencedColumnName: 'id' },
		inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
	})
	tags: Tag[];

	@OneToMany(() => SeriesPost, (seriesPost) => seriesPost.post)
	seriesPosts?: SeriesPost[];
}

