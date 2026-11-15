import { Tag } from '../entities/tag.entity';
import { BaseRepositoryInterface } from '@repositories/base/base.interface.repository';

export interface TagsRepositoryInterface extends BaseRepositoryInterface<Tag> {
	findBySlug(slug: string): Promise<Tag | null>;
	findByName(name: string): Promise<Tag | null>;
	checkSlugExists(slug: string, excludeId?: string): Promise<boolean>;
	findPopular(limit: number): Promise<Tag[]>;
	incrementUsage(id: string, step?: number): Promise<void>;
	decrementUsage(id: string, step?: number): Promise<void>;
}

