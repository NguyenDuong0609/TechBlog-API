import {
	BadRequestException,
	ConflictException,
	Inject,
	Injectable,
	NotFoundException,
	Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, FindManyOptions, Repository } from 'typeorm';
import { BaseServiceAbstract } from 'src/services/base/base.abstract.service';
import { Category } from '../entities/category.entity';
import { CategoriesRepositoryInterface } from '../interfaces/categories.interface';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { AppCacheService } from '@modules/shared/base/cache/app-cache.service';
import { AppCacheKeyBuilder } from '@modules/shared/base/cache/app-cache-key.builder';
import { generateUniqueSlug } from '@common/utils';
import { Post } from '../../posts/entities/post.entity';
import { FindAllResponse } from 'src/types/common.type';

export const CATEGORIES_CACHE_NAMESPACE = 'categories';
const CATEGORIES_CACHE_TTL_MS = 60_000;

@Injectable()
export class CategoriesService extends BaseServiceAbstract<Category> {
	constructor(
		@Inject('CategoriesRepositoryInterface')
		private readonly categoryRepository: CategoriesRepositoryInterface,
		@InjectRepository(Post)
		private readonly postRepository: Repository<Post>,
		@Optional() private readonly cache?: AppCacheService,
	) {
		super(categoryRepository);
	}

	async create(dto: CreateCategoryDto): Promise<Category> {
		const slug = dto.slug
			? await this.ensureUniqueSlug(dto.slug)
			: await this.generateSlug(dto.name);

		const created = await this.categoryRepository.create({
			...dto,
			slug,
			postCount: 0,
		});

		await this.cache?.invalidate(CATEGORIES_CACHE_NAMESPACE);
		return created;
	}

	async createInTransaction(
		dto: CreateCategoryDto,
		manager: EntityManager,
	): Promise<Category> {
		const repo = manager.getRepository(Category);
		const slug = dto.slug
			? await this.ensureUniqueSlug(dto.slug)
			: await this.generateSlug(dto.name);

		const category = repo.create({
			...dto,
			slug,
			postCount: 0,
		});
		const saved = await repo.save(category);

		await this.cache?.invalidate(CATEGORIES_CACHE_NAMESPACE);
		return saved;
	}

	override async findAll(
		options?: FindManyOptions<Category>,
	): Promise<FindAllResponse<Category>> {
		if (!this.cache) {
			return super.findAll(options);
		}

		return this.cache.getOrSet(
			CATEGORIES_CACHE_NAMESPACE,
			AppCacheKeyBuilder.build({
				route: '/categories',
				query: {
					skip: options?.skip ?? 0,
					take: options?.take ?? 50,
				},
			}),
			CATEGORIES_CACHE_TTL_MS,
			() => super.findAll(options),
		);
	}

	async findBySlug(slug: string): Promise<Category> {
		if (!this.cache) {
			const category = await this.categoryRepository.findBySlug(slug);
			if (!category) {
				throw new NotFoundException(`Category with slug "${slug}" not found`);
			}
			return category;
		}

		return this.cache.getOrSet(
			CATEGORIES_CACHE_NAMESPACE,
			AppCacheKeyBuilder.build({
				route: '/categories/:slug',
				params: { slug },
			}),
			CATEGORIES_CACHE_TTL_MS,
			async () => {
				const category = await this.categoryRepository.findBySlug(slug);
				if (!category) {
					throw new NotFoundException(`Category with slug "${slug}" not found`);
				}
				return category;
			},
		);
	}

	override async update(
		id: string,
		updateDto: UpdateCategoryDto,
	): Promise<Category> {
		const existing = await this.categoryRepository.findOneById(id);
		if (!existing) {
			throw new NotFoundException(`Category #${id} not found`);
		}

		let slug = existing.slug;
		if (updateDto.slug && updateDto.slug !== existing.slug) {
			slug = await this.ensureUniqueSlug(updateDto.slug, id);
		} else if (updateDto.name && updateDto.name !== existing.name && !updateDto.slug) {
			slug = await this.generateSlug(updateDto.name, id);
		}

		const updated = await this.categoryRepository.update(id, {
			...updateDto,
			slug,
		});

		await this.cache?.invalidate(CATEGORIES_CACHE_NAMESPACE);
		return updated;
	}

	async updateInTransaction(
		id: string,
		updateDto: UpdateCategoryDto,
		manager: EntityManager,
	): Promise<Category> {
		const repo = manager.getRepository(Category);
		const existing = await repo.findOneBy({ id });
		if (!existing) {
			throw new NotFoundException(`Category #${id} not found`);
		}

		let slug = existing.slug;
		if (updateDto.slug && updateDto.slug !== existing.slug) {
			slug = await this.ensureUniqueSlug(updateDto.slug, id);
		} else if (updateDto.name && updateDto.name !== existing.name && !updateDto.slug) {
			slug = await this.generateSlug(updateDto.name, id);
		}

		Object.assign(existing, { ...updateDto, slug });
		const saved = await repo.save(existing);

		await this.cache?.invalidate(CATEGORIES_CACHE_NAMESPACE);
		return saved;
	}

	override async remove(id: string): Promise<boolean> {
		const existing = await this.categoryRepository.findOneById(id);
		if (!existing) {
			throw new NotFoundException(`Category #${id} not found`);
		}

		const postCount = await this.postRepository.count({
			where: { categoryId: id },
		});
		if (postCount > 0) {
			throw new BadRequestException(
				`Cannot delete category with ${postCount} existing posts. Reassign posts before deleting.`,
			);
		}

		const result = await super.remove(id);
		await this.cache?.invalidate(CATEGORIES_CACHE_NAMESPACE);
		return result;
	}

	async removeInTransaction(id: string, manager: EntityManager): Promise<void> {
		const repo = manager.getRepository(Category);
		const postRepo = manager.getRepository(Post);

		const existing = await repo.findOneBy({ id });
		if (!existing) {
			throw new NotFoundException(`Category #${id} not found`);
		}

		const postCount = await postRepo.count({
			where: { categoryId: id },
		});
		if (postCount > 0) {
			throw new BadRequestException(
				`Cannot delete category with ${postCount} existing posts. Reassign posts before deleting.`,
			);
		}

		await repo.softRemove(existing);
		await this.cache?.invalidate(CATEGORIES_CACHE_NAMESPACE);
	}

	private async generateSlug(name: string, excludeId?: string): Promise<string> {
		return generateUniqueSlug(name, (s) =>
			this.categoryRepository.checkSlugExists(s, excludeId),
		);
	}

	private async ensureUniqueSlug(
		slug: string,
		excludeId?: string,
	): Promise<string> {
		const exists = await this.categoryRepository.checkSlugExists(slug, excludeId);
		if (exists) {
			throw new ConflictException(`Category slug "${slug}" is already in use`);
		}
		return slug;
	}
}

