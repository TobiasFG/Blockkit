import { getPages, getReusableBlockPageReferences } from '$lib/server/PagesController.server';
import { getBlockFolders, getReusableBlocks } from '$lib/server/ReusableBlocksController.server';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	return {
		pages: await getPages(),
		blockFolders: await getBlockFolders(),
		reusableBlocks: await getReusableBlocks(),
		reusableBlockPageReferences: await getReusableBlockPageReferences()
	};
};
