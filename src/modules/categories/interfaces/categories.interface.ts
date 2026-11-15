import { Category } from '../entities/category.entity';
import { BaseRepositoryInterface } from '@repositories/base/base.interface.repository';

export interface CategoriesRepositoryInterface
	extends BaseRepositoryInterface<Category> {
	findBySlug(slug: string): Promise<Category | null>;
	checkSlugExists(slug: string, excludeId?: string): Promise<boolean>;
	incrementPostCount(id: string, step?: number): Promise<void>;
	decrementPostCount(id: string, step?: number): Promise<void>;
}

