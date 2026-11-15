import {
	ForbiddenException,
	Injectable,
	NotFoundException,
	Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../entities/setting.entity';
import { UpdateSettingDto } from '../dto/update-setting.dto';
import { AppCacheService } from '@modules/shared/base/cache/app-cache.service';
import { AppCacheKeyBuilder } from '@modules/shared/base/cache/app-cache-key.builder';

const SETTINGS_CACHE_NAMESPACE = 'settings';
const SETTINGS_CACHE_TTL_MS = 60_000;

@Injectable()
export class SettingsService {
	constructor(
		@InjectRepository(Setting)
		private readonly settingRepo: Repository<Setting>,
		@Optional() private readonly cache?: AppCacheService,
	) {}

	async getAll(isAdmin = false): Promise<Setting[]> {
		if (!this.cache) {
			return this.fetchSettings(isAdmin);
		}

		return this.cache.getOrSet(
			SETTINGS_CACHE_NAMESPACE,
			AppCacheKeyBuilder.build({
				route: '/settings',
				params: { scope: isAdmin ? 'admin' : 'public' },
			}),
			SETTINGS_CACHE_TTL_MS,
			() => this.fetchSettings(isAdmin),
		);
	}

	private async fetchSettings(isAdmin: boolean): Promise<Setting[]> {
		if (isAdmin) {
			return this.settingRepo.find({ order: { key: 'ASC' } });
		}
		return this.settingRepo.find({
			where: { isPublic: true },
			order: { key: 'ASC' },
		});
	}

	async getByKey(key: string, isAdmin = false): Promise<Setting> {
		const setting = await this.settingRepo.findOneBy({ key });
		if (!setting) {
			throw new NotFoundException(`Setting with key "${key}" not found`);
		}

		if (!setting.isPublic && !isAdmin) {
			throw new ForbiddenException(`Setting "${key}" is private`);
		}

		return setting;
	}

	async upsert(key: string, dto: UpdateSettingDto): Promise<Setting> {
		let setting = await this.settingRepo.findOneBy({ key });

		if (!setting) {
			setting = this.settingRepo.create({
				key,
				value: dto.value,
				description: dto.description,
				isPublic: dto.isPublic ?? false,
			});
		} else {
			setting.value = dto.value;
			if (dto.description !== undefined) {
				setting.description = dto.description;
			}
			if (dto.isPublic !== undefined) {
				setting.isPublic = dto.isPublic;
			}
		}

		const saved = await this.settingRepo.save(setting);
		await this.cache?.invalidate(SETTINGS_CACHE_NAMESPACE);
		return saved;
	}
}

