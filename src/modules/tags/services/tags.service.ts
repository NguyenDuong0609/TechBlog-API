import {
	BadRequestException,
	ConflictException,
	Inject,
	Injectable,
	NotFoundException,
	Optional,
} from '@nestjs/common';
import { DeepPartial, EntityManager, FindManyOptions } from 'typeorm';
import { BaseServiceAbstract } from 'src/services/base/base.abstract.service';
import { Tag } from '../entities/tag.entity';
import { TagsRepositoryInterface } from '../interfaces/tags.interface';
import { CreateTagDto } from '../dto/create-tag.dto';
import { UpdateTagDto } from '../dto/update-tag.dto';
import { AppCacheService } from '@modules/shared/base/cache/app-cache.service';
import { AppCacheKeyBuilder } from '@modules/shared/base/cache/app-cache-key.builder';
import { generateUniqueSlug, slugify } from '@common/utils';
import { FindAllResponse } from 'src/types/common.type';

export const TAGS_CACHE_NAMESPACE = 'tags';
const TAGS_CACHE_TTL_MS = 60_000;

@Injectable()
export class TagsService extends BaseServiceAbstract<Tag> {
	constructor(
		@Inject('TagsRepositoryInterface')
		private readonly tagRepository: TagsRepositoryInterface,
		@Optional() private readonly cache?: AppCacheService,
	) {
		super(tagRepository);
	}

	async create(dto: CreateTagDto): Promise<Tag> {
		const trimmedName = dto.name.trim();
		const existingByName = await this.tagRepository.findByName(trimmedName);
		if (existingByName) {
			throw new ConflictException(`Tag "${trimmedName}" already exists`);
		}

		const slug = dto.slug
			? await this.ensureUniqueSlug(dto.slug)
			: await this.generateSlug(trimmedName);

		const created = await this.tagRepository.create({
			...dto,
			name: trimmedName,
			slug,
			usageCount: 0,
		});

		await this.cache?.invalidate(TAGS_CACHE_NAMESPACE);
		return created;
	}

	async createInTransaction(
		dto: CreateTagDto,
		manager: EntityManager,
	): Promise<Tag> {
		const repo = manager.getRepository(Tag);
		const trimmedName = dto.name.trim();

		const existing = await repo
			.createQueryBuilder('tag')
			.where('LOWER(tag.name) = LOWER(:name)', { name: trimmedName })
			.getOne();
		if (existing) {
			throw new ConflictException(`Tag "${trimmedName}" already exists`);
		}

		const slug = dto.slug
			? await this.ensureUniqueSlug(dto.slug)
			: await this.generateSlug(trimmedName);

		const tag = repo.create({
			...dto,
			name: trimmedName,
			slug,
			usageCount: 0,
		});
		const saved = await repo.save(tag);

		await this.cache?.invalidate(TAGS_CACHE_NAMESPACE);
		return saved;
	}

	async findOrCreate(name: string, manager?: EntityManager): Promise<Tag> {
		const trimmedName = name.trim();
		if (!trimmedName) {
			throw new BadRequestException('Tag name cannot be empty');
		}

		if (manager) {
			const repo = manager.getRepository(Tag);
			let tag = await repo
				.createQueryBuilder('tag')
				.where('LOWER(tag.name) = LOWER(:name)', { name: trimmedName })
				.getOne();
			if (!tag) {
				const slug = await this.generateSlug(trimmedName);
				tag = await repo.save(
					repo.create({
						name: trimmedName,
						slug,
						usageCount: 0,
					}),
				);
				await this.cache?.invalidate(TAGS_CACHE_NAMESPACE);
			}
			return tag;
		}

		let tag = await this.tagRepository.findByName(trimmedName);
		if (!tag) {
			const slug = await this.generateSlug(trimmedName);
			tag = await this.tagRepository.create({
				name: trimmedName,
				slug,
				usageCount: 0,
			});
			await this.cache?.invalidate(TAGS_CACHE_NAMESPACE);
		}
		return tag;
	}

	async findOrCreateMany(
		names: string[],
		manager?: EntityManager,
	): Promise<Tag[]> {
		const uniqueNames = Array.from(
			new Set(names.map((n) => n.trim()).filter((n) => n.length > 0)),
		);
		const results: Tag[] = [];
		for (const name of uniqueNames) {
			results.push(await this.findOrCreate(name, manager));
		}
		return results;
	}

	async findPopular(limit = 10): Promise<Tag[]> {
		if (!this.cache) {
			return this.tagRepository.findPopular(limit);
		}

		return this.cache.getOrSet(
			TAGS_CACHE_NAMESPACE,
			AppCacheKeyBuilder.build({
				route: '/tags/popular',
				query: { limit },
			}),
			TAGS_CACHE_TTL_MS,
			() => this.tagRepository.findPopular(limit),
		);
	}

	override async findAll(
		options?: FindManyOptions<Tag>,
	): Promise<FindAllResponse<Tag>> {
		if (!this.cache) {
			return super.findAll(options);
		}

		return this.cache.getOrSet(
			TAGS_CACHE_NAMESPACE,
			AppCacheKeyBuilder.build({
				route: '/tags',
				query: {
					skip: options?.skip ?? 0,
					take: options?.take ?? 50,
				},
			}),
			TAGS_CACHE_TTL_MS,
			() => super.findAll(options),
		);
	}

	async findBySlug(slug: string): Promise<Tag> {
		if (!this.cache) {
			const tag = await this.tagRepository.findBySlug(slug);
			if (!tag) {
				throw new NotFoundException(`Tag with slug "${slug}" not found`);
			}
			return tag;
		}

		return this.cache.getOrSet(
			TAGS_CACHE_NAMESPACE,
			AppCacheKeyBuilder.build({
				route: '/tags/:slug',
				params: { slug },
			}),
			TAGS_CACHE_TTL_MS,
			async () => {
				const tag = await this.tagRepository.findBySlug(slug);
				if (!tag) {
					throw new NotFoundException(`Tag with slug "${slug}" not found`);
				}
				return tag;
			},
		);
	}

	override async update(id: string, updateDto: UpdateTagDto): Promise<Tag> {
		const existing = await this.tagRepository.findOneById(id);
		if (!existing) {
			throw new NotFoundException(`Tag #${id} not found`);
		}

		let slug = existing.slug;
		if (updateDto.slug && updateDto.slug !== existing.slug) {
			slug = await this.ensureUniqueSlug(updateDto.slug, id);
		} else if (updateDto.name && updateDto.name !== existing.name && !updateDto.slug) {
			slug = await this.generateSlug(updateDto.name, id);
		}

		const updated = await this.tagRepository.update(id, {
			...updateDto,
			slug,
		});

		await this.cache?.invalidate(TAGS_CACHE_NAMESPACE);
		return updated;
	}

	async updateInTransaction(
		id: string,
		updateDto: UpdateTagDto,
		manager: EntityManager,
	): Promise<Tag> {
		const repo = manager.getRepository(Tag);
		const existing = await repo.findOneBy({ id });
		if (!existing) {
			throw new NotFoundException(`Tag #${id} not found`);
		}

		let slug = existing.slug;
		if (updateDto.slug && updateDto.slug !== existing.slug) {
			slug = await this.ensureUniqueSlug(updateDto.slug, id);
		} else if (updateDto.name && updateDto.name !== existing.name && !updateDto.slug) {
			slug = await this.generateSlug(updateDto.name, id);
		}

		Object.assign(existing, { ...updateDto, slug });
		const saved = await repo.save(existing);

		await this.cache?.invalidate(TAGS_CACHE_NAMESPACE);
		return saved;
	}

	override async remove(id: string): Promise<boolean> {
		const existing = await this.tagRepository.findOneById(id);
		if (!existing) {
			throw new NotFoundException(`Tag #${id} not found`);
		}

		if (existing.usageCount > 0) {
			throw new BadRequestException(
				`Cannot delete tag in use (usageCount: ${existing.usageCount})`,
			);
		}

		const result = await super.remove(id);
		await this.cache?.invalidate(TAGS_CACHE_NAMESPACE);
		return result;
	}

	async removeInTransaction(id: string, manager: EntityManager): Promise<void> {
		const repo = manager.getRepository(Tag);
		const existing = await repo.findOneBy({ id });
		if (!existing) {
			throw new NotFoundException(`Tag #${id} not found`);
		}

		if (existing.usageCount > 0) {
			throw new BadRequestException(
				`Cannot delete tag in use (usageCount: ${existing.usageCount})`,
			);
		}

		await repo.softRemove(existing);
		await this.cache?.invalidate(TAGS_CACHE_NAMESPACE);
	}

	async incrementUsage(id: string, step = 1): Promise<void> {
		await this.tagRepository.incrementUsage(id, step);
		await this.cache?.invalidate(TAGS_CACHE_NAMESPACE);
	}

	async decrementUsage(id: string, step = 1): Promise<void> {
		await this.tagRepository.decrementUsage(id, step);
		await this.cache?.invalidate(TAGS_CACHE_NAMESPACE);
	}

	private async generateSlug(name: string, excludeId?: string): Promise<string> {
		return generateUniqueSlug(name, (s) =>
			this.tagRepository.checkSlugExists(s, excludeId),
		);
	}

	private async ensureUniqueSlug(
		slug: string,
		excludeId?: string,
	): Promise<string> {
		const exists = await this.tagRepository.checkSlugExists(slug, excludeId);
		if (exists) {
			throw new ConflictException(`Tag slug "${slug}" is already in use`);
		}
		return slug;
	}
}

