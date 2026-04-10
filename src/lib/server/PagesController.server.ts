import {
	isReusableBlockReference,
	parsePageContent,
	serializePageContent,
	type PageBlockNode,
	type PageContent
} from '$lib/pageContent';
import { serializePageSeoMeta, type PageSeoMeta } from '$lib/pageSeoMeta';
import type { Page, PageDraftVersion, ReferencingPage } from '$lib/types';
import { supabaseAdmin } from '$lib/server/supabase.server';

const TABLE = 'pages' as const;
const PAGE_VERSIONS_TABLE = 'page_versions' as const;

export const createPage = async (title: string, slug: string): Promise<Page> => {
	const { data, error } = await supabaseAdmin
		.from(TABLE)
		.insert({ title, slug })
		.select('*')
		.single();

	if (error) throw error;
	return data as Page;
};

export const deletePage = async (slug: string): Promise<void> => {
	const { error } = await supabaseAdmin.from(TABLE).delete().eq('slug', slug);
	if (error) throw error;
};

export const deletePageById = async (id: string): Promise<void> => {
	const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', id);
	if (error) throw error;
};

export const pageExists = async (slug: string): Promise<boolean> => {
	const { data, error } = await supabaseAdmin
		.from(TABLE)
		.select('id')
		.eq('slug', slug)
		.maybeSingle();

	if (error) throw error;
	return Boolean(data);
};

export const getPages = async (): Promise<Page[]> => {
	const { data, error } = await supabaseAdmin.from(TABLE).select('*').order('created_at');
	if (error) throw error;
	return (data ?? []) as Page[];
};

export const getPageBySlugVariants = async (slugs: string[]): Promise<Page | null> => {
	const uniqueSlugs = Array.from(new Set(slugs));
	if (uniqueSlugs.length === 0) return null;

	const { data, error } = await supabaseAdmin.from(TABLE).select('*').in('slug', uniqueSlugs);
	if (error) throw error;

	const pages = (data ?? []) as Page[];
	if (pages.length === 0) return null;

	for (const slug of slugs) {
		const match = pages.find((page) => page.slug === slug);
		if (match) return match;
	}

	return pages[0] ?? null;
};

export const updatePage = async (
	id: string,
	updates: Partial<Pick<Page, 'title' | 'slug' | 'draft_version_id' | 'published_version_id'>>
): Promise<Page> => {
	const payload = Object.fromEntries(
		Object.entries(updates).filter(([, value]) => value !== undefined)
	);

	const { data, error } = await supabaseAdmin
		.from(TABLE)
		.update(payload)
		.eq('id', id)
		.select('*')
		.single();

	if (error) throw error;
	return data as Page;
};

export const getDraftVersionById = async (id: string): Promise<PageDraftVersion | null> => {
	const { data, error } = await supabaseAdmin
		.from(PAGE_VERSIONS_TABLE)
		.select('id, page_id, content, meta')
		.eq('id', id)
		.maybeSingle();

	if (error) throw error;
	if (!data) return null;

	return {
		id: data.id,
		page_id: data.page_id,
		content: parsePageContent(data.content),
		meta: (data.meta as Record<string, unknown> | null) ?? {}
	};
};

const pageContentReferencesReusableBlock = (blocks: PageBlockNode[], reusableBlockId: string): boolean =>
	blocks.some(
		(block) => isReusableBlockReference(block) && block.reusableBlockId === reusableBlockId
	);

export const getPagesReferencingReusableBlock = async (
	reusableBlockId: string
): Promise<ReferencingPage[]> => {
	const { data, error } = await supabaseAdmin
		.from(TABLE)
		.select('id, title, slug, draft_version_id');

	if (error) throw error;

	const pages = (data ?? []) as Array<
		Pick<Page, 'id' | 'title' | 'slug' | 'draft_version_id'>
	>;

	const matches: ReferencingPage[] = [];

	for (const page of pages) {
		if (!page.draft_version_id) continue;
		const draftVersion = await getDraftVersionById(page.draft_version_id);
		if (!draftVersion) continue;
		if (pageContentReferencesReusableBlock(draftVersion.content.blocks, reusableBlockId)) {
			matches.push({
				id: page.id,
				title: page.title,
				slug: page.slug
			});
		}
	}

	return matches;
};

export const getReusableBlockPageReferences = async (): Promise<Record<string, ReferencingPage[]>> => {
	const { data, error } = await supabaseAdmin
		.from(TABLE)
		.select('id, title, slug, draft_version_id');

	if (error) throw error;

	const pages = (data ?? []) as Array<
		Pick<Page, 'id' | 'title' | 'slug' | 'draft_version_id'>
	>;

	const references: Record<string, ReferencingPage[]> = {};

	for (const page of pages) {
		if (!page.draft_version_id) continue;
		const draftVersion = await getDraftVersionById(page.draft_version_id);
		if (!draftVersion) continue;

		for (const block of draftVersion.content.blocks) {
			if (!isReusableBlockReference(block)) continue;
			references[block.reusableBlockId] ??= [];
			references[block.reusableBlockId].push({
				id: page.id,
				title: page.title,
				slug: page.slug
			});
		}
	}

	return references;
};

export const removeReusableBlockReferencesFromPages = async (
	reusableBlockId: string
): Promise<ReferencingPage[]> => {
	const pages = await getPagesReferencingReusableBlock(reusableBlockId);

	for (const page of pages) {
		const fullPage = await getPageBySlugVariants([page.slug]);
		if (!fullPage?.draft_version_id) continue;

		const draftVersion = await getDraftVersionById(fullPage.draft_version_id);
		if (!draftVersion) continue;

		const nextContent: PageContent = {
			version: 1,
			layout: null,
			blocks: draftVersion.content.blocks.filter(
				(block) => !(isReusableBlockReference(block) && block.reusableBlockId === reusableBlockId)
			)
		};

		await updateDraftVersionContent(draftVersion.id, nextContent);
	}

	return pages;
};

export const updateDraftVersionContent = async (
	draftVersionId: string,
	content: PageContent
): Promise<void> => {
	const { error } = await supabaseAdmin
		.from(PAGE_VERSIONS_TABLE)
		.update({ content: serializePageContent(content) })
		.eq('id', draftVersionId);

	if (error) throw error;
};

export const updatePageTitleDraftSeoAndContent = async (
	page: Page,
	title: string,
	slug: string,
	seo: PageSeoMeta,
	content: PageContent
): Promise<Page> => {
	const updatedPage = await updatePage(page.id, { title, slug });

	if (!page.draft_version_id) {
		throw new Error(`Page ${page.id} is missing a draft version`);
	}

	const draftVersion = await getDraftVersionById(page.draft_version_id);

	if (!draftVersion) {
		throw new Error(`Draft version ${page.draft_version_id} not found for page ${page.id}`);
	}

	const nextMeta = serializePageSeoMeta(draftVersion.meta, seo);
	const { error } = await supabaseAdmin
		.from(PAGE_VERSIONS_TABLE)
		.update({ meta: nextMeta, content: serializePageContent(content) })
		.eq('id', draftVersion.id);

	if (error) throw error;

	return updatedPage;
};
