import { listBlockDefinitions } from '$lib/blocks/registry';
import { parseSubmittedReusableBlockContent } from '$lib/reusableBlockEditor';
import { requireAuthenticatedUser } from '$lib/server/auth';
import {
	getBlockFolders,
	getReusableBlockById,
	publishReusableBlock,
	updateBlockFolder,
	updateReusableBlock
} from '$lib/server/ReusableBlocksController.server';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const isDescendantFolder = (folders: Awaited<ReturnType<typeof getBlockFolders>>, id: string, target: string) => {
	let current = folders.find((folder) => folder.id === target) ?? null;

	while (current) {
		if (current.parent_id === id) return true;
		current = current.parent_id ? folders.find((folder) => folder.id === current!.parent_id) ?? null : null;
	}

	return false;
};

export const load: PageServerLoad = async ({ params }) => {
	const block = await getReusableBlockById(params.id);

	if (!block) {
		throw error(404, 'Content not found');
	}

	return {
		block,
		blockFolders: await getBlockFolders(),
		blockDefinitions: listBlockDefinitions()
	};
};

export const actions = {
	updateReusableBlock: async (event) => {
		await requireAuthenticatedUser(event.locals, {
			pathname: event.url.pathname,
			search: event.url.search
		});

		const { request, params } = event;
		const formData = await request.formData();
		const current = await getReusableBlockById(params.id);

		if (!current) {
			return fail(404, { error: 'Content not found' });
		}

		const name = String(formData.get('name') ?? '').trim();
		const folderIdRaw = String(formData.get('folderId') ?? '').trim();
		const content = parseSubmittedReusableBlockContent(String(formData.get('content') ?? ''));

		if (!name || !content || content.type !== current.block_type) {
			return fail(400, { error: 'Invalid block payload' });
		}

		try {
			const block = await updateReusableBlock(current.id, {
				name,
				folder_id: folderIdRaw || null,
				content
			});

			return {
				block,
				blockFolders: await getBlockFolders()
			};
		} catch (err) {
			console.error('Error updating content:', err);
			return fail(500, { error: 'Failed to update content' });
		}
	},

	publishReusableBlock: async (event) => {
		await requireAuthenticatedUser(event.locals, {
			pathname: event.url.pathname,
			search: event.url.search
		});

		const { params } = event;
		const current = await getReusableBlockById(params.id);

		if (!current) {
			return fail(404, { error: 'Content not found' });
		}

		try {
			const block = await publishReusableBlock(current.id);
			return {
				block,
				blockFolders: await getBlockFolders()
			};
		} catch (err) {
			console.error('Error publishing content:', err);
			return fail(500, { error: 'Failed to publish content' });
		}
	},

	updateFolderFromBlockEditor: async (event) => {
		await requireAuthenticatedUser(event.locals, {
			pathname: event.url.pathname,
			search: event.url.search
		});

		const { request } = event;
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '').trim();
		const name = String(formData.get('name') ?? '').trim();
		const parentIdRaw = String(formData.get('parentId') ?? '').trim();

		if (!id || !name) {
			return fail(400, { error: 'Folder id and name are required' });
		}

		const folders = await getBlockFolders();
		if (id === parentIdRaw || (parentIdRaw && isDescendantFolder(folders, id, parentIdRaw))) {
			return fail(400, { error: 'Folder cannot be moved into itself or its descendant' });
		}

		try {
			await updateBlockFolder(id, { name, parent_id: parentIdRaw || null });
			return { blockFolders: await getBlockFolders() };
		} catch (err) {
			console.error('Error updating block folder:', err);
			return fail(500, { error: 'Failed to update block folder' });
		}
	}
} satisfies Actions;
