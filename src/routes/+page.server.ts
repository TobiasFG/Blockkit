import { buildEditPagePath, isRootPage, validatePagePathInput } from '$lib/pagePath';
import { requireAuthenticatedUser } from '$lib/server/auth';
import {
	createPage,
	draftPathSegmentExists,
	getDeletedPages,
	getPages
} from '$lib/server/PagesController.server';
import { getDeletedReusableBlocks } from '$lib/server/ReusableBlocksController.server';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	deletedPageCount: (await getDeletedPages()).length,
	deletedReusableBlockCount: (await getDeletedReusableBlocks()).length
});

export const actions = {
	createPage: async (event) => {
		await requireAuthenticatedUser(event.locals, {
			pathname: event.url.pathname,
			search: event.url.search
		});

		const formData = await event.request.formData();
		const title = String(formData.get('title') ?? '').trim();
		const urlName = String(formData.get('urlName') ?? '').trim();
		const requestedParentId = String(formData.get('parentPageId') ?? '').trim();

		const pages = await getPages();
		const rootPage = pages.find((page) => isRootPage(page)) ?? null;
		// The first page ever created becomes the root; everything else needs a parent.
		const parentPageId = requestedParentId || rootPage?.id || null;

		if (parentPageId !== null && !pages.some((page) => page.id === parentPageId)) {
			return fail(404, { error: 'Parent page not found' });
		}

		const validation = validatePagePathInput({
			title,
			urlName,
			isRoot: parentPageId === null
		});

		if (validation.error) {
			return fail(400, { error: validation.error });
		}

		if (parentPageId !== null) {
			const conflict = await draftPathSegmentExists({
				parentPageId,
				pathSegment: validation.pathSegment as string
			});

			if (conflict) {
				return fail(409, {
					error: 'Another page already uses this URL under selected parent'
				});
			}
		}

		let created;
		try {
			created = await createPage({ title, parentPageId, urlName });
		} catch (err) {
			console.error('Error creating page:', err);
			return fail(500, { error: 'Failed to create page' });
		}

		throw redirect(303, buildEditPagePath(created.id));
	}
} satisfies Actions;
