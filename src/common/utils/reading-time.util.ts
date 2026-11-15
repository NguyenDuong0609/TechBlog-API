export function calculateReadingTime(
	content: string,
	wordsPerMinute = 200,
): number {
	if (!content || !content.trim()) {
		return 1;
	}

	// Strip code blocks and html tags to estimate human reading words
	const cleanContent = content
		.replace(/```[\s\S]*?```/g, '')
		.replace(/<[^>]*>/g, '')
		.trim();

	const words = cleanContent.split(/\s+/).filter((word) => word.length > 0);
	const wordCount = words.length;

	return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

