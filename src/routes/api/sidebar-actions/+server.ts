import { json } from '@sveltejs/kit';
import { requireAuthenticatedUser } from '$lib/server/auth';
import {
	ensurePageCanBeDeleted,
	getPages,
	getReusableBlockPageReferences,
	removeReusableBlockReferencesFromPages,
	softDeletePageById
} from '$lib/server/PagesController.server';
import {
	createBlockFolder,
	deleteBlockFolder,
	softDeleteReusableBlock,
	getBlockFolders,
	getReusableBlocks
} from '$lib/server/ReusableBlocksController.server';

type SidebarActionPayload =
	| {
			intent: 'createBlockFolder';
			name: string;
			parentId?: string | null;
	  }
	| {
			intent: 'deleteBlockFolder';
			id: string;
	  }
	| {
			intent: 'deleteReusableBlock';
			id: string;
	  }
	| {
			intent: 'deletePage';
			id: string;
	  };

const getSidebarState = async () => ({
	pages: await getPages(),
	blockFolders: await getBlockFolders(),
	reusableBlocks: await getReusableBlocks(),
	reusableBlockPageReferences: await getReusableBlockPageReferences()
});

export const POST = async ({ request, locals }) => {
		await requireAuthenticatedUser(locals, { api: true });

		const payload = (await request.json()) as Partial<SidebarActionPayload>;

		if (!payload.intent) {
			return json({ error: 'Action intent is required' }, { status: 400 });
		}

		try {
			switch (payload.intent) {
				case 'createBlockFolder': {
					const name = String(payload.name ?? '').trim();
					const parentId = String(payload.parentId ?? '').trim() || null;

					if (!name) {
						return json({ error: 'Folder name is required' }, { status: 400 });
					}

					await createBlockFolder(name, parentId);
					return json(await getSidebarState());
				}

				case 'deleteBlockFolder': {
					const id = String(payload.id ?? '').trim();

					if (!id) {
						return json({ error: 'Folder id is required' }, { status: 400 });
					}

					await deleteBlockFolder(id);
					return json(await getSidebarState());
				}

				case 'deleteReusableBlock': {
					const id = String(payload.id ?? '').trim();

					if (!id) {
						return json({ error: 'Reusable block id is required' }, { status: 400 });
					}

					await removeReusableBlockReferencesFromPages(id);
					await softDeleteReusableBlock(id);
					return json(await getSidebarState());
				}

				case 'deletePage': {
					const id = String(payload.id ?? '').trim();

					if (!id) {
						return json({ error: 'Page id is required' }, { status: 400 });
					}

					await ensurePageCanBeDeleted(id);
					await softDeletePageById(id);
					return json(await getSidebarState());
				}
			}
		} catch (error) {
			console.error('Error handling sidebar action:', error);
			return json(
				{ error: error instanceof Error ? error.message : 'Failed to complete sidebar action' },
				{ status: 500 }
			);
		}

		return json({ error: 'Unsupported action intent' }, { status: 400 });
};
