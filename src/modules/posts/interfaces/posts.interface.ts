import { Post } from '../entities/post.entity';
import { BaseRepositoryInterface } from '@repositories/base/base.interface.repository';
import { QueryPostDto } from '../dto/query-post.dto';
import { FindAllResponse } from 'src/types/common.type';

export interface PostsRepositoryInterface extends BaseRepositoryInterface<Post> {
	findBySlug(slug: string): Promise<Post | null>;
	checkSlugExists(slug: string, excludeId?: string): Promise<boolean>;
	findPublic(query: QueryPostDto): Promise<FindAllResponse<Post>>;
	findMyPosts(
		authorId: string,
		query: QueryPostDto,
	): Promise<FindAllResponse<Post>>;
	findAllAdmin(query: QueryPostDto): Promise<FindAllResponse<Post>>;
	incrementView(id: string, step?: number): Promise<void>;
	incrementReaction(id: string, step?: number): Promise<void>;
	decrementReaction(id: string, step?: number): Promise<void>;
	incrementComment(id: string, step?: number): Promise<void>;
	decrementComment(id: string, step?: number): Promise<void>;
}

