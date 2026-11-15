import { calculateReadingTime } from './reading-time.util';

describe('reading-time.util', () => {
	it('should return 1 for empty or very short content', () => {
		expect(calculateReadingTime('')).toBe(1);
		expect(calculateReadingTime('Hello world!')).toBe(1);
	});

	it('should calculate reading time based on 200 words per minute', () => {
		const words = Array.from({ length: 450 }, (_, i) => `word${i}`).join(' ');
		expect(calculateReadingTime(words)).toBe(3); // 450 / 200 = 2.25 -> 3
	});

	it('should strip markdown code blocks and html tags', () => {
		const codeBlock = '```typescript\n' + 'const a = 1;\n'.repeat(50) + '```\n';
		const content = `${codeBlock} This is actual article prose with five words.`;
		expect(calculateReadingTime(content)).toBe(1);
	});
});

