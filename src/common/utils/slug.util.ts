export function slugify(text: string): string {
	if (!text) return '';

	let str = text.toLowerCase().trim();

	// Convert Vietnamese accents to ASCII
	str = str.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a');
	str = str.replace(/[èéẹẻẽêềếệểễ]/g, 'e');
	str = str.replace(/[ìíịỉĩ]/g, 'i');
	str = str.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o');
	str = str.replace(/[ùúụủũưừứựửữ]/g, 'u');
	str = str.replace(/[ỳýỵỷỹ]/g, 'y');
	str = str.replace(/đ/g, 'd');

	// Remove accents from unicode decomposition
	str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

	// Replace special characters and whitespace with hyphens
	str = str
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/[\s_]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '');

	return str;
}

export async function generateUniqueSlug(
	title: string,
	checkExists: (slug: string) => Promise<boolean>,
): Promise<string> {
	const baseSlug = slugify(title) || `item-${Date.now()}`;
	let currentSlug = baseSlug;
	let counter = 1;

	while (await checkExists(currentSlug)) {
		currentSlug = `${baseSlug}-${counter}`;
		counter += 1;
	}

	return currentSlug;
}

