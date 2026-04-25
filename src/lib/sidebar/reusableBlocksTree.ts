import type { BlockFolder, ReusableBlock } from '$lib/types';

export type ReusableBlocksTreeNode = {
	folder: BlockFolder | null;
	folders: ReusableBlocksTreeNode[];
	blocks: ReusableBlock[];
};

const sortFolders = (nodes: ReusableBlocksTreeNode[]) => {
	nodes.sort((a, b) => {
		if (a.folder === null || b.folder === null) return 0;
		return a.folder.name.localeCompare(b.folder.name);
	});

	for (const node of nodes) {
		sortFolders(node.folders);
		node.blocks.sort((a, b) => a.name.localeCompare(b.name));
	}
};

export const buildReusableBlocksTree = (
	folders: BlockFolder[],
	blocks: ReusableBlock[]
): ReusableBlocksTreeNode => {
	const nodeMap = new Map<string, ReusableBlocksTreeNode>(
		folders.map((folder) => [
			folder.id,
			{
				folder,
				folders: [],
				blocks: []
			}
		])
	);

	const root: ReusableBlocksTreeNode = {
		folder: null,
		folders: [],
		blocks: []
	};

	for (const folder of folders) {
		const node = nodeMap.get(folder.id);
		if (!node) continue;

		const parent = folder.parent_id ? nodeMap.get(folder.parent_id) : null;
		(parent ?? root).folders.push(node);
	}

	for (const block of blocks) {
		const parent = block.folder_id ? nodeMap.get(block.folder_id) : null;
		(parent ?? root).blocks.push(block);
	}

	sortFolders(root.folders);
	root.blocks.sort((a, b) => a.name.localeCompare(b.name));

	return root;
};

export const collectReusableBlockFolderAncestors = (
	root: ReusableBlocksTreeNode,
	targetFolderId: string | null
) => {
	if (!targetFolderId) return [];

	const visit = (node: ReusableBlocksTreeNode, ancestors: string[]): string[] | null => {
		if (node.folder?.id === targetFolderId) return ancestors;

		for (const child of node.folders) {
			const result = visit(
				child,
				node.folder ? [...ancestors, node.folder.id] : ancestors
			);
			if (result) return result;
		}

		return null;
	};

	return visit(root, []) ?? [];
};
