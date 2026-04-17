import { fail, type Actions } from '@sveltejs/kit';

import { pageHasDraftChanges } from '$lib/pageStatus';
import { validatePagePathInput } from '$lib/pagePath';
import { requireAuthenticatedUser } from '$lib/server/auth';
import {
	createPage,
	deletePageById,
	draftPathSegmentExists,
	getPageById,
	getPages
} from '$lib/server/PagesController.server';
import type { Page } from '$lib/types';

const sortDashboardPages = (pages: Page[]) =>
	[...pages].sort((a, b) => {
		const draftDiff = Number(pageHasDraftChanges(b)) - Number(pageHasDraftChanges(a));
		if (draftDiff !== 0) return draftDiff;

		const updatedDiff = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
		if (updatedDiff !== 0) return updatedDiff;

		return a.title.localeCompare(b.title);
	});

const getDashboardPages = async () => sortDashboardPages(await getPages());

export const actions = {
	createPage: async (event) => {
		await requireAuthenticatedUser(event.locals, {
			pathname: event.url.pathname,
			search: event.url.search
		});

		const formData = await event.request.formData();
		const title = String(formData.get('title') ?? '').trim();
		const parentPageId = String(formData.get('parentPageId') ?? '').trim();
		const urlName = String(formData.get('urlName') ?? '').trim();

		if (!parentPageId) {
			return fail(400, { error: 'Parent page is required' });
		}

		const validation = validatePagePathInput({
			title,
			urlName,
			isRoot: false
		});

		if (validation.error) {
			return fail(400, { error: validation.error });
		}

		const parentPage = await getPageById(parentPageId);
		if (!parentPage) {
			return fail(404, { error: 'Parent page not found' });
		}

		const pageAlreadyExists = await draftPathSegmentExists({
			parentPageId,
			pathSegment: validation.pathSegment as string
		});
		if (pageAlreadyExists) {
			return fail(409, {
				error: 'Page with this URL already exists under selected parent'
			});
		}

		try {
			await createPage({
				title,
				parentPageId,
				urlName
			});

			return {
				pages: await getDashboardPages()
			};
		} catch (error) {
			console.error('Error creating page:', error);
			return fail(500, { error: 'Failed to create page' });
		}
	},

	deletePage: async (event) => {
		await requireAuthenticatedUser(event.locals, {
			pathname: event.url.pathname,
			search: event.url.search
		});

		const formData = await event.request.formData();
		const pageId = String(formData.get('pageId') ?? '').trim();

		if (!pageId) {
			return fail(400, {
				error: 'Page id is required to delete a page'
			});
		}

		try {
			const page = await getPageById(pageId);
			if (!page) {
				return fail(404, { error: 'Page not found' });
			}

			if (page.parent_page_id === null) {
				return fail(400, { error: 'Root page cannot be deleted' });
			}

			await deletePageById(pageId);
			return {
				success: true,
				pages: await getDashboardPages()
			};
		} catch (error) {
			console.error('Error deleting page:', error);
			return fail(500, {
				error: 'Failed to delete page'
			});
		}
	}
} satisfies Actions;
