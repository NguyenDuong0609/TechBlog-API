import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '@modules/categories/entities/category.entity';
import { CategoriesRepositoryInterface } from '@modules/categories/interfaces/categories.interface';
import { BaseRepositoryAbstract } from './base/base.abstract.repository';

@Injectable()
export class CategoryRepository
	extends BaseRepositoryAbstract<Category>
	implements CategoriesRepositoryInterface
{
	constructor(
		@InjectRepository(Category)
		private readonly categoryRepository: Repository<Category>,
	) {
		super(categoryRepository);
	}

	async findBySlug(slug: string): Promise<Category | null> {
		return this.categoryRepository.findOne({
			where: { slug },
		});
	}

	async checkSlugExists(slug: string, excludeId?: string): Promise<boolean> {
		const query = this.categoryRepository
			.createQueryBuilder('category')
			.where('category.slug = :slug', { slug });

		if (excludeId) {
			query.andWhere('category.id != :excludeId', { excludeId });
		}

		const count = await query.getCount();
		return count > 0;
	}

	async incrementPostCount(id: string, step = 1): Promise<void> {
		await this.categoryRepository.increment({ id }, 'postCount', step);
	}

	async decrementPostCount(id: string, step = 1): Promise<void> {
		await this.categoryRepository.decrement({ id }, 'postCount', step);
	}
}

