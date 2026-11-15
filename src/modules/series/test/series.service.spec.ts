import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SeriesService } from '../services/series.service';
import { USER_ROLE } from '@modules/user-roles/entities/user-role.entity';

describe('SeriesService', () => {
	let service: SeriesService;
	let seriesRepo: Record<string, any>;
	let seriesPostRepo: Record<string, any>;
	let postRepo: Record<string, any>;

	beforeEach(() => {
		seriesRepo = {
			count: jest.fn(async () => 0),
			create: jest.fn((dto) => ({ id: 'series-1', ...dto })),
			save: jest.fn(async (entity) => entity),
			findOneBy: jest.fn(async ({ id }) => ({
				id,
				title: 'Series Title',
				slug: 'series-title',
				authorId: 'author-1',
			})),
			findOne: jest.fn(async () => null),
			find: jest.fn(async () => []),
			softRemove: jest.fn(async (entity) => entity),
			createQueryBuilder: jest.fn(() => ({
				leftJoinAndSelect: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				getOne: jest.fn().mockResolvedValue({ id: 'series-1', slug: 'series-slug' }),
			})),
		};

		seriesPostRepo = {
			findOne: jest.fn(),
			find: jest.fn(async () => []),
			create: jest.fn((dto) => dto),
			save: jest.fn(async (dto) => dto),
			remove: jest.fn(async (dto) => dto),
		};

		postRepo = {
			findOneBy: jest.fn(async ({ id }) => ({ id, authorId: 'author-1' })),
		};

		service = new SeriesService(
			seriesRepo as never,
			seriesPostRepo as never,
			postRepo as never,
		);
	});

	it('should create a series with generated slug', async () => {
		const dto = { title: 'My Awesome Series', description: 'Description' };
		const result = await service.create(dto, 'author-1');

		expect(result).toBeDefined();
		expect(result.slug).toBe('my-awesome-series');
		expect(seriesRepo.save).toHaveBeenCalled();
	});

	it('should throw ForbiddenException if updating series without ownership or admin', async () => {
		await expect(
			service.update(
				'series-1',
				{ title: 'New Title' },
				{ id: 'different-user', role: USER_ROLE.USER },
			),
		).rejects.toThrow(ForbiddenException);
	});

	it('should allow admin to update any series', async () => {
		const result = await service.update(
			'series-1',
			{ title: 'Updated Title' },
			{ id: 'admin-1', role: USER_ROLE.ADMIN },
		);

		expect(result.title).toBe('Updated Title');
	});

	it('should throw NotFoundException if series does not exist', async () => {
		seriesRepo.findOneBy.mockResolvedValueOnce(null);
		await expect(
			service.remove('nonexistent', { id: 'author-1', role: USER_ROLE.AUTHOR }),
		).rejects.toThrow(NotFoundException);
	});
});
