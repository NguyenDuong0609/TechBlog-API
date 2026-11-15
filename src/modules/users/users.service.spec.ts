import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRolesService } from '@modules/user-roles/user-roles.service';
import { USER_ROLE } from '@modules/user-roles/entities/user-role.entity';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
	let service: UsersService;
	let usersRepo: any;
	let userRolesService: any;

	beforeEach(async () => {
		usersRepo = {
			findAll: jest.fn(),
			findOneById: jest.fn(),
			getUserWithRole: jest.fn(),
			create: jest.fn((u) => Promise.resolve(u)),
		};
		userRolesService = {
			findOneByCondition: jest.fn(),
			create: jest.fn((r) => Promise.resolve(r)),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UsersService,
				{ provide: 'UsersRepositoryInterface', useValue: usersRepo },
				{ provide: UserRolesService, useValue: userRolesService },
			],
		}).compile();

		service = module.get<UsersService>(UsersService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('findAllWithFilters', () => {
		it('should query repository with filter criteria', async () => {
			usersRepo.findAll.mockResolvedValue({ items: [], total: 0 });
			const result = await service.findAllWithFilters({
				role: USER_ROLE.ADMIN,
				isActive: true,
				page: 1,
				limit: 10,
			});
			expect(result).toEqual({ items: [], total: 0 });
			expect(usersRepo.findAll).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { role: { name: USER_ROLE.ADMIN }, isActive: true },
					skip: 0,
					take: 10,
				}),
			);
		});
	});

	describe('updateRole', () => {
		it('should prevent self-demoting from admin', async () => {
			await expect(
				service.updateRole('user-1', USER_ROLE.USER, 'user-1'),
			).rejects.toThrow(BadRequestException);
		});

		it('should update role when valid', async () => {
			const mockUser = { id: 'user-2', role: { name: USER_ROLE.USER } } as User;
			usersRepo.getUserWithRole.mockResolvedValue(mockUser);
			userRolesService.findOneByCondition.mockResolvedValue({
				name: USER_ROLE.ADMIN,
			});

			const updated = await service.updateRole(
				'user-2',
				USER_ROLE.ADMIN,
				'admin-1',
			);
			expect(updated.role.name).toBe(USER_ROLE.ADMIN);
		});
	});

	describe('updateStatus', () => {
		it('should prevent self-deactivation', async () => {
			await expect(
				service.updateStatus('admin-1', false, 'admin-1'),
			).rejects.toThrow(BadRequestException);
		});

		it('should toggle user status', async () => {
			const mockUser = { id: 'user-2', isActive: true } as User;
			usersRepo.findOneById.mockResolvedValue(mockUser);

			const updated = await service.updateStatus('user-2', false, 'admin-1');
			expect(updated.isActive).toBe(false);
		});
	});
});
