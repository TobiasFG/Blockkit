import { fail, type Actions } from '@sveltejs/kit';

import { pageHasDraftChanges } from '$lib/pageStatus';
import { validatePageSlug } from '$lib/pageSlug';
import { createPage, deletePage, getPages, pageExists } from '$lib/server/PagesController.server';
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
		const formData = await event.request.formData();
		const slugResult = validatePageSlug(String(formData.get('slug') ?? ''));

		if (slugResult.error) {
			return fail(400, { error: slugResult.error });
		}

		const slug = slugResult.slug;
		const pageAlreadyExists = await pageExists(slug);

		if (pageAlreadyExists) {
			return fail(409, {
				error: 'Page with this slug already exists'
			});
		}

		try {
			await createPage(formData.get('title') as string, slug);

			return {
				pages: await getDashboardPages()
			};
		} catch (error) {
			console.error('Error creating page:', error);
			return fail(500, { error: 'Failed to create page' });
		}
	},

	deletePage: async (event) => {
		const formData = await event.request.formData();
		const slug = formData.get('slug') as string;

		if (!slug) {
			return fail(400, {
				error: 'Slug is required to delete a page'
			});
		}

		try {
			await deletePage(slug);
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
