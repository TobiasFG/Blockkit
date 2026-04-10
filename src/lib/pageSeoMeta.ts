export type PageSeoMeta = {
	title: string;
	description: string;
	canonicalUrl: string;
	ogImageUrl: string;
	noIndex: boolean;
	noFollow: boolean;
};

export const EMPTY_PAGE_SEO_META: PageSeoMeta = {
	title: '',
	description: '',
	canonicalUrl: '',
	ogImageUrl: '',
	noIndex: false,
	noFollow: false
};

const asTrimmedString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const asBoolean = (value: unknown, fallback = false): boolean =>
	typeof value === 'boolean' ? value : fallback;

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

export const parsePageSeoMeta = (meta: unknown): PageSeoMeta => {
	if (!isObject(meta) || !isObject(meta.seo)) {
		return { ...EMPTY_PAGE_SEO_META };
	}

	const seo = meta.seo;
	return {
		title: asTrimmedString(seo.title),
		description: asTrimmedString(seo.description),
		canonicalUrl: asTrimmedString(seo.canonicalUrl),
		ogImageUrl: asTrimmedString(seo.ogImageUrl),
		noIndex: asBoolean(seo.noIndex),
		noFollow: asBoolean(seo.noFollow)
	};
};

export const serializePageSeoMeta = (
	meta: unknown,
	seo: PageSeoMeta
): Record<string, unknown> => {
	const base = isObject(meta) ? { ...meta } : {};

	return {
		...base,
		seo: {
			title: seo.title || null,
			description: seo.description || null,
			canonicalUrl: seo.canonicalUrl || null,
			ogImageUrl: seo.ogImageUrl || null,
			noIndex: seo.noIndex,
			noFollow: seo.noFollow
		}
	};
};
