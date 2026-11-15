import { Test, TestingModule } from '@nestjs/testing';
import { TagsService } from '../services/tags.service';
import { BadRequestException } from '@nestjs/common';

describe('TagsService', () => {
	let service: TagsService;
	let mockRepo: any;

	beforeEach(async () => {
		mockRepo = {
			create: jest.fn().mockImplementation((dto) => Promise.resolve({ id: 'tag-1', ...dto })),
			findOneById: jest.fn(),
			findBySlug: jest.fn(),
			findByName: jest.fn(),
			checkSlugExists: jest.fn().mockResolvedValue(false),
			findAll: jest.fn().mockResolvedValue({ items: [], count: 0 }),
			findPopular: jest.fn().mockResolvedValue([]),
			update: jest.fn(),
			softDelete: jest.fn().mockResolvedValue(true),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TagsService,
				{
					provide: 'TagsRepositoryInterface',
					useValue: mockRepo,
				},
			],
		}).compile();

		service = module.get<TagsService>(TagsService);
	});

	it('should return existing tag in findOrCreate without creating duplicate', async () => {
		const existing = { id: 'tag-1', name: 'Docker', slug: 'docker', usageCount: 5 };
		mockRepo.findByName.mockResolvedValue(existing);

		const result = await service.findOrCreate('Docker');
		expect(result).toBe(existing);
		expect(mockRepo.create).not.toHaveBeenCalled();
	});

	it('should create new tag in findOrCreate if not found', async () => {
		mockRepo.findByName.mockResolvedValue(null);

		const result = await service.findOrCreate('Kubernetes');
		expect(mockRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'Kubernetes',
				slug: 'kubernetes',
				usageCount: 0,
			}),
		);
		expect(result).toHaveProperty('id', 'tag-1');
	});

	it('should prevent deleting tag when usageCount > 0', async () => {
		mockRepo.findOneById.mockResolvedValue({ id: 'tag-1', usageCount: 2 });
		await expect(service.remove('tag-1')).rejects.toThrow(BadRequestException);
	});
});

