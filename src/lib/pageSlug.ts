export const ROOT_PAGE_SLUG = '/';
export const ROOT_SLUG_ALIAS = '__root__';

const SLUG_SEGMENT_PATTERN = /^[A-Za-z0-9._~-]+$/;

export const normalizePageSlug = (value: string) => {
	const trimmed = value.trim();

	if (trimmed === '' || trimmed === ROOT_PAGE_SLUG) {
		return ROOT_PAGE_SLUG;
	}

	const segments = trimmed
		.replace(/^\/+|\/+$/g, '')
		.split('/')
		.filter(Boolean);

	return segments.length === 0 ? ROOT_PAGE_SLUG : `/${segments.join('/')}`;
};

export const validatePageSlug = (value: string) => {
	const raw = value.trim();

	if (!raw) {
		return { slug: ROOT_PAGE_SLUG, error: 'Slug is required' };
	}

	const slug = normalizePageSlug(raw);

	if (slug === ROOT_PAGE_SLUG) {
		return { slug };
	}

	for (const segment of slug.slice(1).split('/')) {
		if (segment === '.' || segment === '..') {
			return { slug, error: 'Slug segments cannot be "." or ".."' };
		}

		if (!SLUG_SEGMENT_PATTERN.test(segment)) {
			return {
				slug,
				error:
					'Slug segments may only contain letters, numbers, dashes, underscores, periods, and tildes'
			};
		}
	}

	return { slug };
};

export const slugFromRouteParam = (slugParam?: string) =>
	slugParam === undefined || slugParam === ROOT_SLUG_ALIAS
		? ROOT_PAGE_SLUG
		: normalizePageSlug(slugParam);

export const buildPageSlugCandidates = (slugParam?: string) => {
	const normalized = slugFromRouteParam(slugParam);
	const trimmed = normalized.replace(/^\//, '');
	const candidates = new Set([normalized, trimmed]);

	if (normalized === ROOT_PAGE_SLUG) {
		candidates.add('');
	}

	return Array.from(candidates);
};

export const buildEditPagePath = (slug: string) => {
	if (slug === ROOT_PAGE_SLUG) {
		return `/edit/${ROOT_SLUG_ALIAS}`;
	}

	return `/edit/${slug
		.replace(/^\//, '')
		.split('/')
		.map((segment) => encodeURIComponent(segment))
		.join('/')}`;
};
