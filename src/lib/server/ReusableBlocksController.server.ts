import {
	createDefaultBlockInstance,
	isValidBlockInstance,
	normalizeBlockInstance
} from '$lib/reusableBlocks';
import type { BlockFolder, ReusableBlock } from '$lib/types';
import { prisma } from '$lib/server/prisma.server';
import type { Prisma } from '../../../generated/prisma/client';

type ReusableBlockVersionRow = {
	id: string;
	reusable_block_id: string;
	status: string;
	name: string;
	folder_id: string | null;
	block_type: string;
	content: unknown;
	parent_id: string | null;
	revision: number;
	created_at: Date;
	published_at: Date | null;
};

type ReusableBlockRow = Record<string, unknown> & {
	id: string;
	draft_version_id: string | null;
	published_version_id: string | null;
};

const toIso = (value: Date | string | null | undefined) =>
	value instanceof Date ? value.toISOString() : (value ?? null);

const toJsonInput = (value: unknown) => value as Prisma.InputJsonValue;

const parseFolder = (data: Record<string, unknown>): BlockFolder => ({
	id: String(data.id),
	name: String(data.name),
	parent_id: (data.parent_id as string | null) ?? null,
	sort_order: Number(data.sort_order ?? 0),
	created_at: String(toIso(data.created_at as Date | string | null) ?? ''),
	updated_at: String(toIso(data.updated_at as Date | string | null) ?? '')
});

const parseReusableBlockContent = (blockId: string, blockType: string, rawContent: unknown) => {
	const content = isValidBlockInstance(rawContent) ? rawContent : normalizeBlockInstance(rawContent);

	if (!content || !isValidBlockInstance(content) || content.type !== blockType) {
		throw new Error(`Invalid reusable block content for block ${blockId}`);
	}

	return content;
};

const reusableBlockVersionsMatch = (
	draftVersion: ReusableBlockVersionRow | null,
	publishedVersion: ReusableBlockVersionRow | null
) => {
	if (!draftVersion) return false;
	if (!publishedVersion) return true;

	return (
		draftVersion.name === publishedVersion.name &&
		(draftVersion.folder_id ?? null) === (publishedVersion.folder_id ?? null) &&
		draftVersion.block_type === publishedVersion.block_type &&
		JSON.stringify(draftVersion.content ?? null) === JSON.stringify(publishedVersion.content ?? null)
	);
};

const parseReusableBlock = (
	data: Record<string, unknown>,
	versionsById: Map<string, ReusableBlockVersionRow>
): ReusableBlock => {
	const id = String(data.id);
	const draftVersionId = (data.draft_version_id as string | null) ?? null;
	const publishedVersionId = (data.published_version_id as string | null) ?? null;
	const draftVersion = draftVersionId ? versionsById.get(draftVersionId) ?? null : null;
	const publishedVersion = publishedVersionId ? versionsById.get(publishedVersionId) ?? null : null;
	const version = draftVersion ?? publishedVersion;
	if (!version) {
		throw new Error(`Reusable block ${id} is missing a draft or published version`);
	}
	const blockType = version.block_type;
	const rawContent = draftVersion?.content ?? publishedVersion?.content;
	const content = parseReusableBlockContent(id, blockType, rawContent);

	return {
		id,
		name: version.name,
		folder_id: version.folder_id,
		block_type: blockType,
		content,
		draft_version_id: draftVersionId,
		published_version_id: publishedVersionId,
		has_unpublished_changes:
			draftVersion !== null && (publishedVersion === null || !reusableBlockVersionsMatch(draftVersion, publishedVersion)),
		is_published: publishedVersionId !== null,
		last_published_at: toIso(publishedVersion?.published_at) as string | null,
		created_at: String(toIso(data.created_at as Date | string | null) ?? ''),
		updated_at: String(toIso(data.updated_at as Date | string | null) ?? ''),
		deleted_at: toIso(data.deleted_at as Date | string | null) as string | null
	};
};

const getReusableBlockRows = async ({
	includeDeleted = false,
	deletedOnly = false
}: {
	includeDeleted?: boolean;
	deletedOnly?: boolean;
} = {}) => {
	return (await prisma.reusableBlock.findMany({
		where: deletedOnly ? { deleted_at: { not: null } } : includeDeleted ? undefined : { deleted_at: null },
		orderBy: { created_at: 'asc' }
	})) as Array<Record<string, unknown>>;
};

const getVersionRowsById = async (versionIds: string[]): Promise<Map<string, ReusableBlockVersionRow>> => {
	const uniqueIds = Array.from(new Set(versionIds.filter(Boolean)));
	if (uniqueIds.length === 0) return new Map();

	const data = await prisma.reusableBlockVersion.findMany({
		where: { id: { in: uniqueIds } }
	});

	return new Map((data as ReusableBlockVersionRow[]).map((row) => [row.id, row]));
};

const getReusableBlockRowById = async (id: string): Promise<ReusableBlockRow | null> => {
	return (await prisma.reusableBlock.findUnique({ where: { id } })) as ReusableBlockRow | null;
};

const getReusableBlockVersionById = async (id: string): Promise<ReusableBlockVersionRow | null> => {
	return (await prisma.reusableBlockVersion.findUnique({ where: { id } })) as ReusableBlockVersionRow | null;
};

const getNextReusableBlockRevision = async (reusableBlockId: string) => {
	const data = await prisma.reusableBlockVersion.findFirst({
		where: { reusable_block_id: reusableBlockId },
		orderBy: { revision: 'desc' },
		select: { revision: true }
	});
	return Number(data?.revision ?? 0) + 1;
};

export const getBlockFolders = async (): Promise<BlockFolder[]> => {
	const data = await prisma.blockFolder.findMany({
		orderBy: [{ sort_order: 'asc' }, { name: 'asc' }]
	});

	return data.map((item) => parseFolder(item as Record<string, unknown>));
};

export const getReusableBlocks = async (): Promise<ReusableBlock[]> => {
	const rows = await getReusableBlockRows();
	const versionsById = await getVersionRowsById(
		rows.flatMap((item) => [
			String(item.draft_version_id ?? ''),
			String(item.published_version_id ?? '')
		])
	);
	return rows.map((item) => parseReusableBlock(item, versionsById));
};

export const getDeletedReusableBlocks = async (): Promise<ReusableBlock[]> => {
	const rows = await getReusableBlockRows({ deletedOnly: true });
	const versionsById = await getVersionRowsById(
		rows.flatMap((item) => [
			String(item.draft_version_id ?? ''),
			String(item.published_version_id ?? '')
		])
	);
	return rows.map((item) => parseReusableBlock(item, versionsById));
};

export const getReusableBlockById = async (
	id: string,
	{ includeDeleted = false }: { includeDeleted?: boolean } = {}
): Promise<ReusableBlock | null> => {
	const data = await prisma.reusableBlock.findFirst({
		where: includeDeleted ? { id } : { id, deleted_at: null }
	});
	if (!data) return null;
	const versionsById = await getVersionRowsById([
		String(data.draft_version_id ?? ''),
		String(data.published_version_id ?? '')
	]);
	return parseReusableBlock(data as Record<string, unknown>, versionsById);
};

export const createBlockFolder = async (name: string, parentId: string | null): Promise<BlockFolder> => {
	const data = await prisma.blockFolder.create({
		data: {
			name,
			parent_id: parentId
		}
	});

	return parseFolder(data as Record<string, unknown>);
};

export const updateBlockFolder = async (
	id: string,
	updates: Partial<Pick<BlockFolder, 'name' | 'parent_id' | 'sort_order'>>
): Promise<BlockFolder> => {
	const payload = Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== undefined));
	const data = await prisma.blockFolder.update({
		where: { id },
		data: payload
	});

	return parseFolder(data as Record<string, unknown>);
};

export const deleteBlockFolder = async (id: string): Promise<void> => {
	const childFolders = await prisma.blockFolder.findMany({
		where: { parent_id: id },
		select: { id: true }
	});

	if (childFolders.length > 0) {
		throw new Error('Folder must be empty before it can be deleted');
	}

	const childBlocks = await prisma.reusableBlock.findMany({
		where: {
			deleted_at: null,
			draft_version_id: {
				in: (
					await prisma.reusableBlockVersion.findMany({
						where: { folder_id: id },
						select: { id: true }
					})
				).map((version) => version.id)
			}
		},
		select: { id: true }
	});

	if (childBlocks.length > 0) {
		throw new Error('Folder must be empty before it can be deleted');
	}

	await prisma.blockFolder.delete({ where: { id } });
};

export const createReusableBlock = async (
	name: string,
	type: string,
	folderId: string | null
): Promise<ReusableBlock> => {
	const content = createDefaultBlockInstance(type, crypto.randomUUID());
	const blockRow = await prisma.reusableBlock.create({
		data: {},
		select: { id: true }
	});

	const draftRow = await prisma.reusableBlockVersion.create({
		data: {
			reusable_block_id: blockRow.id,
			status: 'draft',
			name,
			folder_id: folderId,
			block_type: type,
			content: toJsonInput(content),
			revision: 1
		},
		select: { id: true }
	});

	await prisma.reusableBlock.update({
		where: { id: blockRow.id },
		data: {
			draft_version_id: draftRow.id,
			updated_at: new Date()
		}
	});

	const block = await getReusableBlockById(blockRow.id);
	if (!block) {
		throw new Error('Reusable block was created but could not be loaded');
	}

	return block;
};

export const softDeleteReusableBlock = async (id: string): Promise<void> => {
	await prisma.reusableBlock.updateMany({
		where: { id, deleted_at: null },
		data: { deleted_at: new Date() }
	});
};

export const restoreReusableBlock = async (id: string): Promise<ReusableBlock> => {
	await prisma.reusableBlock.update({
		where: { id },
		data: { deleted_at: null, updated_at: new Date() }
	});

	const block = await getReusableBlockById(id);
	if (!block) {
		throw new Error('Content not found after restore');
	}

	return block;
};

export const updateReusableBlock = async (
	id: string,
	updates: Partial<Pick<ReusableBlock, 'name' | 'folder_id'>> & { content?: ReusableBlock['content'] }
): Promise<ReusableBlock> => {
	const blockRow = await getReusableBlockRowById(id);
	if (!blockRow) {
		throw new Error(`Reusable block ${id} not found before draft save`);
	}
	if (!blockRow.draft_version_id) {
		throw new Error(`Reusable block ${id} is missing a draft version`);
	}

	const draftVersion = await getReusableBlockVersionById(blockRow.draft_version_id);
	if (!draftVersion) {
		throw new Error(`Draft version ${blockRow.draft_version_id} not found for reusable block ${id}`);
	}

	await prisma.reusableBlockVersion.updateMany({
		where: { id: blockRow.draft_version_id, status: 'draft' },
		data: { status: 'archived' }
	});

	const nextRevision = await getNextReusableBlockRevision(id);
	const draftRow = await prisma.reusableBlockVersion.create({
		data: {
			reusable_block_id: id,
			status: 'draft',
			name: updates.name ?? draftVersion.name,
			folder_id: updates.folder_id === undefined ? draftVersion.folder_id : updates.folder_id,
			block_type: draftVersion.block_type,
			content: toJsonInput(updates.content ?? draftVersion.content),
			parent_id: blockRow.draft_version_id,
			revision: nextRevision
		},
		select: { id: true }
	});

	await prisma.reusableBlock.update({
		where: { id },
		data: {
			draft_version_id: draftRow.id,
			updated_at: new Date()
		}
	});

	const block = await getReusableBlockById(id);
	if (!block) {
		throw new Error(`Reusable block ${id} not found after update`);
	}

	return block;
};

export const publishReusableBlock = async (id: string): Promise<ReusableBlock> => {
	const blockRow = await getReusableBlockRowById(id);
	if (!blockRow) {
		throw new Error(`Reusable block ${id} not found before publish`);
	}
	if (!blockRow.draft_version_id) {
		throw new Error(`Reusable block ${id} is missing a draft version`);
	}

	const draftVersion = await getReusableBlockVersionById(blockRow.draft_version_id);
	if (!draftVersion) {
		throw new Error(`Draft version ${blockRow.draft_version_id} not found for reusable block ${id}`);
	}

	if (blockRow.published_version_id) {
		await prisma.reusableBlockVersion.updateMany({
			where: { id: blockRow.published_version_id, status: 'published' },
			data: { status: 'archived' }
		});
	}

	await prisma.reusableBlockVersion.updateMany({
		where: { id: draftVersion.id, status: 'draft' },
		data: { status: 'archived' }
	});

	const publishedRevision = await getNextReusableBlockRevision(id);
	const publishedRow = await prisma.reusableBlockVersion.create({
		data: {
			reusable_block_id: id,
			status: 'published',
			name: draftVersion.name,
			folder_id: draftVersion.folder_id,
			block_type: draftVersion.block_type,
			content: toJsonInput(draftVersion.content),
			parent_id: draftVersion.id,
			revision: publishedRevision,
			published_at: new Date()
		},
		select: { id: true }
	});

	const cleanDraftRow = await prisma.reusableBlockVersion.create({
		data: {
			reusable_block_id: id,
			status: 'draft',
			name: draftVersion.name,
			folder_id: draftVersion.folder_id,
			block_type: draftVersion.block_type,
			content: toJsonInput(draftVersion.content),
			parent_id: publishedRow.id,
			revision: publishedRevision + 1
		},
		select: { id: true }
	});

	await prisma.reusableBlock.update({
		where: { id },
		data: {
			published_version_id: publishedRow.id,
			draft_version_id: cleanDraftRow.id,
			updated_at: new Date()
		}
	});

	const block = await getReusableBlockById(id);
	if (!block) {
		throw new Error(`Reusable block ${id} not found after publish`);
	}

	return block;
};
