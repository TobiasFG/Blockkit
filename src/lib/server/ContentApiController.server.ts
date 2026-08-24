import type { BlockInstance } from '$lib/pageContent';
import { resolveBlocks } from '$lib/contentApiBlocks';
import { ROOT_PAGE_PATH } from '$lib/pagePath';
import type { ContentApiPage, ContentApiPageSummary } from '$lib/contentApi';
import { prisma } from '$lib/server/prisma.server';
import { normalizeBlockInstance } from '$lib/reusableBlocks';

type PublishedPageRow = {
	id: string;
	title: string;
	parent_page_id: string | null;
	path_segment: string | null;
	content: unknown;
	meta: Record<string, unknown> | null;
	published_at: Date | null;
};

const loadPublishedPageRows = async (): Promise<PublishedPageRow[]> => {
	const pages = await prisma.page.findMany({
		where: { deleted_at: null, published_version_id: { not: null } },
		select: { id: true, published_version_id: true }
	});

	const versions = await prisma.pageVersion.findMany({
		where: { id: { in: pages.map((page) => page.published_version_id as string) } }
	});
	const versionsById = new Map(versions.map((version) => [version.id, version]));

	return pages.flatMap((page) => {
		const version = versionsById.get(page.published_version_id as string);
		if (!version) return [];

		return [
			{
				id: page.id,
				title: version.title,
				parent_page_id: version.parent_page_id,
				path_segment: version.path_segment,
				content: version.content,
				meta: (version.meta as Record<string, unknown> | null) ?? null,
				published_at: version.published_at
			}
		];
	});
};

// A published page whose parent is unpublished has no reachable URL, so it is
// left out of the API instead of failing the whole request.
const buildPublishedPaths = (rows: PublishedPageRow[]) => {
	const rowsById = new Map(rows.map((row) => [row.id, row]));
	const paths = new Map<string, string>();
	const visiting = new Set<string>();

	const resolve = (id: string): string | null => {
		const cached = paths.get(id);
		if (cached) return cached;
		if (visiting.has(id)) return null;

		const row = rowsById.get(id);
		if (!row) return null;
		if (row.parent_page_id === null) {
			paths.set(id, ROOT_PAGE_PATH);
			return ROOT_PAGE_PATH;
		}

		visiting.add(id);
		const parentPath = resolve(row.parent_page_id);
		visiting.delete(id);

		const segment = row.path_segment?.trim();
		if (!parentPath || !segment) return null;

		const path = parentPath === ROOT_PAGE_PATH ? `/${segment}` : `${parentPath}/${segment}`;
		paths.set(id, path);
		return path;
	};

	for (const row of rows) resolve(row.id);
	return paths;
};

const loadPublishedReusableBlocks = async () => {
	const blocks = await prisma.reusableBlock.findMany({
		where: { deleted_at: null, published_version_id: { not: null } },
		select: { id: true, published_version_id: true }
	});

	const versions = await prisma.reusableBlockVersion.findMany({
		where: { id: { in: blocks.map((block) => block.published_version_id as string) } }
	});
	const versionsById = new Map(versions.map((version) => [version.id, version]));

	const resolved = new Map<string, BlockInstance>();
	for (const block of blocks) {
		const version = versionsById.get(block.published_version_id as string);
		const content = version ? normalizeBlockInstance(version.content) : null;
		if (content) resolved.set(block.id, content);
	}

	return resolved;
};

const buildPage = (
	row: PublishedPageRow,
	path: string,
	reusableBlocks: Map<string, BlockInstance>
): ContentApiPage => ({
	id: row.id,
	path,
	title: row.title,
	published_at: row.published_at?.toISOString() ?? null,
	meta: row.meta ?? {},
	blocks: resolveBlocks(row.content, reusableBlocks)
});

export const listPublishedPages = async (): Promise<ContentApiPageSummary[]> => {
	const rows = await loadPublishedPageRows();
	const paths = buildPublishedPaths(rows);

	return rows
		.flatMap((row) => {
			const path = paths.get(row.id);
			if (!path) return [];
			return [
				{
					id: row.id,
					path,
					title: row.title,
					published_at: row.published_at?.toISOString() ?? null
				}
			];
		})
		.sort((a, b) => a.path.localeCompare(b.path));
};

export const getPublishedPageByPath = async (path: string): Promise<ContentApiPage | null> => {
	const rows = await loadPublishedPageRows();
	const paths = buildPublishedPaths(rows);
	const reusableBlocks = await loadPublishedReusableBlocks();

	for (const row of rows) {
		const rowPath = paths.get(row.id);
		if (rowPath === path) return buildPage(row, rowPath, reusableBlocks);
	}

	return null;
};

export const getPublishedPageById = async (id: string): Promise<ContentApiPage | null> => {
	const rows = await loadPublishedPageRows();
	const row = rows.find((candidate) => candidate.id === id);
	if (!row) return null;

	const path = buildPublishedPaths(rows).get(row.id);
	if (!path) return null;

	return buildPage(row, path, await loadPublishedReusableBlocks());
};
