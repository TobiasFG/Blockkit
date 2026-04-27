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
import { prisma } from '$lib/server/prisma.server';
import type { Prisma } from '../../../generated/prisma/client';

type PageShellRow = {
	id: string;
	created_at: Date;
	updated_at: Date;
	draft_version_id: string | null;
	published_version_id: string | null;
	deleted_at: Date | null;
};

type PageVersionRow = {
	id: string;
	page_id: string;
	status: string;
	title: string;
	parent_page_id: string | null;
	url_name: string | null;
	path_segment: string | null;
	content: unknown;
	meta: Record<string, unknown> | null;
	parent_id: string | null;
	revision: number | null;
	created_at: Date;
	updated_at: Date;
	published_at: Date | null;
};

const toIso = (value: Date | string | null | undefined) =>
	value instanceof Date ? value.toISOString() : (value ?? null);

const toJsonInput = (value: unknown) => value as Prisma.InputJsonValue;

const normalizePageVersionRow = (row: PageVersionRow): PageVersionRow => ({
	...row,
	meta: (row.meta as Record<string, unknown> | null) ?? null
});

const getVersionRowsById = async (versionIds: string[]): Promise<Map<string, PageVersionRow>> => {
	const uniqueIds = Array.from(new Set(versionIds.filter(Boolean)));
	if (uniqueIds.length === 0) return new Map();

	const data = await prisma.pageVersion.findMany({
		where: { id: { in: uniqueIds } }
	});

	return new Map(data.map((row) => [row.id, normalizePageVersionRow(row as PageVersionRow)]));
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
	const updatedAt = [row.updated_at, draftVersion?.updated_at, publishedVersion?.updated_at]
		.filter(Boolean)
		.map((value) => toIso(value) as string)
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
		created_at: toIso(row.created_at) as string,
		updated_at: updatedAt ?? (toIso(row.updated_at) as string),
		draft_version_id: row.draft_version_id,
		published_version_id: row.published_version_id,
		has_unpublished_changes: draftVersion !== null && (!isPublished || !pageVersionsMatch(draftVersion, publishedVersion)),
		is_published: isPublished,
		last_published_at: toIso(publishedVersion?.published_at) as string | null,
		deleted_at: toIso(row.deleted_at) as string | null
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

const getPageRows = async ({
	includeDeleted = false,
	deletedOnly = false
}: {
	includeDeleted?: boolean;
	deletedOnly?: boolean;
} = {}) => {
	return prisma.page.findMany({
		where: deletedOnly ? { deleted_at: { not: null } } : includeDeleted ? undefined : { deleted_at: null },
		orderBy: { created_at: 'asc' }
	}) as Promise<PageShellRow[]>;
};

const touchPageShell = async (pageId: string) => {
	await prisma.page.update({ where: { id: pageId }, data: { updated_at: new Date() } });
};

const getNextPageRevision = async (pageId: string) => {
	const data = await prisma.pageVersion.findFirst({
		where: { page_id: pageId },
		orderBy: { revision: 'desc' },
		select: { revision: true }
	});

	return Number(data?.revision ?? 0) + 1;
};

const createCleanDraftFromPublishedVersion = async (
	pageId: string,
	publishedVersion: PageDraftVersion,
	revision: number
): Promise<string> => {
	const data = await prisma.pageVersion.create({
		data: {
			page_id: pageId,
			status: 'draft',
			title: publishedVersion.title,
			parent_page_id: publishedVersion.parent_page_id,
			url_name: publishedVersion.url_name,
			path_segment: publishedVersion.path_segment,
			content: toJsonInput(serializePageContent(publishedVersion.content)),
			meta: toJsonInput(publishedVersion.meta),
			parent_id: publishedVersion.id,
			revision
		},
		select: { id: true }
	});

	return data.id;
};

const pageContentReferencesReusableBlock = (blocks: PageBlockNode[], reusableBlockId: string): boolean =>
	blocks.some(
		(block) => isReusableBlockReference(block) && block.reusableBlockId === reusableBlockId
	);

const removeReusableBlockReferencesFromPageContent = (
	content: PageContent,
	reusableBlockId: string
): PageContent => ({
	version: 1,
	layout: content.layout,
	blocks: content.blocks.filter(
		(block) => !(isReusableBlockReference(block) && block.reusableBlockId === reusableBlockId)
	)
});

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
	const pageRow = await prisma.page.create({ data: {}, select: { id: true } });

	const pageId = pageRow.id;
	const draftRow = await prisma.pageVersion.create({
		data: {
			page_id: pageId,
			status: 'draft',
			title,
			parent_page_id: parentPageId,
			url_name: (urlName ?? '').trim() || null,
			path_segment: pathSegment,
			content: toJsonInput(serializePageContent({ version: 1, layout: null, blocks: [] })),
			meta: toJsonInput({}),
			revision: 1
		},
		select: { id: true }
	});

	await prisma.page.update({ where: { id: pageId }, data: { draft_version_id: draftRow.id } });

	return (await getPageById(pageId)) as Page;
};

export const softDeletePageById = async (id: string): Promise<void> => {
	await prisma.page.updateMany({
		where: { id, deleted_at: null },
		data: { deleted_at: new Date() }
	});
};

export const getPages = async (): Promise<Page[]> => {
	return parsePages(await getPageRows());
};

export const getDeletedPages = async (): Promise<Page[]> => parsePages(await getPageRows({ deletedOnly: true }));

export const getPageById = async (
	id: string,
	{ includeDeleted = false }: { includeDeleted?: boolean } = {}
): Promise<Page | null> => {
	const pages = await parsePages(await getPageRows({ includeDeleted }));
	return pages.find((page) => page.id === id) ?? null;
};

export const getDraftVersionById = async (id: string): Promise<PageDraftVersion | null> => {
	const data = await prisma.pageVersion.findUnique({ where: { id } });
	if (!data) return null;

	return {
		id: data.id,
		page_id: data.page_id,
		status: data.status as PageDraftVersion['status'],
		title: data.title,
		parent_page_id: data.parent_page_id,
		url_name: data.url_name,
		path_segment: data.path_segment,
		content: parsePageContent(data.content),
		meta: (data.meta as Record<string, unknown> | null) ?? {},
		parent_id: data.parent_id,
		revision: data.revision,
		created_at: toIso(data.created_at) as string,
		updated_at: toIso(data.updated_at) as string,
		published_at: toIso(data.published_at) as string | null
	};
};

const getPageVersionById = async (id: string): Promise<PageDraftVersion | null> => getDraftVersionById(id);

export const updatePageShell = async (
	id: string,
	updates: Partial<Pick<Page, 'draft_version_id' | 'published_version_id'>>
): Promise<Page> => {
	const payload = Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== undefined));
	const data = await prisma.page.update({ where: { id }, data: payload, select: { id: true } });
	return (await getPageById(data.id)) as Page;
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
		let hasReference = false;

		for (const versionId of [page.draft_version_id, page.published_version_id]) {
			if (!versionId) continue;
			const version = await getPageVersionById(versionId);
			if (!version) continue;
			if (pageContentReferencesReusableBlock(version.content.blocks, reusableBlockId)) {
				hasReference = true;
				break;
			}
		}

		if (hasReference) {
			matches.push({
				id: page.id,
				title: page.title,
				path: page.path
			});
		}
	}

	return matches;
};

export const getDeletedPagesReferencingParent = async (parentPageId: string): Promise<ReferencingPage[]> => {
	const pages = await getDeletedPages();
	return pages
		.filter((page) => page.parent_page_id === parentPageId)
		.map((page) => ({ id: page.id, title: page.title, path: page.path }));
};

export const getReusableBlockPageReferences = async (): Promise<Record<string, ReferencingPage[]>> => {
	const pages = await getPages();
	const references: Record<string, ReferencingPage[]> = {};

	for (const page of pages) {
		const pageBlockIds = new Set<string>();

		for (const versionId of [page.draft_version_id, page.published_version_id]) {
			if (!versionId) continue;
			const version = await getPageVersionById(versionId);
			if (!version) continue;

			for (const block of version.content.blocks) {
				if (!isReusableBlockReference(block)) continue;
				pageBlockIds.add(block.reusableBlockId);
			}
		}

		for (const blockId of pageBlockIds) {
			references[blockId] ??= [];
			references[blockId].push({
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
		const fullPage = await getPageById(page.id, { includeDeleted: true });
		if (!fullPage) continue;

		for (const versionId of [fullPage.draft_version_id, fullPage.published_version_id]) {
			if (!versionId) continue;
			const version = await getPageVersionById(versionId);
			if (!version) continue;

			await updateDraftVersionContent(
				version.id,
				removeReusableBlockReferencesFromPageContent(version.content, reusableBlockId)
			);
		}
	}

	return pages;
};

export const updateDraftVersionContent = async (
	draftVersionId: string,
	content: PageContent
): Promise<void> => {
	await prisma.pageVersion.update({
		where: { id: draftVersionId },
		data: { content: toJsonInput(serializePageContent(content)) }
	});
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
	await prisma.pageVersion.update({
		where: { id: draftVersion.id },
		data: {
			title,
			parent_page_id: parentPageId,
			url_name: parentPageId === null ? null : (urlName ?? '').trim() || null,
			path_segment: pathSegment,
			meta: toJsonInput(nextMeta),
			content: toJsonInput(serializePageContent(content))
		}
	});

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
	await prisma.pageVersion.updateMany({
		where: { page_id: page.id, status: 'published' },
		data: { status: 'archived' }
	});

	const publishedRow = await prisma.pageVersion.create({
		data: {
			page_id: page.id,
			status: 'published',
			title: draftVersion.title,
			parent_page_id: draftVersion.parent_page_id,
			url_name: draftVersion.url_name,
			path_segment: draftVersion.path_segment,
			content: toJsonInput(serializePageContent(draftVersion.content)),
			meta: toJsonInput(draftVersion.meta),
			parent_id: draftVersion.id,
			revision: publishedRevision,
			published_at: new Date()
		},
		select: { id: true }
	});

	await prisma.pageVersion.updateMany({
		where: { id: draftVersion.id, status: 'draft' },
		data: { status: 'archived' }
	});

	const publishedVersion = await getDraftVersionById(publishedRow.id);
	if (!publishedVersion) {
		throw new Error(`Published version ${publishedRow.id} not found for page ${page.id}`);
	}

	const cleanDraftId = await createCleanDraftFromPublishedVersion(page.id, publishedVersion, publishedRevision + 1);
	await updatePageShell(page.id, {
		draft_version_id: cleanDraftId,
		published_version_id: publishedVersion.id
	});
	await touchPageShell(page.id);
	return (await getPageById(page.id)) as Page;
};

export const ensurePageCanBeDeleted = async (id: string): Promise<void> => {
	const pages = await getPages();
	if (pages.some((page) => page.parent_page_id === id)) {
		throw new Error('Page with child pages cannot be moved to trash');
	}
};

export const restorePageById = async (id: string, parentPageId: string | null): Promise<Page> => {
	const page = await getPageById(id, { includeDeleted: true });
	if (!page) {
		throw new Error('Page not found');
	}

	if (!page.deleted_at) {
		throw new Error('Page is not in trash');
	}

	if (page.parent_page_id === null) {
		throw new Error('Root page cannot be restored from trash');
	}

	const nextParentId = parentPageId ?? page.parent_page_id;
	if (!nextParentId) {
		throw new Error('Parent page is required');
	}

	const parentPage = await getPageById(nextParentId);
	if (!parentPage) {
		throw new Error('Selected parent page not found');
	}

	const activePages = await getPages();
	if (
		activePages.some(
			(activePage) =>
				activePage.parent_page_id === nextParentId &&
				(activePage.path_segment === page.path_segment ||
					(page.published_path_segment && activePage.published_path_segment === page.published_path_segment))
		)
	) {
		throw new Error('Another page already uses this URL under selected parent');
	}

	await prisma.page.update({
		where: { id },
		data: { deleted_at: null, updated_at: new Date() }
	});

	for (const versionId of [page.draft_version_id, page.published_version_id]) {
		if (!versionId) continue;
		const version = await getPageVersionById(versionId);
		if (!version || version.parent_page_id === nextParentId) continue;

		await prisma.pageVersion.update({
			where: { id: version.id },
			data: { parent_page_id: nextParentId }
		});
	}

	return (await getPageById(id)) as Page;
};
