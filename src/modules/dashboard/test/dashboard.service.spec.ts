import { DashboardService } from '../services/dashboard.service';
import { USER_ROLE } from '@modules/user-roles/entities/user-role.entity';

describe('DashboardService', () => {
	let service: DashboardService;
	let postRepo: Record<string, any>;
	let userRepo: Record<string, any>;
	let categoryRepo: Record<string, any>;
	let tagRepo: Record<string, any>;
	let commentRepo: Record<string, any>;
	let cache: Record<string, any>;

	beforeEach(() => {
		postRepo = {
			count: jest.fn(async () => 10),
			createQueryBuilder: jest.fn(() => ({
				where: jest.fn().mockReturnThis(),
				select: jest.fn().mockReturnThis(),
				addSelect: jest.fn().mockReturnThis(),
				getRawOne: jest.fn().mockResolvedValue({
					totalViews: '150',
					totalComments: '30',
					totalReactions: '45',
				}),
			})),
		};

		userRepo = { count: jest.fn(async () => 50) };
		categoryRepo = { count: jest.fn(async () => 5) };
		tagRepo = { count: jest.fn(async () => 20) };
		commentRepo = { count: jest.fn(async () => 100) };

		cache = {
			getOrSet: jest.fn(async (_ns, _key, _ttl, fn) => fn()),
			invalidate: jest.fn(),
		};

		service = new DashboardService(
			postRepo as never,
			userRepo as never,
			categoryRepo as never,
			tagRepo as never,
			commentRepo as never,
			cache as never,
		);
	});

	it('should return author stats for non-admin user', async () => {
		const stats = await service.getStats({ id: 'author-1', role: USER_ROLE.AUTHOR });

		expect(stats).toBeDefined();
		expect(stats.totalPosts).toBe(10);
		expect(stats.totalViews).toBe(150);
		expect(stats.totalComments).toBe(30);
		expect(stats.totalReactions).toBe(45);
	});

	it('should return admin stats for admin user', async () => {
		const stats = await service.getStats({ id: 'admin-1', role: USER_ROLE.ADMIN });

		expect(stats).toBeDefined();
		expect(stats).toHaveProperty('totalUsers', 50);
		expect(stats).toHaveProperty('totalCategories', 5);
		expect(stats).toHaveProperty('totalTags', 20);
		expect(stats.totalViews).toBe(150);
	});
});

