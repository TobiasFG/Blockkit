import { listBlockDefinitions } from '$lib/blocks/registry';
import { requireAuthenticatedUser } from '$lib/server/auth';
import { getPagesReferencingReusableBlock, removeReusableBlockReferencesFromPages } from '$lib/server/PagesController.server';
import {
	createBlockFolder,
	createReusableBlock,
	deleteBlockFolder,
	deleteReusableBlock,
	getBlockFolders,
	getReusableBlocks
} from '$lib/server/ReusableBlocksController.server';
import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const reusableBlocks = await getReusableBlocks();

	return {
		blockFolders: await getBlockFolders(),
		reusableBlocks,
		blockDefinitions: listBlockDefinitions(),
		reusableBlockPageReferences: await getPagesReferencingReusableBlockMap(reusableBlocks)
	};
};

const getPagesReferencingReusableBlockMap = async (
	reusableBlocks?: Awaited<ReturnType<typeof getReusableBlocks>>
) => {
	const source = reusableBlocks ?? (await getReusableBlocks());
	const reusableBlockPageReferences = await Promise.all(
		source.map(
			async (block) => [block.id, await getPagesReferencingReusableBlock(block.id)] as const
		)
	);

	return Object.fromEntries(reusableBlockPageReferences);
};

export const actions = {
	createBlockFolder: async (event) => {
		await requireAuthenticatedUser(event.locals, {
			pathname: event.url.pathname,
			search: event.url.search
		});

		const { request } = event;
		const formData = await request.formData();
		const name = String(formData.get('name') ?? '').trim();
		const parentIdRaw = String(formData.get('parentId') ?? '').trim();

		if (!name) {
			return fail(400, { error: 'Folder name is required' });
		}

		try {
			await createBlockFolder(name, parentIdRaw || null);
			return {
				blockFolders: await getBlockFolders(),
				reusableBlocks: await getReusableBlocks(),
				reusableBlockPageReferences: await getPagesReferencingReusableBlockMap()
			};
		} catch (error) {
			console.error('Error creating block folder:', error);
			return fail(500, { error: 'Failed to create block folder' });
		}
	},

	createReusableBlock: async (event) => {
		await requireAuthenticatedUser(event.locals, {
			pathname: event.url.pathname,
			search: event.url.search
		});

		const { request } = event;
		const formData = await request.formData();
		const name = String(formData.get('name') ?? '').trim();
		const blockType = String(formData.get('blockType') ?? '').trim();
		const folderIdRaw = String(formData.get('folderId') ?? '').trim();

		if (!name || !blockType) {
			return fail(400, { error: 'Shared content name and block type are required' });
		}

		if (!listBlockDefinitions().some((definition) => definition.type === blockType)) {
			return fail(400, { error: 'Unknown block type' });
		}

		try {
			const block = await createReusableBlock(name, blockType, folderIdRaw || null);
			return {
				block,
				blockFolders: await getBlockFolders(),
				reusableBlocks: await getReusableBlocks(),
				reusableBlockPageReferences: await getPagesReferencingReusableBlockMap()
			};
		} catch (error) {
			console.error('Error creating content:', error);
			return fail(500, { error: 'Failed to create shared content' });
		}
	},

	deleteBlockFolder: async (event) => {
		await requireAuthenticatedUser(event.locals, {
			pathname: event.url.pathname,
			search: event.url.search
		});

		const { request } = event;
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '').trim();

		if (!id) {
			return fail(400, { error: 'Folder id is required' });
		}

		try {
			await deleteBlockFolder(id);
			return {
				blockFolders: await getBlockFolders(),
				reusableBlocks: await getReusableBlocks(),
				reusableBlockPageReferences: await getPagesReferencingReusableBlockMap()
			};
		} catch (error) {
			console.error('Error deleting block folder:', error);
			return fail(500, {
				error: error instanceof Error ? error.message : 'Failed to delete block folder'
			});
		}
	},

	deleteReusableBlock: async (event) => {
		await requireAuthenticatedUser(event.locals, {
			pathname: event.url.pathname,
			search: event.url.search
		});

		const { request } = event;
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '').trim();

		if (!id) {
			return fail(400, { error: 'Content id is required' });
		}

		try {
			const pagesReferencingDeletedBlock = await removeReusableBlockReferencesFromPages(id);
			await deleteReusableBlock(id);
			return {
				blockFolders: await getBlockFolders(),
				reusableBlocks: await getReusableBlocks(),
				reusableBlockPageReferences: await getPagesReferencingReusableBlockMap(),
				pagesReferencingDeletedBlock
			};
		} catch (error) {
			console.error('Error deleting content:', error);
			return fail(500, { error: 'Failed to delete content' });
		}
	}
} satisfies Actions;
