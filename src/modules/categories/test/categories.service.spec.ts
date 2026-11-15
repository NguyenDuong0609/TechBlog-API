import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoriesService } from '../services/categories.service';
import { Category } from '../entities/category.entity';
import { Post } from '../../posts/entities/post.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CategoriesService', () => {
	let service: CategoriesService;
	let mockRepo: any;
	let mockPostRepo: any;

	beforeEach(async () => {
		mockRepo = {
			create: jest.fn().mockImplementation((dto) => Promise.resolve({ id: 'cat-1', ...dto })),
			findOneById: jest.fn(),
			findBySlug: jest.fn(),
			checkSlugExists: jest.fn().mockResolvedValue(false),
			findAll: jest.fn().mockResolvedValue({ items: [], count: 0 }),
			update: jest.fn(),
			softDelete: jest.fn().mockResolvedValue(true),
		};

		mockPostRepo = {
			count: jest.fn().mockResolvedValue(0),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CategoriesService,
				{
					provide: 'CategoriesRepositoryInterface',
					useValue: mockRepo,
				},
				{
					provide: getRepositoryToken(Post),
					useValue: mockPostRepo,
				},
			],
		}).compile();

		service = module.get<CategoriesService>(CategoriesService);
	});

	it('should create a category with auto-generated slug', async () => {
		const result = await service.create({
			name: 'DevOps & Cloud',
		});

		expect(mockRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'DevOps & Cloud',
				slug: 'devops-cloud',
				postCount: 0,
			}),
		);
		expect(result).toHaveProperty('id', 'cat-1');
	});

	it('should throw NotFoundException when category slug not found', async () => {
		mockRepo.findBySlug.mockResolvedValue(null);
		await expect(service.findBySlug('non-existent')).rejects.toThrow(
			NotFoundException,
		);
	});

	it('should prevent deleting category when posts are linked', async () => {
		mockRepo.findOneById.mockResolvedValue({ id: 'cat-1', name: 'DevOps' });
		mockPostRepo.count.mockResolvedValue(5);

		await expect(service.remove('cat-1')).rejects.toThrow(BadRequestException);
	});
});

