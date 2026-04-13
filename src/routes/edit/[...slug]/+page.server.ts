import { parseSubmittedPageContent, validatePageContentEditorState } from '$lib/pageContentEditor';
import { parsePageSeoMeta } from '$lib/pageSeoMeta';
import {
	buildEditPagePath,
	buildPageSlugCandidates,
	ROOT_PAGE_SLUG,
	validatePageSlug
} from '$lib/pageSlug';
import { requireAuthenticatedUser } from '$lib/server/auth';
import {
	getDraftVersionById,
	getPageBySlugVariants,
	updatePageTitleDraftSeoAndContent
} from '$lib/server/PagesController.server';
import { getReusableBlocks } from '$lib/server/ReusableBlocksController.server';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const candidates = buildPageSlugCandidates(params.slug);
	const page = await getPageBySlugVariants(candidates);

	if (!page) {
		throw error(404, 'Page not found');
	}

	const draftVersion = page.draft_version_id
		? await getDraftVersionById(page.draft_version_id)
		: null;

	return {
		page,
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

		const { request, params } = event;
		const formData = await request.formData();
		const title = String(formData.get('title') ?? '').trim();
		const slugResult = validatePageSlug(String(formData.get('slug') ?? ''));
		const seo = {
			title: String(formData.get('seoTitle') ?? '').trim(),
			description: String(formData.get('seoDescription') ?? '').trim(),
			canonicalUrl: String(formData.get('canonicalUrl') ?? '').trim(),
			ogImageUrl: String(formData.get('ogImageUrl') ?? '').trim(),
			noIndex: formData.get('noIndex') === 'on',
			noFollow: formData.get('noFollow') === 'on'
		};
		const content = parseSubmittedPageContent(String(formData.get('content') ?? ''));

		if (!title) {
			return fail(400, { error: 'Title is required' });
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

		if (slugResult.error) {
			return fail(400, { error: slugResult.error });
		}

		const candidates = buildPageSlugCandidates(params.slug);
		const page = await getPageBySlugVariants(candidates);

		if (!page) {
			return fail(404, { error: 'Page not found' });
		}

		const nextSlug = slugResult.slug;

		if (page.slug === ROOT_PAGE_SLUG && nextSlug !== ROOT_PAGE_SLUG) {
			return fail(400, { error: 'The root page slug cannot be changed' });
		}

		if (page.slug !== ROOT_PAGE_SLUG && nextSlug === ROOT_PAGE_SLUG) {
			return fail(400, { error: 'Only the root page can use "/"' });
		}

		if (nextSlug !== page.slug) {
			const existingPage = await getPageBySlugVariants([nextSlug, nextSlug.replace(/^\//, '')]);
			if (existingPage && existingPage.id !== page.id) {
				return fail(409, { error: 'Page with this slug already exists' });
			}
		}

		try {
			const updated = await updatePageTitleDraftSeoAndContent(page, title, nextSlug, seo, content);

			if (updated.slug !== page.slug) {
				throw redirect(303, buildEditPagePath(updated.slug));
			}

			return { page: updated, seo, content, reusableBlocks };
		} catch (err) {
			if (err && typeof err === 'object' && 'status' in err && 'location' in err) {
				throw err;
			}
			console.error('Error updating page:', err);
			return fail(500, { error: 'Failed to update page' });
		}
	}
} satisfies Actions;
