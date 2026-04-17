import {
	isReusableBlockReference,
	parsePageContent,
	serializePageContent,
	type PageBlockNode,
	type PageContent
} from '$lib/pageContent';
import { derivePathSegment, buildPagePathMap } from '$lib/pagePath';
import { serializePageSeoMeta, type PageSeoMeta } from '$lib/pageSeoMeta';
import type { Page, PageDraftVersion, ReferencingPage } from '$lib/types';
import { supabaseAdmin } from '$lib/server/supabase.server';

const TABLE = 'pages' as const;
const PAGE_VERSIONS_TABLE = 'page_versions' as const;

type PageShellRow = {
	id: string;
	created_at: string;
	updated_at: string;
	draft_version_id: string | null;
	published_version_id: string | null;
};

type PageVersionRow = {
	id: string;
	page_id: string;
	status: 'draft' | 'published' | 'archived';
	title: string;
	parent_page_id: string | null;
	url_name: string | null;
	path_segment: string | null;
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

	const { data, error } = await supabaseAdmin.from(PAGE_VERSIONS_TABLE).select('*').in('id', uniqueIds);
	if (error) throw error;

	return new Map(((data ?? []) as PageVersionRow[]).map((row) => [row.id, row]));
};

const pageVersionsMatch = (draftVersion: PageVersionRow | null, publishedVersion: PageVersionRow | null) => {
	if (!draftVersion) return false;
	if (!publishedVersion) return true;

	return (
		draftVersion.title === publishedVersion.title &&
		(draftVersion.parent_page_id ?? null) === (publishedVersion.parent_page_id ?? null) &&
		(draftVersion.url_name ?? null) === (publishedVersion.url_name ?? null) &&
		(draftVersion.path_segment ?? null) === (publishedVersion.path_segment ?? null) &&
		JSON.stringify(draftVersion.content ?? null) === JSON.stringify(publishedVersion.content ?? null) &&
		JSON.stringify(draftVersion.meta ?? {}) === JSON.stringify(publishedVersion.meta ?? {})
	);
};

const parsePage = (
	row: PageShellRow,
	versionsById: Map<string, PageVersionRow>,
	draftPathMap: Map<string, string>,
	publishedPathMap: Map<string, string>
): Page => {
	const draftVersion = row.draft_version_id ? versionsById.get(row.draft_version_id) ?? null : null;
	const publishedVersion = row.published_version_id ? versionsById.get(row.published_version_id) ?? null : null;
	const isPublished = publishedVersion !== null;
	const updatedAt = [row.updated_at, draftVersion?.updated_at ?? '', publishedVersion?.updated_at ?? '']
		.filter(Boolean)
		.sort()
		.at(-1);

	return {
		id: row.id,
		title: draftVersion?.title ?? publishedVersion?.title ?? 'Untitled page',
		path: draftPathMap.get(row.id) ?? publishedPathMap.get(row.id) ?? '/',
		live_title: publishedVersion?.title ?? null,
		live_path: publishedPathMap.get(row.id) ?? null,
		parent_page_id: draftVersion?.parent_page_id ?? null,
		published_parent_page_id: publishedVersion?.parent_page_id ?? null,
		url_name: draftVersion?.url_name ?? null,
		path_segment: draftVersion?.path_segment ?? null,
		published_url_name: publishedVersion?.url_name ?? null,
		published_path_segment: publishedVersion?.path_segment ?? null,
		created_at: row.created_at,
		updated_at: updatedAt ?? row.updated_at,
		draft_version_id: row.draft_version_id,
		published_version_id: row.published_version_id,
		has_unpublished_changes: draftVersion !== null && (!isPublished || !pageVersionsMatch(draftVersion, publishedVersion)),
		is_published: isPublished,
		last_published_at: publishedVersion?.published_at ?? null
	};
};

const buildPathMaps = (rows: PageShellRow[], versionsById: Map<string, PageVersionRow>) => {
	const draftNodes = rows
		.map((row) => {
			const version = row.draft_version_id ? versionsById.get(row.draft_version_id) ?? null : null;
			if (!version) return null;
			return {
				id: row.id,
				parent_page_id: version.parent_page_id,
				path_segment: version.path_segment
			};
		})
		.filter((entry): entry is { id: string; parent_page_id: string | null; path_segment: string | null } =>
			Boolean(entry)
		);

	const publishedNodes = rows
		.map((row) => {
			const version = row.published_version_id ? versionsById.get(row.published_version_id) ?? null : null;
			if (!version) return null;
			return {
				id: row.id,
				parent_page_id: version.parent_page_id,
				path_segment: version.path_segment
			};
		})
		.filter((entry): entry is { id: string; parent_page_id: string | null; path_segment: string | null } =>
			Boolean(entry)
		);

	return {
		draftPathMap: buildPagePathMap(draftNodes),
		publishedPathMap: buildPagePathMap(publishedNodes)
	};
};

const parsePages = async (rows: PageShellRow[]) => {
	const versionsById = await getVersionRowsById(
		rows.flatMap((item) => [String(item.draft_version_id ?? ''), String(item.published_version_id ?? '')])
	);
	const { draftPathMap, publishedPathMap } = buildPathMaps(rows, versionsById);

	return rows.map((row) => parsePage(row, versionsById, draftPathMap, publishedPathMap));
};

const touchPageShell = async (pageId: string) => {
	const { error } = await supabaseAdmin.from(TABLE).update({ updated_at: new Date().toISOString() }).eq('id', pageId);
	if (error) throw error;
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
	publishedVersion: PageDraftVersion,
	revision: number
): Promise<string> => {
	const { data, error } = await supabaseAdmin
		.from(PAGE_VERSIONS_TABLE)
		.insert({
			page_id: pageId,
			status: 'draft',
			title: publishedVersion.title,
			parent_page_id: publishedVersion.parent_page_id,
			url_name: publishedVersion.url_name,
			path_segment: publishedVersion.path_segment,
			content: serializePageContent(publishedVersion.content),
			meta: publishedVersion.meta,
			parent_id: publishedVersion.id,
			revision
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

export const createPage = async ({
	title,
	parentPageId,
	urlName
}: {
	title: string;
	parentPageId: string;
	urlName?: string | null;
}): Promise<Page> => {
	const pathSegment = derivePathSegment(title, urlName);
	const { data: pageRow, error } = await supabaseAdmin.from(TABLE).insert({}).select('id').single();
	if (error) throw error;

	const pageId = String(pageRow.id);
	const { data: draftRow, error: draftError } = await supabaseAdmin
		.from(PAGE_VERSIONS_TABLE)
		.insert({
			page_id: pageId,
			status: 'draft',
			title,
			parent_page_id: parentPageId,
			url_name: (urlName ?? '').trim() || null,
			path_segment: pathSegment,
			content: serializePageContent({ version: 1, layout: null, blocks: [] }),
			meta: {},
			revision: 1
		})
		.select('id')
		.single();

	if (draftError) throw draftError;

	const { error: updateError } = await supabaseAdmin
		.from(TABLE)
		.update({ draft_version_id: String(draftRow.id) })
		.eq('id', pageId);
	if (updateError) throw updateError;

	return (await getPageById(pageId)) as Page;
};

export const deletePageById = async (id: string): Promise<void> => {
	const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', id);
	if (error) throw error;
};

export const getPages = async (): Promise<Page[]> => {
	const { data, error } = await supabaseAdmin.from(TABLE).select('*').order('created_at');
	if (error) throw error;

	return parsePages((data ?? []) as PageShellRow[]);
};

export const getPageById = async (id: string): Promise<Page | null> => {
	const pages = await getPages();
	return pages.find((page) => page.id === id) ?? null;
};

export const getDraftVersionById = async (id: string): Promise<PageDraftVersion | null> => {
	const { data, error } = await supabaseAdmin
		.from(PAGE_VERSIONS_TABLE)
		.select(
			'id, page_id, status, title, parent_page_id, url_name, path_segment, content, meta, parent_id, revision, created_at, updated_at, published_at'
		)
		.eq('id', id)
		.maybeSingle();

	if (error) throw error;
	if (!data) return null;

	return {
		id: data.id,
		page_id: data.page_id,
		status: data.status,
		title: data.title,
		parent_page_id: data.parent_page_id,
		url_name: data.url_name,
		path_segment: data.path_segment,
		content: parsePageContent(data.content),
		meta: (data.meta as Record<string, unknown> | null) ?? {},
		parent_id: data.parent_id,
		revision: data.revision,
		created_at: data.created_at,
		updated_at: data.updated_at,
		published_at: data.published_at
	};
};

export const updatePageShell = async (
	id: string,
	updates: Partial<Pick<Page, 'draft_version_id' | 'published_version_id'>>
): Promise<Page> => {
	const payload = Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== undefined));
	const { data, error } = await supabaseAdmin.from(TABLE).update(payload).eq('id', id).select('id').single();
	if (error) throw error;
	return (await getPageById(String(data.id))) as Page;
};

export const draftPathSegmentExists = async ({
	parentPageId,
	pathSegment,
	excludePageId
}: {
	parentPageId: string;
	pathSegment: string;
	excludePageId?: string;
}) => {
	const pages = await getPages();
	return pages.some(
		(page) =>
			page.parent_page_id === parentPageId &&
			page.path_segment === pathSegment &&
			page.id !== excludePageId
	);
};

export const getPagesReferencingReusableBlock = async (
	reusableBlockId: string
): Promise<ReferencingPage[]> => {
	const pages = await getPages();
	const matches: ReferencingPage[] = [];

	for (const page of pages) {
		if (!page.draft_version_id) continue;
		const draftVersion = await getDraftVersionById(page.draft_version_id);
		if (!draftVersion) continue;
		if (pageContentReferencesReusableBlock(draftVersion.content.blocks, reusableBlockId)) {
			matches.push({
				id: page.id,
				title: page.title,
				path: page.path
			});
		}
	}

	return matches;
};

export const getReusableBlockPageReferences = async (): Promise<Record<string, ReferencingPage[]>> => {
	const pages = await getPages();
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
				path: page.path
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
		const fullPage = await getPageById(page.id);
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

export const updatePageDraftSeoAndContent = async (
	page: Page,
	{
		title,
		parentPageId,
		urlName,
		seo,
		content
	}: {
		title: string;
		parentPageId: string | null;
		urlName?: string | null;
		seo: PageSeoMeta;
		content: PageContent;
	}
): Promise<Page> => {
	if (!page.draft_version_id) {
		throw new Error(`Page ${page.id} is missing a draft version`);
	}

	const draftVersion = await getDraftVersionById(page.draft_version_id);
	if (!draftVersion) {
		throw new Error(`Draft version ${page.draft_version_id} not found for page ${page.id}`);
	}

	const nextMeta = serializePageSeoMeta(draftVersion.meta, seo);
	const pathSegment = parentPageId === null ? null : derivePathSegment(title, urlName);
	const { error } = await supabaseAdmin
		.from(PAGE_VERSIONS_TABLE)
		.update({
			title,
			parent_page_id: parentPageId,
			url_name: parentPageId === null ? null : (urlName ?? '').trim() || null,
			path_segment: pathSegment,
			meta: nextMeta,
			content: serializePageContent(content)
		})
		.eq('id', draftVersion.id);

	if (error) throw error;
	await touchPageShell(page.id);
	return (await getPageById(page.id)) as Page;
};

export const publishPage = async (page: Page): Promise<Page> => {
	if (!page.draft_version_id) {
		throw new Error(`Page ${page.id} is missing a draft version`);
	}

	const draftVersion = await getDraftVersionById(page.draft_version_id);
	if (!draftVersion) {
		throw new Error(`Draft version ${page.draft_version_id} not found for page ${page.id}`);
	}

	const publishedRevision = await getNextPageRevision(page.id);
	const { error: archivePublishedError } = await supabaseAdmin
		.from(PAGE_VERSIONS_TABLE)
		.update({ status: 'archived' })
		.eq('page_id', page.id)
		.eq('status', 'published');
	if (archivePublishedError) throw archivePublishedError;

	const { data: publishedRow, error: publishError } = await supabaseAdmin
		.from(PAGE_VERSIONS_TABLE)
		.insert({
			page_id: page.id,
			status: 'published',
			title: draftVersion.title,
			parent_page_id: draftVersion.parent_page_id,
			url_name: draftVersion.url_name,
			path_segment: draftVersion.path_segment,
			content: serializePageContent(draftVersion.content),
			meta: draftVersion.meta,
			parent_id: draftVersion.id,
			revision: publishedRevision,
			published_at: new Date().toISOString()
		})
		.select('id')
		.single();
	if (publishError) throw publishError;

	const { error: archiveDraftError } = await supabaseAdmin
		.from(PAGE_VERSIONS_TABLE)
		.update({ status: 'archived' })
		.eq('id', draftVersion.id)
		.eq('status', 'draft');
	if (archiveDraftError) throw archiveDraftError;

	const publishedVersion = await getDraftVersionById(String(publishedRow.id));
	if (!publishedVersion) {
		throw new Error(`Published version ${String(publishedRow.id)} not found for page ${page.id}`);
	}

	const cleanDraftId = await createCleanDraftFromPublishedVersion(page.id, publishedVersion, publishedRevision + 1);
	await updatePageShell(page.id, {
		draft_version_id: cleanDraftId,
		published_version_id: publishedVersion.id
	});
	await touchPageShell(page.id);
	return (await getPageById(page.id)) as Page;
};
