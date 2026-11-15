import { generateUniqueSlug, slugify } from './slug.util';

describe('slug.util', () => {
	describe('slugify', () => {
		it('should convert Vietnamese text to clean ASCII slug', () => {
			const title = 'Hướng dẫn xây dựng hệ thống Realtime với NestJS & Redis!';
			const slug = slugify(title);
			expect(slug).toBe(
				'huong-dan-xay-dung-he-thong-realtime-voi-nestjs-redis',
			);
		});

		it('should trim and collapse multiple hyphens and spaces', () => {
			const title = '   TypeScript   --- Advanced --- Patterns   ';
			const slug = slugify(title);
			expect(slug).toBe('typescript-advanced-patterns');
		});

		it('should handle empty or null string gracefully', () => {
			expect(slugify('')).toBe('');
			expect(slugify(null as any)).toBe('');
		});
	});

	describe('generateUniqueSlug', () => {
		it('should return base slug if it does not exist', async () => {
			const checkExists = jest.fn().mockResolvedValue(false);
			const slug = await generateUniqueSlug('Clean Architecture', checkExists);
			expect(slug).toBe('clean-architecture');
			expect(checkExists).toHaveBeenCalledWith('clean-architecture');
		});

		it('should increment suffix until slug is unique', async () => {
			const checkExists = jest
				.fn()
				.mockResolvedValueOnce(true)
				.mockResolvedValueOnce(true)
				.mockResolvedValueOnce(false);

			const slug = await generateUniqueSlug('Clean Architecture', checkExists);
			expect(slug).toBe('clean-architecture-2');
			expect(checkExists).toHaveBeenCalledTimes(3);
		});
	});
});

