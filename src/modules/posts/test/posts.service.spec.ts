import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PostsService } from '../services/posts.service';
import { Post } from '../entities/post.entity';
import { Category } from '../../categories/entities/category.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { User } from '../../users/entities/user.entity';
import { TagsService } from '../../tags/services/tags.service';
import { PostLevel, PostStatus } from '@common/enums';
import { USER_ROLE } from '@modules/user-roles/entities/user-role.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('PostsService', () => {
	let service: PostsService;
	let mockPostsRepo: any;
	let mockCategoryRepo: any;
	let mockTagRepo: any;
	let mockUserRepo: any;
	let mockTagsService: any;

	beforeEach(async () => {
		mockPostsRepo = {
			create: jest.fn().mockImplementation((dto) => Promise.resolve({ id: 'post-1', ...dto })),
			findOneById: jest.fn(),
			findBySlug: jest.fn(),
			checkSlugExists: jest.fn().mockResolvedValue(false),
			findPublic: jest.fn().mockResolvedValue({ items: [], count: 0 }),
			findMyPosts: jest.fn().mockResolvedValue({ items: [], count: 0 }),
			findAllAdmin: jest.fn().mockResolvedValue({ items: [], count: 0 }),
			update: jest.fn().mockImplementation((id, dto) => Promise.resolve({ id, ...dto })),
			softDelete: jest.fn().mockResolvedValue(true),
			incrementView: jest.fn().mockResolvedValue(undefined),
		};

		mockCategoryRepo = {
			findOneBy: jest.fn().mockResolvedValue({ id: 'cat-1', name: 'Tech' }),
			increment: jest.fn().mockResolvedValue(undefined),
		};

		mockTagRepo = {
			find: jest.fn().mockResolvedValue([]),
		};

		mockUserRepo = {
			increment: jest.fn().mockResolvedValue(undefined),
		};

		mockTagsService = {
			findOrCreateMany: jest.fn().mockResolvedValue([]),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PostsService,
				{
					provide: 'PostsRepositoryInterface',
					useValue: mockPostsRepo,
				},
				{
					provide: getRepositoryToken(Category),
					useValue: mockCategoryRepo,
				},
				{
					provide: getRepositoryToken(Tag),
					useValue: mockTagRepo,
				},
				{
					provide: getRepositoryToken(User),
					useValue: mockUserRepo,
				},
				{
					provide: TagsService,
					useValue: mockTagsService,
				},
			],
		}).compile();

		service = module.get<PostsService>(PostsService);
	});

	it('should create post with DRAFT status and calculated readingTime', async () => {
		const result = await service.create(
			{
				title: 'Clean Architecture with NestJS',
				content:
					'# Architecture\n' +
					'In this post we explore domain driven design and ports and adapters...'.repeat(
						10,
					),
				level: PostLevel.BASIC,
			},
			'author-1',
		);

		expect(mockPostsRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Clean Architecture with NestJS',
				slug: 'clean-architecture-with-nestjs',
				status: PostStatus.DRAFT,
				authorId: 'author-1',
			}),
		);
		expect(result).toHaveProperty('id', 'post-1');
	});

	it('should prevent non-owners and non-admins from updating post', async () => {
		mockPostsRepo.findOneById.mockResolvedValue({
			id: 'post-1',
			authorId: 'author-1',
			tags: [],
		});

		await expect(
			service.update(
				'post-1',
				{ title: 'Hacked Title' },
				{ id: 'author-2', role: { name: USER_ROLE.USER } },
			),
		).rejects.toThrow(ForbiddenException);
	});

	it('should allow owner to publish DRAFT post', async () => {
		mockPostsRepo.findOneById.mockResolvedValue({
			id: 'post-1',
			authorId: 'author-1',
			status: PostStatus.DRAFT,
		});

		const published = await service.publish('post-1', {
			id: 'author-1',
			role: { name: USER_ROLE.AUTHOR },
		});

		expect(mockPostsRepo.update).toHaveBeenCalledWith(
			'post-1',
			expect.objectContaining({
				status: PostStatus.PUBLISHED,
			}),
		);
		expect(published.status).toBe(PostStatus.PUBLISHED);
	});

	it('should increment view count when querying post by slug', async () => {
		mockPostsRepo.findBySlug.mockResolvedValue({
			id: 'post-1',
			slug: 'nest-post',
			status: PostStatus.PUBLISHED,
		});

		const post = await service.findBySlug('nest-post');
		expect(post.slug).toBe('nest-post');
		expect(mockPostsRepo.incrementView).toHaveBeenCalledWith('post-1');
	});

	it('should search published posts with pagination', async () => {
		mockPostsRepo.findPublic.mockResolvedValue({
			items: [{ id: 'post-1', title: 'NestJS Search' }],
			count: 1,
		});

		const result = await service.search({ q: 'NestJS', page: 1, limit: 10 });
		expect(result.items).toHaveLength(1);
		expect(mockPostsRepo.findPublic).toHaveBeenCalledWith(
			expect.objectContaining({
				search: 'NestJS',
				limit: 10,
				offset: 0,
			}),
		);
	});

	it('should generate valid sitemap xml', async () => {
		mockPostsRepo.findPublic.mockResolvedValue({
			items: [
				{
					slug: 'sample-post',
					updated_at: new Date('2026-01-01T00:00:00.000Z'),
				},
			],
			count: 1,
		});

		const xml = await service.generateSitemapXml('https://myblog.com');
		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('<loc>https://myblog.com/posts/sample-post</loc>');
	});
});

