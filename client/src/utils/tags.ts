// Traduit un nom de tag
export function translateTag(tagName: string, t: (key: string) => string): string {
	const translated = t(`tags.${tagName}`);
	return translated.startsWith('tags.') ? tagName : translated;
}
