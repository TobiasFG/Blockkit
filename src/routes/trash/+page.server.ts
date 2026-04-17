import { fail, type Actions } from '@sveltejs/kit';
import { requireAuthenticatedUser } from '$lib/server/auth';
import {
	getDeletedPages,
	getPageById,
	getPages,
	restorePageById
} from '$lib/server/PagesController.server';
import {
	getDeletedReusableBlocks,
	getReusableBlocks,
	restoreReusableBlock
} from '$lib/server/ReusableBlocksController.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	deletedPages: await getDeletedPages(),
	deletedReusableBlocks: await getDeletedReusableBlocks(),
	pages: await getPages(),
	reusableBlocks: await getReusableBlocks()
});

const getTrashState = async () => ({
	deletedPages: await getDeletedPages(),
	deletedReusableBlocks: await getDeletedReusableBlocks(),
	pages: await getPages(),
	reusableBlocks: await getReusableBlocks()
});

export const actions = {
	restorePage: async (event) => {
		await requireAuthenticatedUser(event.locals, {
			pathname: event.url.pathname,
			search: event.url.search
		});

		const formData = await event.request.formData();
		const pageId = String(formData.get('pageId') ?? '').trim();
		const parentPageId = String(formData.get('parentPageId') ?? '').trim() || null;

		if (!pageId) {
			return fail(400, { error: 'Page id is required' });
		}

		try {
			const page = await getPageById(pageId, { includeDeleted: true });
			if (!page) {
				return fail(404, { error: 'Page not found' });
			}

			await restorePageById(pageId, parentPageId);
			return {
				success: true,
				restoredKind: 'page',
				...await getTrashState()
			};
		} catch (error) {
			console.error('Error restoring page:', error);
			return fail(500, {
				error: error instanceof Error ? error.message : 'Failed to restore page'
			});
		}
	},

	restoreReusableBlock: async (event) => {
		await requireAuthenticatedUser(event.locals, {
			pathname: event.url.pathname,
			search: event.url.search
		});

		const formData = await event.request.formData();
		const id = String(formData.get('id') ?? '').trim();

		if (!id) {
			return fail(400, { error: 'Content id is required' });
		}

		try {
			await restoreReusableBlock(id);
			return {
				success: true,
				restoredKind: 'content',
				...await getTrashState()
			};
		} catch (error) {
			console.error('Error restoring content:', error);
			return fail(500, {
				error: error instanceof Error ? error.message : 'Failed to restore content'
			});
		}
	}
} satisfies Actions;
