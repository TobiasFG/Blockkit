import { listBlockDefinitions } from '$lib/blocks/registry';
import { validatePageSlug } from '$lib/pageSlug';
import { createPage, getPages, pageExists, deletePage } from "$lib/server/PagesController.server";
import {
    getReusableBlockPageReferences,
    removeReusableBlockReferencesFromPages
} from '$lib/server/PagesController.server';
import {
    createBlockFolder,
    createReusableBlock,
    deleteBlockFolder,
    deleteReusableBlock,
    getBlockFolders,
    getReusableBlocks,
    updateBlockFolder,
} from '$lib/server/ReusableBlocksController.server';
import { fail, type Actions } from "@sveltejs/kit";

export const actions = {
    createPage: async (event) => {
        const formData = await event.request.formData();
        const slugResult = validatePageSlug(String(formData.get("slug") ?? ""));

        if (slugResult.error) {
            return fail(400, { error: slugResult.error });
        }

        const slug = slugResult.slug;
        const pageAlreadyExists = await pageExists(slug);

        if (pageAlreadyExists) {
            return fail(409, {
                error: "Page with this slug already exists",
            });
        }

        try {
            await createPage(
                formData.get("title") as string,
                slug
            );

            return {
                pages: await getPages(),
            };
        } catch (error) {
            console.error("Error creating page:", error);
            return fail(500, { error: "Failed to create page" });
        }
    },

    deletePage: async (event) => {
        const formData = await event.request.formData();
        const slug = formData.get("slug") as string;

        if (!slug) {
            return fail(400, {
                error: "Slug is required to delete a page"
            });
        }

        try {
            await deletePage(slug);
            return {
                success: true,
                pages: await getPages(),
            };
        } catch (error) {
            console.error("Error deleting page:", error);
            return fail(500, {
                error: "Failed to delete page"
            });
        }
    },

    createBlockFolder: async (event) => {
        const formData = await event.request.formData();
        const name = String(formData.get('name') ?? '').trim();
        const parentIdRaw = String(formData.get('parentId') ?? '').trim();

        if (!name) {
            return fail(400, { error: 'Folder name is required' });
        }

        try {
            await createBlockFolder(name, parentIdRaw || null);
            return {
                blockFolders: await getBlockFolders(),
                reusableBlocks: await getReusableBlocks()
            };
        } catch (error) {
            console.error('Error creating block folder:', error);
            return fail(500, { error: 'Failed to create block folder' });
        }
    },

    updateBlockFolder: async (event) => {
        const formData = await event.request.formData();
        const id = String(formData.get('id') ?? '').trim();
        const name = String(formData.get('name') ?? '').trim();
        const parentIdRaw = String(formData.get('parentId') ?? '').trim();

        if (!id || !name) {
            return fail(400, { error: 'Folder id and name are required' });
        }

        if (id === parentIdRaw) {
            return fail(400, { error: 'Folder cannot be its own parent' });
        }

        try {
            await updateBlockFolder(id, { name, parent_id: parentIdRaw || null });
            return {
                blockFolders: await getBlockFolders(),
                reusableBlocks: await getReusableBlocks()
            };
        } catch (error) {
            console.error('Error updating block folder:', error);
            return fail(500, { error: 'Failed to update block folder' });
        }
    },

    deleteBlockFolder: async (event) => {
        const formData = await event.request.formData();
        const id = String(formData.get('id') ?? '').trim();

        if (!id) {
            return fail(400, { error: 'Folder id is required' });
        }

        try {
            await deleteBlockFolder(id);
            return {
                blockFolders: await getBlockFolders(),
                reusableBlocks: await getReusableBlocks()
            };
        } catch (error) {
            console.error('Error deleting block folder:', error);
            return fail(500, { error: error instanceof Error ? error.message : 'Failed to delete block folder' });
        }
    },

    createReusableBlock: async (event) => {
        const formData = await event.request.formData();
        const name = String(formData.get('name') ?? '').trim();
        const blockType = String(formData.get('blockType') ?? '').trim();
        const folderIdRaw = String(formData.get('folderId') ?? '').trim();

        if (!name || !blockType) {
            return fail(400, { error: 'Block name and block type are required' });
        }

        if (!listBlockDefinitions().some((definition) => definition.type === blockType)) {
            return fail(400, { error: 'Unknown block type' });
        }

        try {
            const block = await createReusableBlock(name, blockType, folderIdRaw || null);
            return {
                block,
                blockFolders: await getBlockFolders(),
                reusableBlocks: await getReusableBlocks()
            };
        } catch (error) {
            console.error('Error creating reusable block:', error);
            return fail(500, { error: 'Failed to create reusable block' });
        }
    },

    deleteReusableBlock: async (event) => {
        const formData = await event.request.formData();
        const id = String(formData.get('id') ?? '').trim();

        if (!id) {
            return fail(400, { error: 'Reusable block id is required' });
        }

        try {
            const pagesReferencingDeletedBlock = await removeReusableBlockReferencesFromPages(id);
            await deleteReusableBlock(id);
            return {
                blockFolders: await getBlockFolders(),
                reusableBlocks: await getReusableBlocks(),
                pagesReferencingDeletedBlock,
                reusableBlockPageReferences: await getReusableBlockPageReferences()
            };
        } catch (error) {
            console.error('Error deleting reusable block:', error);
            return fail(500, { error: 'Failed to delete reusable block' });
        }
    }
} satisfies Actions;
