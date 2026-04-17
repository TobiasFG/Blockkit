import type { Page } from '$lib/types';

export type SidebarTreeNode = {
	page: Page;
	children: SidebarTreeNode[];
};

export const buildSidebarTree = (pages: Page[]) => {
	const nodeMap = new Map<string, SidebarTreeNode>(pages.map((page) => [page.id, { page, children: [] }]));
	const roots: SidebarTreeNode[] = [];

	for (const page of pages) {
		const currentNode = nodeMap.get(page.id);
		if (!currentNode) continue;

		if (page.parent_page_id === null) {
			roots.push(currentNode);
			continue;
		}

		const parentNode = nodeMap.get(page.parent_page_id);
		if (parentNode) {
			parentNode.children.push(currentNode);
		} else {
			roots.push(currentNode);
		}
	}

	const sortNodes = (nodes: SidebarTreeNode[]) => {
		nodes.sort((a, b) => a.page.title.localeCompare(b.page.title));
		for (const node of nodes) sortNodes(node.children);
	};

	sortNodes(roots);

	return roots[0] ?? null;
};

export const collectAncestorPageIds = (root: SidebarTreeNode | null, targetPageId: string) => {
	if (!root) return [];

	const visit = (node: SidebarTreeNode, ancestors: string[]): string[] | null => {
		if (node.page.id === targetPageId) return [...ancestors, node.page.id];

		for (const child of node.children) {
			const result = visit(child, [...ancestors, node.page.id]);
			if (result) return result;
		}

		return null;
	};

	return visit(root, []) ?? [];
};
