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

type PageVersionRow = {
	id: string;
	page_id: string;
	status: 'draft' | 'published' | 'archived';
	content: unknown;
	meta: Record<string, unknown> | null;
	parent_id: string | null;
	revision: number | null;
	created_at: string;
	updated_at: string;
	published_at: string | null;
};

const getVersionRowsById = async (versionIds: string[]): Promise<Map<string, PageVersionRow>> => {
	const uniqueIds = Array.from(new Set(versionIds.filter(Boolean)));
	if (uniqueIds.length === 0) return new Map();

	const { data, error } = await supabaseAdmin
		.from(PAGE_VERSIONS_TABLE)
		.select('*')
		.in('id', uniqueIds);

	if (error) throw error;

	return new Map(((data ?? []) as PageVersionRow[]).map((row) => [row.id, row]));
};

const pageVersionsMatch = (draftVersion: PageVersionRow | null, publishedVersion: PageVersionRow | null) => {
	if (!draftVersion) return false;
	if (!publishedVersion) return true;

	return (
		JSON.stringify(draftVersion.content ?? null) === JSON.stringify(publishedVersion.content ?? null) &&
		JSON.stringify(draftVersion.meta ?? {}) === JSON.stringify(publishedVersion.meta ?? {})
	);
};

const parsePage = (data: Record<string, unknown>, versionsById: Map<string, PageVersionRow>): Page => {
	const draftVersionId = (data.draft_version_id as string | null) ?? null;
	const publishedVersionId = (data.published_version_id as string | null) ?? null;
	const draftVersion = draftVersionId ? versionsById.get(draftVersionId) ?? null : null;
	const publishedVersion = publishedVersionId ? versionsById.get(publishedVersionId) ?? null : null;
	const isPublished = publishedVersion !== null;

	return {
		id: String(data.id),
		title: String(data.title),
		slug: String(data.slug),
		created_at: String(data.created_at ?? ''),
		updated_at: String(data.updated_at ?? ''),
		draft_version_id: draftVersionId,
		published_version_id: publishedVersionId,
		has_unpublished_changes: draftVersion !== null && (!isPublished || !pageVersionsMatch(draftVersion, publishedVersion)),
		is_published: isPublished,
		last_published_at: publishedVersion?.published_at ?? null
	};
};

export const createPage = async (title: string, slug: string): Promise<Page> => {
	const { data, error } = await supabaseAdmin
		.from(TABLE)
		.insert({ title, slug })
		.select('id')
		.single();

	if (error) throw error;
	return (await getPageById(String(data.id))) as Page;
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

	const rows = (data ?? []) as Array<Record<string, unknown>>;
	const versionsById = await getVersionRowsById(
		rows.flatMap((item) => [String(item.draft_version_id ?? ''), String(item.published_version_id ?? '')])
	);

	return rows.map((item) => parsePage(item, versionsById));
};

export const getPageBySlugVariants = async (slugs: string[]): Promise<Page | null> => {
	const uniqueSlugs = Array.from(new Set(slugs));
	if (uniqueSlugs.length === 0) return null;

	const { data, error } = await supabaseAdmin.from(TABLE).select('*').in('slug', uniqueSlugs);
	if (error) throw error;

	const rows = (data ?? []) as Array<Record<string, unknown>>;
	if (rows.length === 0) return null;

	const versionsById = await getVersionRowsById(
		rows.flatMap((item) => [String(item.draft_version_id ?? ''), String(item.published_version_id ?? '')])
	);
	const pages = rows.map((item) => parsePage(item, versionsById));
	if (pages.length === 0) return null;

	for (const slug of slugs) {
		const match = pages.find((page) => page.slug === slug);
		if (match) return match;
	}

	return pages[0] ?? null;
};

export const getPageById = async (id: string): Promise<Page | null> => {
	const { data, error } = await supabaseAdmin.from(TABLE).select('*').eq('id', id).maybeSingle();
	if (error) throw error;
	if (!data) return null;

	const versionsById = await getVersionRowsById([
		String(data.draft_version_id ?? ''),
		String(data.published_version_id ?? '')
	]);

	return parsePage(data as Record<string, unknown>, versionsById);
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
		.select('id')
		.single();

	if (error) throw error;
	return (await getPageById(String(data.id))) as Page;
};

export const getDraftVersionById = async (id: string): Promise<PageDraftVersion | null> => {
	const { data, error } = await supabaseAdmin
		.from(PAGE_VERSIONS_TABLE)
		.select('id, page_id, status, content, meta, parent_id, revision, created_at, updated_at, published_at')
		.eq('id', id)
		.maybeSingle();

	if (error) throw error;
	if (!data) return null;

	return {
		id: data.id,
		page_id: data.page_id,
		status: data.status,
		content: parsePageContent(data.content),
		meta: (data.meta as Record<string, unknown> | null) ?? {},
		parent_id: data.parent_id,
		revision: data.revision,
		created_at: data.created_at,
		updated_at: data.updated_at,
		published_at: data.published_at
	};
};

const getNextPageRevision = async (pageId: string) => {
	const { data, error } = await supabaseAdmin
		.from(PAGE_VERSIONS_TABLE)
		.select('revision')
		.eq('page_id', pageId)
		.order('revision', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) throw error;
	return Number(data?.revision ?? 0) + 1;
};

const createCleanDraftFromPublishedVersion = async (
	pageId: string,
	publishedVersion: PageDraftVersion
): Promise<string> => {
	const nextRevision = await getNextPageRevision(pageId);
	const { data, error } = await supabaseAdmin
		.from(PAGE_VERSIONS_TABLE)
		.insert({
			page_id: pageId,
			status: 'draft',
			content: serializePageContent(publishedVersion.content),
			meta: publishedVersion.meta,
			parent_id: publishedVersion.id,
			revision: nextRevision
		})
		.select('id')
		.single();

	if (error) throw error;
	return String(data.id);
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

	return (await getPageById(updatedPage.id)) as Page;
};

export const publishPage = async (page: Page): Promise<Page> => {
	if (!page.draft_version_id) {
		throw new Error(`Page ${page.id} is missing a draft version`);
	}

	const draftVersion = await getDraftVersionById(page.draft_version_id);
	if (!draftVersion) {
		throw new Error(`Draft version ${page.draft_version_id} not found for page ${page.id}`);
	}

	const { data: publishedVersionId, error } = await supabaseAdmin.rpc('publish_page', {
		_page_id: page.id,
		_meta: draftVersion.meta
	});

	if (error) throw error;

	const publishedVersion = await getDraftVersionById(String(publishedVersionId));
	if (!publishedVersion) {
		throw new Error(`Published version ${String(publishedVersionId)} not found for page ${page.id}`);
	}

	const { error: archiveError } = await supabaseAdmin
		.from(PAGE_VERSIONS_TABLE)
		.update({ status: 'archived' })
		.eq('id', draftVersion.id)
		.eq('status', 'draft');

	if (archiveError) throw archiveError;

	const cleanDraftId = await createCleanDraftFromPublishedVersion(page.id, publishedVersion);
	await updatePage(page.id, {
		draft_version_id: cleanDraftId,
		published_version_id: publishedVersion.id
	});

	return (await getPageById(page.id)) as Page;
};
