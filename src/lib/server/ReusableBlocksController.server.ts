import {
	createDefaultBlockInstance,
	isValidBlockInstance,
	normalizeBlockInstance
} from '$lib/reusableBlocks';
import type { BlockFolder, ReusableBlock } from '$lib/types';
import { supabaseAdmin } from '$lib/server/supabase.server';

const FOLDERS_TABLE = 'block_folders' as const;
const BLOCKS_TABLE = 'reusable_blocks' as const;
const BLOCK_VERSIONS_TABLE = 'reusable_block_versions' as const;

type ReusableBlockVersionRow = {
	id: string;
	reusable_block_id: string;
	status: 'draft' | 'published' | 'archived';
	content: unknown;
	parent_id: string | null;
	revision: number;
	created_at: string;
	published_at: string | null;
};

const parseFolder = (data: Record<string, unknown>): BlockFolder => ({
	id: String(data.id),
	name: String(data.name),
	parent_id: (data.parent_id as string | null) ?? null,
	sort_order: Number(data.sort_order ?? 0),
	created_at: String(data.created_at ?? ''),
	updated_at: String(data.updated_at ?? '')
});

const parseReusableBlockContent = (blockId: string, blockType: string, rawContent: unknown) => {
	const content = isValidBlockInstance(rawContent) ? rawContent : normalizeBlockInstance(rawContent);

	if (!content || !isValidBlockInstance(content) || content.type !== blockType) {
		throw new Error(`Invalid reusable block content for block ${blockId}`);
	}

	return content;
};

const parseReusableBlock = (
	data: Record<string, unknown>,
	versionsById: Map<string, ReusableBlockVersionRow>
): ReusableBlock => {
	const id = String(data.id);
	const blockType = String(data.block_type);
	const draftVersionId = (data.draft_version_id as string | null) ?? null;
	const publishedVersionId = (data.published_version_id as string | null) ?? null;
	const draftVersion = draftVersionId ? versionsById.get(draftVersionId) ?? null : null;
	const publishedVersion = publishedVersionId ? versionsById.get(publishedVersionId) ?? null : null;
	const rawContent = draftVersion?.content ?? publishedVersion?.content ?? data.content;
	const content = parseReusableBlockContent(id, blockType, rawContent);

	return {
		id,
		name: String(data.name),
		folder_id: (data.folder_id as string | null) ?? null,
		block_type: blockType,
		content,
		draft_version_id: draftVersionId,
		published_version_id: publishedVersionId,
		has_unpublished_changes:
			draftVersionId !== null &&
			(publishedVersionId === null || draftVersionId !== publishedVersionId),
		is_published: publishedVersionId !== null,
		last_published_at: publishedVersion?.published_at ?? null,
		created_at: String(data.created_at ?? ''),
		updated_at: String(data.updated_at ?? ''),
		deleted_at: (data.deleted_at as string | null) ?? null
	};
};

const getReusableBlockRows = async ({
	includeDeleted = false,
	deletedOnly = false
}: {
	includeDeleted?: boolean;
	deletedOnly?: boolean;
} = {}) => {
	let query = supabaseAdmin.from(BLOCKS_TABLE).select('*').order('created_at');

	if (deletedOnly) {
		query = query.not('deleted_at', 'is', null);
	} else if (!includeDeleted) {
		query = query.is('deleted_at', null);
	}

	const { data, error } = await query;
	if (error) throw error;

	return (data ?? []) as Array<Record<string, unknown>>;
};

const getVersionRowsById = async (versionIds: string[]): Promise<Map<string, ReusableBlockVersionRow>> => {
	const uniqueIds = Array.from(new Set(versionIds.filter(Boolean)));
	if (uniqueIds.length === 0) return new Map();

	const { data, error } = await supabaseAdmin
		.from(BLOCK_VERSIONS_TABLE)
		.select('*')
		.in('id', uniqueIds);

	if (error) throw error;

	return new Map(((data ?? []) as ReusableBlockVersionRow[]).map((row) => [row.id, row]));
};

export const getBlockFolders = async (): Promise<BlockFolder[]> => {
	const { data, error } = await supabaseAdmin
		.from(FOLDERS_TABLE)
		.select('*')
		.order('sort_order')
		.order('name');

	if (error) throw error;
	return (data ?? []).map((item) => parseFolder(item as Record<string, unknown>));
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
	let query = supabaseAdmin.from(BLOCKS_TABLE).select('*').eq('id', id);
	if (!includeDeleted) {
		query = query.is('deleted_at', null);
	}
	const { data, error } = await query.maybeSingle();
	if (error) throw error;
	if (!data) return null;
	const versionsById = await getVersionRowsById([
		String(data.draft_version_id ?? ''),
		String(data.published_version_id ?? '')
	]);
	return parseReusableBlock(data as Record<string, unknown>, versionsById);
};

export const createBlockFolder = async (name: string, parentId: string | null): Promise<BlockFolder> => {
	const { data, error } = await supabaseAdmin
		.from(FOLDERS_TABLE)
		.insert({
			name,
			parent_id: parentId
		})
		.select('*')
		.single();

	if (error) throw error;
	return parseFolder(data as Record<string, unknown>);
};

export const updateBlockFolder = async (
	id: string,
	updates: Partial<Pick<BlockFolder, 'name' | 'parent_id' | 'sort_order'>>
): Promise<BlockFolder> => {
	const payload = Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== undefined));
	const { data, error } = await supabaseAdmin
		.from(FOLDERS_TABLE)
		.update(payload)
		.eq('id', id)
		.select('*')
		.single();

	if (error) throw error;
	return parseFolder(data as Record<string, unknown>);
};

export const deleteBlockFolder = async (id: string): Promise<void> => {
	const { data: childFolders, error: foldersError } = await supabaseAdmin
		.from(FOLDERS_TABLE)
		.select('id')
		.eq('parent_id', id);

	if (foldersError) throw foldersError;
	if ((childFolders ?? []).length > 0) {
		throw new Error('Folder must be empty before it can be deleted');
	}

	const { data: childBlocks, error: blocksError } = await supabaseAdmin
		.from(BLOCKS_TABLE)
		.select('id')
		.eq('folder_id', id);

	if (blocksError) throw blocksError;
	if ((childBlocks ?? []).length > 0) {
		throw new Error('Folder must be empty before it can be deleted');
	}

	const { error } = await supabaseAdmin.from(FOLDERS_TABLE).delete().eq('id', id);
	if (error) throw error;
};

export const createReusableBlock = async (
	name: string,
	type: string,
	folderId: string | null
): Promise<ReusableBlock> => {
	const content = createDefaultBlockInstance(type, crypto.randomUUID());
	const { data, error } = await supabaseAdmin.rpc('create_reusable_block', {
		_name: name,
		_block_type: type,
		_folder_id: folderId,
		_content: content
	});
	if (error) throw error;

	const block = await getReusableBlockById(String(data ?? ''));
	if (!block) {
		throw new Error('Reusable block was created but could not be loaded');
	}

	return block;
};

export const softDeleteReusableBlock = async (id: string): Promise<void> => {
	const { error } = await supabaseAdmin
		.from(BLOCKS_TABLE)
		.update({ deleted_at: new Date().toISOString() })
		.eq('id', id)
		.is('deleted_at', null);
	if (error) throw error;
};

export const restoreReusableBlock = async (id: string): Promise<ReusableBlock> => {
	const { error } = await supabaseAdmin
		.from(BLOCKS_TABLE)
		.update({ deleted_at: null, updated_at: new Date().toISOString() })
		.eq('id', id);
	if (error) throw error;

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
	const { content, ...recordUpdates } = updates;
	const payload = Object.fromEntries(Object.entries(recordUpdates).filter(([, value]) => value !== undefined));

	if (Object.keys(payload).length > 0) {
		const { error } = await supabaseAdmin.from(BLOCKS_TABLE).update(payload).eq('id', id);
		if (error) throw error;
	}

	if (content) {
		const { error } = await supabaseAdmin.rpc('save_reusable_block_draft', {
			_reusable_block_id: id,
			_content: content
		});
		if (error) throw error;
	}

	const block = await getReusableBlockById(id);
	if (!block) {
		throw new Error(`Reusable block ${id} not found after update`);
	}

	return block;
};

export const publishReusableBlock = async (id: string): Promise<ReusableBlock> => {
	const { error } = await supabaseAdmin.rpc('publish_reusable_block', {
		_reusable_block_id: id
	});
	if (error) throw error;

	const block = await getReusableBlockById(id);
	if (!block) {
		throw new Error(`Reusable block ${id} not found after publish`);
	}

	return block;
};
