import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '@modules/tags/entities/tag.entity';
import { TagsRepositoryInterface } from '@modules/tags/interfaces/tags.interface';
import { BaseRepositoryAbstract } from './base/base.abstract.repository';

@Injectable()
export class TagRepository
	extends BaseRepositoryAbstract<Tag>
	implements TagsRepositoryInterface
{
	constructor(
		@InjectRepository(Tag)
		private readonly tagRepository: Repository<Tag>,
	) {
		super(tagRepository);
	}

	async findBySlug(slug: string): Promise<Tag | null> {
		return this.tagRepository.findOne({ where: { slug } });
	}

	async findByName(name: string): Promise<Tag | null> {
		return this.tagRepository
			.createQueryBuilder('tag')
			.where('LOWER(tag.name) = LOWER(:name)', { name: name.trim() })
			.getOne();
	}

	async checkSlugExists(slug: string, excludeId?: string): Promise<boolean> {
		const query = this.tagRepository
			.createQueryBuilder('tag')
			.where('tag.slug = :slug', { slug });

		if (excludeId) {
			query.andWhere('tag.id != :excludeId', { excludeId });
		}

		const count = await query.getCount();
		return count > 0;
	}

	async findPopular(limit = 10): Promise<Tag[]> {
		return this.tagRepository.find({
			order: { usageCount: 'DESC', name: 'ASC' },
			take: limit,
		});
	}

	async incrementUsage(id: string, step = 1): Promise<void> {
		await this.tagRepository.increment({ id }, 'usageCount', step);
	}

	async decrementUsage(id: string, step = 1): Promise<void> {
		await this.tagRepository
			.createQueryBuilder()
			.update(Tag)
			.set({
				usageCount: () =>
					`GREATEST(0, "usageCount" - ${Math.max(1, step)})`,
			})
			.where('id = :id', { id })
			.execute();
	}
}

