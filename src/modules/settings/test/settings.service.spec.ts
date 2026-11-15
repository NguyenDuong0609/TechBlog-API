import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SettingsService } from '../services/settings.service';

describe('SettingsService', () => {
	let service: SettingsService;
	let settingRepo: Record<string, any>;
	let cache: Record<string, any>;

	beforeEach(() => {
		settingRepo = {
			find: jest.fn(async () => [
				{ key: 'site_name', value: 'Tech Blog', isPublic: true },
				{ key: 'smtp_host', value: 'smtp.internal', isPublic: false },
			]),
			findOneBy: jest.fn(async ({ key }) => {
				if (key === 'site_name') {
					return { key: 'site_name', value: 'Tech Blog', isPublic: true };
				}
				if (key === 'smtp_host') {
					return { key: 'smtp_host', value: 'smtp.internal', isPublic: false };
				}
				return null;
			}),
			create: jest.fn((dto) => dto),
			save: jest.fn(async (entity) => entity),
		};

		cache = {
			getOrSet: jest.fn(async (_ns, _key, _ttl, fn) => fn()),
			invalidate: jest.fn(async () => undefined),
		};

		service = new SettingsService(settingRepo as never, cache as never);
	});

	it('should return public settings for guest users', async () => {
		settingRepo.find.mockResolvedValueOnce([
			{ key: 'site_name', value: 'Tech Blog', isPublic: true },
		]);

		const result = await service.getAll(false);
		expect(result).toHaveLength(1);
		expect(result[0].key).toBe('site_name');
	});

	it('should allow admin to get private settings', async () => {
		const setting = await service.getByKey('smtp_host', true);
		expect(setting).toBeDefined();
		expect(setting.key).toBe('smtp_host');
	});

	it('should throw ForbiddenException if guest tries to get private setting', async () => {
		await expect(service.getByKey('smtp_host', false)).rejects.toThrow(
			ForbiddenException,
		);
	});

	it('should throw NotFoundException if setting key does not exist', async () => {
		await expect(service.getByKey('unknown_key', true)).rejects.toThrow(
			NotFoundException,
		);
	});

	it('should upsert setting and invalidate cache', async () => {
		const updated = await service.upsert('site_name', {
			value: 'New Blog Name',
			isPublic: true,
		});

		expect(updated.value).toBe('New Blog Name');
		expect(settingRepo.save).toHaveBeenCalled();
		expect(cache.invalidate).toHaveBeenCalledWith('settings');
	});
});

