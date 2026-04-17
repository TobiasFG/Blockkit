import { parseSubmittedPageContent, validatePageContentEditorState } from '$lib/pageContentEditor';
import { validatePagePathInput } from '$lib/pagePath';
import { parsePageSeoMeta } from '$lib/pageSeoMeta';
import { requireAuthenticatedUser } from '$lib/server/auth';
import {
	draftPathSegmentExists,
	getDraftVersionById,
	getPageById,
	getPages,
	publishPage,
	updatePageDraftSeoAndContent
} from '$lib/server/PagesController.server';
import { getReusableBlocks } from '$lib/server/ReusableBlocksController.server';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const getDescendantIds = (pageId: string, pages: Awaited<ReturnType<typeof getPages>>) => {
	const descendantIds = new Set<string>();
	let changed = true;

	while (changed) {
		changed = false;
		for (const page of pages) {
			if (page.id === pageId) continue;
			if (page.parent_page_id === pageId || (page.parent_page_id && descendantIds.has(page.parent_page_id))) {
				if (!descendantIds.has(page.id)) {
					descendantIds.add(page.id);
					changed = true;
				}
			}
		}
	}

	return descendantIds;
};

export const load: PageServerLoad = async ({ params }) => {
	const page = await getPageById(params.id);
	if (!page) {
		throw error(404, 'Page not found');
	}

	const draftVersion = page.draft_version_id ? await getDraftVersionById(page.draft_version_id) : null;

	return {
		page,
		pages: await getPages(),
		seo: parsePageSeoMeta(draftVersion?.meta),
		content: draftVersion?.content ?? null,
		reusableBlocks: await getReusableBlocks()
	};
};

export const actions = {
	updatePage: async (event) => {
		await requireAuthenticatedUser(event.locals, {
			pathname: event.url.pathname,
			search: event.url.search
		});

		const formData = await event.request.formData();
		const title = String(formData.get('title') ?? '').trim();
		const parentPageIdRaw = String(formData.get('parentPageId') ?? '').trim();
		const urlName = String(formData.get('urlName') ?? '').trim();
		const seo = {
			title: String(formData.get('seoTitle') ?? '').trim(),
			description: String(formData.get('seoDescription') ?? '').trim(),
			canonicalUrl: String(formData.get('canonicalUrl') ?? '').trim(),
			ogImageUrl: String(formData.get('ogImageUrl') ?? '').trim(),
			noIndex: formData.get('noIndex') === 'on',
			noFollow: formData.get('noFollow') === 'on'
		};
		const content = parseSubmittedPageContent(String(formData.get('content') ?? ''));
		const page = await getPageById(event.params.id);

		if (!page) {
			return fail(404, { error: 'Page not found' });
		}

		const isRoot = page.parent_page_id === null;
		const parentPageId = isRoot ? null : parentPageIdRaw || null;
		const validation = validatePagePathInput({
			title,
			urlName,
			isRoot
		});

		if (validation.error) {
			return fail(400, { error: validation.error });
		}

		if (!content) {
			return fail(400, { error: 'Page content is invalid' });
		}

		const reusableBlocks = await getReusableBlocks();
		const reusableBlockIds = new Set(reusableBlocks.map((block) => block.id));
		const contentErrors = validatePageContentEditorState(content, reusableBlockIds);
		if (Object.keys(contentErrors).length > 0) {
			return fail(400, { error: 'Page content is invalid' });
		}

		const pages = await getPages();
		if (!isRoot) {
			if (!parentPageId) {
				return fail(400, { error: 'Parent page is required' });
			}

			if (parentPageId === page.id) {
				return fail(400, { error: 'Page cannot be its own parent' });
			}

			const parentPage = pages.find((entry) => entry.id === parentPageId);
			if (!parentPage) {
				return fail(404, { error: 'Parent page not found' });
			}

			const descendantIds = getDescendantIds(page.id, pages);
			if (descendantIds.has(parentPageId)) {
				return fail(400, { error: 'Page cannot move inside its own child tree' });
			}

			const pathConflict = await draftPathSegmentExists({
				parentPageId,
				pathSegment: validation.pathSegment as string,
				excludePageId: page.id
			});
			if (pathConflict) {
				return fail(409, { error: 'Another page already uses this URL under selected parent' });
			}
		}

		try {
			const updated = await updatePageDraftSeoAndContent(page, {
				title,
				parentPageId,
				urlName,
				seo,
				content
			});

			return {
				page: updated,
				pages: await getPages(),
				seo,
				content,
				reusableBlocks
			};
		} catch (err) {
			console.error('Error updating page:', err);
			return fail(500, { error: 'Failed to update page' });
		}
	},

	publishPage: async (event) => {
		await requireAuthenticatedUser(event.locals, {
			pathname: event.url.pathname,
			search: event.url.search
		});

		const page = await getPageById(event.params.id);
		if (!page) {
			return fail(404, { error: 'Page not found' });
		}

		const draftVersion = page.draft_version_id ? await getDraftVersionById(page.draft_version_id) : null;
		if (!draftVersion) {
			return fail(400, { error: 'Page draft not found' });
		}

		const reusableBlocks = await getReusableBlocks();
		const reusableBlockIds = new Set(reusableBlocks.map((block) => block.id));
		const contentErrors = validatePageContentEditorState(draftVersion.content, reusableBlockIds);
		if (Object.keys(contentErrors).length > 0) {
			return fail(400, { error: 'Current draft is not ready to publish' });
		}

		try {
			const publishedPage = await publishPage(page);
			const cleanDraftVersion = publishedPage.draft_version_id
				? await getDraftVersionById(publishedPage.draft_version_id)
				: null;

			return {
				page: publishedPage,
				pages: await getPages(),
				seo: parsePageSeoMeta(cleanDraftVersion?.meta),
				content: cleanDraftVersion?.content ?? draftVersion.content,
				reusableBlocks
			};
		} catch (err) {
			console.error('Error publishing page:', err);
			return fail(500, { error: 'Failed to publish page' });
		}
	}
} satisfies Actions;
