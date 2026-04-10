import type { Page } from '$lib/types';

export type SidebarTreeNode = {
	page: Page;
	children: SidebarTreeNode[];
};

const normalizeSlug = (slug: string) => {
	const trimmed = slug.trim();
	if (trimmed === '' || trimmed === '/') return '/';
	return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
};

const getParentSlug = (slug: string) => {
	if (slug === '/') return null;
	const segments = slug.split('/').filter(Boolean);
	if (segments.length <= 1) return '/';
	return `/${segments.slice(0, -1).join('/')}`;
};

export const buildSidebarTree = (pages: Page[]) => {
	const normalizedPages = pages.map((page) => ({
		...page,
		slug: normalizeSlug(page.slug)
	}));
	const pageMap = new Map(normalizedPages.map((page) => [page.slug, page]));
	const nodeMap = new Map<string, SidebarTreeNode>(
		normalizedPages.map((page) => [page.slug, { page, children: [] }])
	);

	const root = nodeMap.get('/') ?? null;

	for (const page of [...normalizedPages].sort((a, b) => a.slug.split('/').length - b.slug.split('/').length)) {
		if (page.slug === '/') continue;

		let parentSlug = getParentSlug(page.slug);
		while (parentSlug && !pageMap.has(parentSlug)) {
			parentSlug = getParentSlug(parentSlug);
		}

		const parentNode = (parentSlug && nodeMap.get(parentSlug)) ?? root;
		const currentNode = nodeMap.get(page.slug);
		if (parentNode && currentNode) {
			parentNode.children.push(currentNode);
		}
	}

	const sortNodes = (nodes: SidebarTreeNode[]) => {
		nodes.sort((a, b) => a.page.slug.localeCompare(b.page.slug));
		for (const node of nodes) sortNodes(node.children);
	};

	if (root) {
		sortNodes(root.children);
		return root;
	}

	const roots = normalizedPages
		.filter((page) => getParentSlug(page.slug) === null)
		.map((page) => nodeMap.get(page.slug))
		.filter((node): node is SidebarTreeNode => Boolean(node));
	sortNodes(roots);

	return {
		page: {
			id: '__virtual_root__',
			title: 'Home',
			slug: '/',
			created_at: '',
			updated_at: ''
		},
		children: roots
	} satisfies SidebarTreeNode;
};

export const collectAncestorSlugs = (root: SidebarTreeNode | null, targetSlug: string) => {
	if (!root) return [];

	const visit = (node: SidebarTreeNode, ancestors: string[]): string[] | null => {
		if (node.page.slug === targetSlug) return [...ancestors, node.page.slug];

		for (const child of node.children) {
			const result = visit(child, [...ancestors, node.page.slug]);
			if (result) return result;
		}

		return null;
	};

	return visit(root, []) ?? [];
};
