import type { Page } from '$lib/types';

export const ROOT_PAGE_PATH = '/';

const SEGMENT_PATTERN = /^[a-z0-9._~-]+$/;

export type PagePathNode = {
	id: string;
	parent_page_id: string | null;
	path_segment: string | null;
};

const normalizeSegmentPieces = (value: string) =>
	value
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9._~-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^[-._~]+|[-._~]+$/g, '');

export const normalizeUrlName = (value: string) => normalizeSegmentPieces(value.replace(/\//g, ' '));

export const derivePathSegment = (title: string, urlName?: string | null) => {
	const explicit = normalizeUrlName(urlName ?? '');
	if (explicit) return explicit;
	return normalizeSegmentPieces(title);
};

export const validatePagePathInput = ({
	title,
	urlName,
	isRoot
}: {
	title: string;
	urlName?: string | null;
	isRoot: boolean;
}) => {
	const trimmedTitle = title.trim();
	if (!trimmedTitle) {
		return { error: 'Title is required', pathSegment: null as string | null };
	}

	const trimmedUrlName = (urlName ?? '').trim();
	if (isRoot) {
		return { error: null, pathSegment: null as string | null };
	}

	if (trimmedUrlName.includes('/')) {
		return { error: 'URL name cannot include "/"', pathSegment: null as string | null };
	}

	const normalizedUrlName = normalizeUrlName(trimmedUrlName);
	if (trimmedUrlName && !normalizedUrlName) {
		return {
			error: 'URL name must contain letters, numbers, dashes, underscores, periods, or tildes',
			pathSegment: null as string | null
		};
	}

	if (normalizedUrlName && !SEGMENT_PATTERN.test(normalizedUrlName)) {
		return {
			error: 'URL name must contain only letters, numbers, dashes, underscores, periods, or tildes',
			pathSegment: null as string | null
		};
	}

	const pathSegment = derivePathSegment(trimmedTitle, trimmedUrlName);
	if (!pathSegment) {
		return {
			error: 'Title must produce a valid URL segment or URL name must be set explicitly',
			pathSegment: null as string | null
		};
	}

	return { error: null, pathSegment };
};

export const buildPagePathMap = (nodes: PagePathNode[]) => {
	const nodeMap = new Map(nodes.map((node) => [node.id, node]));
	const pathMap = new Map<string, string>();
	const visiting = new Set<string>();

	const resolvePath = (id: string): string => {
		if (pathMap.has(id)) return pathMap.get(id) as string;
		if (visiting.has(id)) {
			throw new Error(`Page path cycle detected for ${id}`);
		}

		const node = nodeMap.get(id);
		if (!node) {
			throw new Error(`Page path node ${id} not found`);
		}

		visiting.add(id);
		let path = ROOT_PAGE_PATH;
		if (node.parent_page_id !== null) {
			const parentPath = resolvePath(node.parent_page_id);
			const segment = node.path_segment?.trim();
			if (!segment) {
				throw new Error(`Page ${id} is missing path_segment`);
			}

			path = parentPath === ROOT_PAGE_PATH ? `/${segment}` : `${parentPath}/${segment}`;
		}
		visiting.delete(id);
		pathMap.set(id, path);
		return path;
	};

	for (const node of nodes) {
		resolvePath(node.id);
	}

	return pathMap;
};

export const isRootPage = (page: Pick<Page, 'parent_page_id'>) => page.parent_page_id === null;

export const buildEditPagePath = (id: string) => `/edit/page/${encodeURIComponent(id)}`;

export const buildPagePathPreview = ({
	pageId,
	parentPageId,
	title,
	urlName,
	pages
}: {
	pageId: string;
	parentPageId: string | null;
	title: string;
	urlName?: string | null;
	pages: Pick<Page, 'id' | 'parent_page_id' | 'path_segment'>[];
}) => {
	const validation = validatePagePathInput({
		title,
		urlName,
		isRoot: parentPageId === null
	});

	if (validation.error) {
		return ROOT_PAGE_PATH;
	}

	const pathMap = buildPagePathMap(
		pages.map((page) =>
			page.id === pageId
				? {
						id: page.id,
						parent_page_id: parentPageId,
						path_segment: validation.pathSegment
					}
				: {
						id: page.id,
						parent_page_id: page.parent_page_id,
						path_segment: page.path_segment
					}
		)
	);

	return pathMap.get(pageId) ?? ROOT_PAGE_PATH;
};
