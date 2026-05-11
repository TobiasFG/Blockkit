import { fail, type Actions } from '@sveltejs/kit';
import { requireAuthenticatedUser } from '$lib/server/auth';
import {
	getTrashState,
	restorePage,
	restoreReusableBlockFromTrash
} from '$lib/server/TrashController.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => getTrashState();

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
			await restorePage({ id: pageId, parentPageId });
			return {
				success: true,
				restoredKind: 'page',
				...await getTrashState()
			};
		} catch (error) {
			console.error('Error restoring page:', error);
			if (error instanceof Error && error.message === 'Page not found') {
				return fail(404, { error: error.message });
			}

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
			await restoreReusableBlockFromTrash(id);
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
