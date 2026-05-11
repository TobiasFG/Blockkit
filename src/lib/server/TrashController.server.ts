import {
	ensurePageCanBeDeleted,
	getDeletedPages,
	getPageById,
	getPages,
	removeReusableBlockReferencesFromPages,
	restorePageById,
	softDeletePageById
} from '$lib/server/PagesController.server';
import {
	getDeletedReusableBlocks,
	getReusableBlocks,
	restoreReusableBlock,
	softDeleteReusableBlock
} from '$lib/server/ReusableBlocksController.server';
import type { Page, ReferencingPage, ReusableBlock } from '$lib/types';

export type TrashState = {
	deletedPages: Page[];
	deletedReusableBlocks: ReusableBlock[];
	pages: Page[];
	reusableBlocks: ReusableBlock[];
};

export const getTrashState = async (): Promise<TrashState> => ({
	deletedPages: await getDeletedPages(),
	deletedReusableBlocks: await getDeletedReusableBlocks(),
	pages: await getPages(),
	reusableBlocks: await getReusableBlocks()
});

export const trashPage = async (id: string): Promise<void> => {
	await ensurePageCanBeDeleted(id);
	await softDeletePageById(id);
};

export const trashReusableBlock = async (id: string): Promise<ReferencingPage[]> => {
	const pagesReferencingDeletedBlock = await removeReusableBlockReferencesFromPages(id);
	await softDeleteReusableBlock(id);
	return pagesReferencingDeletedBlock;
};

export const restorePage = async ({
	id,
	parentPageId
}: {
	id: string;
	parentPageId: string | null;
}): Promise<Page> => {
	const page = await getPageById(id, { includeDeleted: true });
	if (!page) {
		throw new Error('Page not found');
	}

	return restorePageById(id, parentPageId);
};

export const restoreReusableBlockFromTrash = async (id: string): Promise<ReusableBlock> =>
	restoreReusableBlock(id);
