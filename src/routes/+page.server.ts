import { getDeletedPages } from '$lib/server/PagesController.server';
import { getDeletedReusableBlocks } from '$lib/server/ReusableBlocksController.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	deletedPageCount: (await getDeletedPages()).length,
	deletedReusableBlockCount: (await getDeletedReusableBlocks()).length
});
