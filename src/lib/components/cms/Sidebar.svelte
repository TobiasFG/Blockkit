<script lang="ts">
    import { browser } from "$app/environment";
    import { enhance } from "$app/forms";
    import { ContextMenu, DropdownMenu } from "bits-ui";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import type { SubmitFunction } from "@sveltejs/kit";
    import type { User } from "@supabase/supabase-js";
    import { pagesStore } from "$lib/client/pagesStore";
    import { buildEditPagePath, isRootPage } from "$lib/pagePath";
    import { blockFoldersStore, reusableBlocksStore } from "$lib/client/reusableBlocksStore";
    import { Plus } from "$lib/icons";
    import type { BlockFolder, Page, ReferencingPage, ReusableBlock } from "$lib/types";
    import ActionModal from "./ActionModal.svelte";
    import CmsIconButton from "./CmsIconButton.svelte";
    import {
        requestReusableBlockInsert,
        setReusableBlockDragData,
    } from "./reusableBlockInsertion";
    import SidebarPageTreeItem from "./SidebarPageTreeItem.svelte";
    import SidebarReusableBlocksTreeItem from "./SidebarReusableBlocksTreeItem.svelte";
    import { buildSidebarTree, collectAncestorPageIds } from "./sidebarTree";
    import {
        buildReusableBlocksTree,
        collectReusableBlockFolderAncestors,
    } from "./reusableBlocksTree";

    let { pages, blockFolders, reusableBlocks, reusableBlockPageReferences, user, mobileOpen, onClose, logoutEnhanceSubmit } = $props<{
        pages: Page[];
        blockFolders: BlockFolder[];
        reusableBlocks: ReusableBlock[];
        reusableBlockPageReferences: Record<string, ReferencingPage[]>;
        user: User;
        mobileOpen: boolean;
        onClose: () => void;
        logoutEnhanceSubmit?: SubmitFunction;
    }>();

    let closedNodes = $state<Record<string, boolean>>({});
    let actionNotice = $state<
        | {
                tone: "success" | "error";
                text: string;
          }
        | null
    >(null);
    let actionPending = $state(false);
    let canDragReusableBlocks = $state(false);
    let modalState = $state<
        | {
                kind: "createFolder";
                parentId: string | null;
                parentName: string;
                name: string;
          }
        | {
                kind: "deleteFolder";
                id: string;
                name: string;
          }
        | {
                kind: "deleteBlock";
                id: string;
                name: string;
                references: ReferencingPage[];
          }
        | null
    >(null);

    const editHref = (pageId: string) => buildEditPagePath(pageId);
    const displayPath = (path: string | null | undefined) => (path && path.trim() ? path : "/");
    const displayName = $derived(
        user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Editor",
    );

    const isActive = (href: string) => $page.url.pathname === href;
    const currentPages = $derived(browser ? ($pagesStore ?? pages) : pages);
    const currentBlockFolders = $derived(
        browser ? ($blockFoldersStore ?? blockFolders) : blockFolders,
    );
    const currentReusableBlocks = $derived(
        browser ? ($reusableBlocksStore ?? reusableBlocks) : reusableBlocks,
    );
    let currentReusableBlockPageReferences = $state<Record<string, ReferencingPage[]>>({});
    const activePageId = $derived(
        currentPages.find((entry: Page) => isActive(editHref(entry.id)))?.id ?? null,
    );
    const activeReusableBlockId = $derived(
        currentReusableBlocks.find((entry: ReusableBlock) => isActive(`/content/${entry.id}`))?.id ??
            null,
    );
    const isContentLibraryActive = $derived(isActive("/content"));
    const isPageEditorRoute = $derived($page.url.pathname.startsWith("/edit/"));
    const canInsertIntoCurrentPage = $derived(isPageEditorRoute);
    const pageTree = $derived(buildSidebarTree(currentPages));
    const reusableBlocksTree = $derived(
        buildReusableBlocksTree(currentBlockFolders, currentReusableBlocks),
    );

    const toggleNode = (pageId: string) => {
        closedNodes = {
            ...closedNodes,
            [pageId]: !closedNodes[pageId],
        };
    };

    const closeModal = () => {
        modalState = null;
    };

    const applySidebarState = (result: {
        blockFolders?: BlockFolder[];
        reusableBlocks?: ReusableBlock[];
        reusableBlockPageReferences?: Record<string, ReferencingPage[]>;
    }) => {
        if (result.blockFolders) {
            blockFoldersStore.set(result.blockFolders);
        }
        if (result.reusableBlocks) {
            reusableBlocksStore.set(result.reusableBlocks);
        }
        if (result.reusableBlockPageReferences) {
            currentReusableBlockPageReferences = result.reusableBlockPageReferences;
        }
    };

    const runSidebarAction = async (payload: Record<string, unknown>) => {
        actionNotice = null;
        actionPending = true;

        try {
            const response = await fetch("/api/sidebar-actions", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = (await response.json()) as {
                error?: string;
                blockFolders?: BlockFolder[];
                reusableBlocks?: ReusableBlock[];
            };

            if (!response.ok) {
                throw new Error(result.error ?? "Sidebar action failed");
            }

            applySidebarState(result);
            actionNotice = {
                tone: "success",
                text:
                    payload.intent === "createBlockFolder"
                        ? "Folder created."
                        : payload.intent === "deleteBlockFolder"
                          ? "Folder deleted."
                          : payload.intent === "deleteReusableBlock"
                            ? "Content moved to trash."
                            : "Sidebar action completed.",
            };

            if (
                payload.intent === "deleteReusableBlock" &&
                typeof payload.id === "string" &&
                $page.url.pathname === `/content/${payload.id}`
            ) {
                await goto("/");
            }
        } catch (error) {
            actionNotice = {
                tone: "error",
                text: error instanceof Error ? error.message : "Sidebar action failed",
            };
        } finally {
            actionPending = false;
        }
    };

    const openCreateFolderModal = (parentId: string | null, parentName: string) => {
        modalState = {
            kind: "createFolder",
            parentId,
            parentName,
            name: "",
        };
    };

    const openDeleteFolderModal = (id: string, name: string) => {
        modalState = {
            kind: "deleteFolder",
            id,
            name,
        };
    };

    const openDeleteBlockModal = (id: string, name: string) => {
        modalState = {
            kind: "deleteBlock",
            id,
            name,
            references: currentReusableBlockPageReferences[id] ?? [],
        };
    };

    const insertBlockIntoCurrentPage = (blockId: string) => {
        const inserted = requestReusableBlockInsert(blockId);
        actionNotice = inserted
            ? {
                  tone: "success",
                  text: "Content added to current page draft.",
              }
            : {
                  tone: "error",
                  text: "Open page editor first to insert content.",
              };
        if (inserted) {
            onClose();
        }
    };

    onMount(() => {
        const mediaQuery = window.matchMedia("(pointer: fine) and (hover: hover) and (min-width: 1024px)");
        const updateDragMode = () => {
            canDragReusableBlocks = mediaQuery.matches;
        };

        updateDragMode();
        mediaQuery.addEventListener("change", updateDragMode);

        return () => {
            mediaQuery.removeEventListener("change", updateDragMode);
        };
    });

    $effect(() => {
        currentReusableBlockPageReferences = reusableBlockPageReferences ?? {};
    });

    $effect(() => {
        for (const pageId of collectAncestorPageIds(pageTree, activePageId ?? "")) {
            if (closedNodes[pageId]) {
                closedNodes = {
                    ...closedNodes,
                    [pageId]: false,
                };
            }
        }

        const activeBlockFolderId =
            currentReusableBlocks.find((entry: ReusableBlock) => entry.id === activeReusableBlockId)
                ?.folder_id ?? null;

        for (const folderId of collectReusableBlockFolderAncestors(
            reusableBlocksTree,
            activeBlockFolderId,
        )) {
            if (closedNodes[folderId]) {
                closedNodes = {
                    ...closedNodes,
                    [folderId]: false,
                };
            }
        }
    });

</script>

{#snippet NavContent()}
    <div class="flex h-full flex-col">
        <div
            class="flex h-14 items-center gap-2 border-b border-slate-200 px-4"
        >
            <div
                class="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-sm font-semibold text-white"
            >
                BK
            </div>
            <div class="leading-tight">
                <div class="text-sm font-semibold text-slate-900">Blockkit</div>
                <div class="text-xs text-slate-500">CMS editor</div>
            </div>
        </div>

        <nav class="flex-1 space-y-6 overflow-y-auto p-3">
            <div class="space-y-1">
                <a
                    href="/"
                    class={[
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
                        isActive("/")
                            ? "bg-slate-100 text-slate-900"
                            : "text-slate-700 hover:bg-slate-100",
                    ].join(" ")}
                    onclick={onClose}
                >
                    <svg
                        viewBox="0 0 24 24"
                        class="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path
                            d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5Z"
                        />
                    </svg>
                    Dashboard
                </a>

                <a
                    href="/#create"
                    class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    onclick={onClose}
                >
                    <svg
                        viewBox="0 0 24 24"
                        class="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    New page
                </a>

                <a
                    href="/trash"
                    class={[
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
                        isActive("/trash")
                            ? "bg-slate-100 text-slate-900"
                            : "text-slate-700 hover:bg-slate-100",
                    ].join(" ")}
                    onclick={onClose}
                >
                    <svg
                        viewBox="0 0 24 24"
                        class="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M6 6l1 14h10l1-14" />
                    </svg>
                    Trash
                </a>
            </div>

            <div class="space-y-2">
                <div
                    class="px-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                    Pages
                </div>
                <div class="space-y-1">
                    {#if currentPages.length === 0}
                        <div class="px-3 py-2 text-sm text-slate-500">
                            No pages yet
                        </div>
                    {:else}
                        <SidebarPageTreeItem
                            node={pageTree}
                            depth={0}
                            activePageId={activePageId}
                            {closedNodes}
                            onToggle={toggleNode}
                            {onClose}
                            {editHref}
                            {displayPath}
                        />
                    {/if}
                </div>
            </div>

            <div class="space-y-2">
                <div
                    class="flex items-center justify-between px-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                    <a
                        href="/content"
                        class={[
                            "transition hover:text-slate-700",
                            isContentLibraryActive ? "text-slate-900" : "text-slate-500",
                        ].join(" ")}
                        onclick={onClose}
                    >
                        Content
                    </a>
                    <div class="flex items-center gap-1">
                        <a
                            href="/content#create-block-folder"
                            class="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                            onclick={onClose}
                        >
                            Folder
                        </a>
                    </div>
                </div>
                <div class="space-y-1">
                    {#if currentBlockFolders.length === 0 && currentReusableBlocks.length === 0}
                        <div class="px-3 py-2 text-sm text-slate-500">
                            No content yet
                        </div>
                    {:else}
                        {#each reusableBlocksTree.folders as folder (folder.folder?.id)}
                            <SidebarReusableBlocksTreeItem
                                node={folder}
                                depth={0}
                                activeBlockId={activeReusableBlockId}
                                {closedNodes}
                                onToggle={toggleNode}
                                {onClose}
                                canInsertIntoPage={canInsertIntoCurrentPage}
                                canDragIntoPage={canDragReusableBlocks}
                                onCreateSubfolder={openCreateFolderModal}
                                onDeleteFolder={openDeleteFolderModal}
                                onDeleteBlock={openDeleteBlockModal}
                                onInsertBlockIntoPage={insertBlockIntoCurrentPage}
                            />
                        {/each}
                        {#each reusableBlocksTree.blocks as block (block.id)}
                            <div
                                class={[
                                    "flex min-w-0 items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition",
                                    activeReusableBlockId === block.id
                                        ? "bg-slate-100 text-slate-900"
                                        : "text-slate-700 hover:bg-slate-100",
                                ].join(" ")}
                            >
                                <ContextMenu.Root>
                                    <ContextMenu.Trigger class="flex min-w-0 flex-1">
                                        <a
                                            href={`/content/${block.id}`}
                                            class="flex min-w-0 flex-1 items-center justify-between gap-3"
                                            draggable={canInsertIntoCurrentPage && canDragReusableBlocks}
                                            onclick={onClose}
                                            ondragstart={(event) => setReusableBlockDragData(event, block.id)}
                                        >
                                            <span class="min-w-0 flex-1 truncate font-medium">{block.name}</span>
                                            <div class="flex shrink-0 items-center gap-1.5">
                                                {#if !block.is_published || block.has_unpublished_changes}
                                                    <span class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                                                        Draft
                                                    </span>
                                                {/if}
                                                <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                                    {block.block_type}
                                                </span>
                                            </div>
                                        </a>
                                    </ContextMenu.Trigger>
                                    <ContextMenu.Content class="z-50 min-w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                                        {#if canInsertIntoCurrentPage}
                                            <ContextMenu.Item
                                                class="rounded-lg px-2 py-2 text-sm text-slate-700 outline-none transition focus:bg-slate-100"
                                                onSelect={() => insertBlockIntoCurrentPage(block.id)}
                                            >
                                                Insert into page
                                            </ContextMenu.Item>
                                        {/if}
                                        <ContextMenu.Item
                                            class="rounded-lg px-2 py-2 text-sm text-red-700 outline-none transition focus:bg-red-50"
                                            onSelect={() => openDeleteBlockModal(block.id, block.name)}
                                        >
                                            Delete content
                                        </ContextMenu.Item>
                                    </ContextMenu.Content>
                                </ContextMenu.Root>
                                <DropdownMenu.Root>
                                    <DropdownMenu.Trigger class="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900">
                                        Actions
                                    </DropdownMenu.Trigger>
                                    <DropdownMenu.Content class="z-50 min-w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                                        {#if canInsertIntoCurrentPage}
                                            <DropdownMenu.Item
                                                class="rounded-lg px-2 py-2 text-sm text-slate-700 outline-none transition focus:bg-slate-100"
                                                onSelect={() => insertBlockIntoCurrentPage(block.id)}
                                            >
                                                Insert into page
                                            </DropdownMenu.Item>
                                        {/if}
                                        <DropdownMenu.Item
                                            class="rounded-lg px-2 py-2 text-sm text-red-700 outline-none transition focus:bg-red-50"
                                            onSelect={() => openDeleteBlockModal(block.id, block.name)}
                                        >
                                            Delete content
                                        </DropdownMenu.Item>
                                    </DropdownMenu.Content>
                                </DropdownMenu.Root>
                                {#if canInsertIntoCurrentPage}
                                    <CmsIconButton
                                        label={`Add ${block.name} to current page`}
                                        title="Add to current page"
                                        onclick={() => insertBlockIntoCurrentPage(block.id)}
                                    >
                                        {#snippet children()}
                                            <Plus class="h-4 w-4" />
                                        {/snippet}
                                    </CmsIconButton>
                                {/if}
                            </div>
                        {/each}
                    {/if}

                    {#if actionPending}
                        <div class="mx-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                            Applying sidebar action…
                        </div>
                    {:else if actionNotice}
                        <div
                            class={[
                                "mx-3 rounded-md px-3 py-2 text-xs",
                                actionNotice.tone === "success"
                                    ? "border border-green-200 bg-green-50 text-green-800"
                                    : "border border-red-200 bg-red-50 text-red-800",
                            ].join(" ")}
                        >
                            {actionNotice.text}
                        </div>
                    {/if}
                </div>
            </div>
        </nav>

        <div class="border-t border-slate-200 p-3">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Signed in
                </div>
                <div class="mt-2 text-sm font-semibold text-slate-900">{displayName}</div>
                <div class="truncate text-xs text-slate-500">{user.email}</div>

                <div class="mt-3 text-xs text-slate-500">
                    <span class="font-medium text-slate-700">{currentPages.length}</span>
                    page{currentPages.length === 1 ? "" : "s"}
                    <span class="mx-1.5 text-slate-300">•</span>
                    <span class="font-medium text-slate-700">{currentReusableBlocks.length}</span>
                    content item{currentReusableBlocks.length === 1 ? "" : "s"}
                </div>

                <form
                    method="POST"
                    action="/auth?/signOut"
                    class="mt-3"
                    use:enhance={logoutEnhanceSubmit}
                >
                    <button
                        type="submit"
                        class="inline-flex w-full items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                        Log out
                    </button>
                </form>
            </div>
        </div>
    </div>
{/snippet}

<ActionModal
    open={modalState !== null}
    title={
        modalState?.kind === "createFolder"
            ? "Create subfolder"
            : modalState?.kind === "deleteFolder"
              ? "Delete folder"
              : modalState?.kind === "deleteBlock"
                ? "Delete content"
                : ""
    }
    description={
        modalState?.kind === "createFolder"
            ? `Add a folder${modalState.parentId ? ` inside ${modalState.parentName}` : ""}.`
            : modalState?.kind === "deleteFolder"
                ? `Delete “${modalState.name}” only if it has no child folders and no content items.`
              : modalState?.kind === "deleteBlock"
                ? modalState.references.length > 0
                    ? `Move “${modalState.name}” to trash and remove it from published and draft pages that use it.`
                    : `Move “${modalState.name}” to trash.`
                : null
    }
    onClose={closeModal}
>
    {#if modalState?.kind === "createFolder"}
        <form
            class="space-y-4"
            onsubmit={(event) => {
                event.preventDefault();
                if (modalState?.kind !== "createFolder") {
                    return;
                }

                const trimmed = modalState.name.trim();

                if (!trimmed) {
                    return;
                }

                const parentId = modalState.parentId;
                void runSidebarAction({
                    intent: "createBlockFolder",
                    name: trimmed,
                    parentId,
                });
                closeModal();
            }}
        >
            <div class="space-y-1">
                <label for="sidebar-folder-name" class="text-sm font-medium text-slate-700">
                    Folder name
                </label>
                <input
                    id="sidebar-folder-name"
                    type="text"
                    class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                    bind:value={modalState.name}
                    required
                />
            </div>
            <div class="flex items-center justify-end gap-2">
                <button
                    type="button"
                    class="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    onclick={closeModal}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    class="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                    disabled={actionPending || modalState.name.trim().length === 0}
                >
                    Create folder
                </button>
            </div>
        </form>
    {:else if modalState?.kind === "deleteFolder"}
        <div class="flex items-center justify-end gap-2">
            <button
                type="button"
                class="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onclick={closeModal}
            >
                Cancel
            </button>
            <button
                type="button"
                class="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={actionPending}
                onclick={() => {
                    if (modalState?.kind !== "deleteFolder") {
                        return;
                    }

                    void runSidebarAction({
                        intent: "deleteBlockFolder",
                        id: modalState.id,
                    });
                    closeModal();
                }}
            >
                Delete folder
            </button>
        </div>
    {:else if modalState?.kind === "deleteBlock"}
        <div class="space-y-4">
            {#if modalState.references.length > 0}
                <ul class="max-h-56 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    {#each modalState.references as page (page.id)}
                        <li class="rounded-xl bg-white px-3 py-2 shadow-sm">{page.title} <span class="text-slate-500">({page.path})</span></li>
                    {/each}
                </ul>
            {:else}
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    No pages currently reference this content item.
                </div>
            {/if}

            <div class="flex items-center justify-end gap-2">
                <button
                    type="button"
                    class="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    onclick={closeModal}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    class="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={actionPending}
                    onclick={() => {
                        if (modalState?.kind !== "deleteBlock") {
                            return;
                        }

                        void runSidebarAction({
                            intent: "deleteReusableBlock",
                            id: modalState.id,
                        });
                        closeModal();
                    }}
                >
                    {modalState.references.length > 0 ? "Move to trash anyway" : "Move to trash"}
                </button>
            </div>
        </div>
    {/if}
</ActionModal>

<!-- Desktop -->
<aside
    class="hidden border-r border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-72 lg:flex-col"
>
    {@render NavContent()}
</aside>

<!-- Mobile drawer -->
{#if mobileOpen}
    <div
        class="fixed inset-0 z-40 bg-black/30 lg:hidden"
        aria-hidden="true"
        onclick={onClose}
    ></div>
    <div
        class="fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white shadow-lg lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Sidebar"
    >
        <div
            class="flex h-14 items-center justify-end border-b border-slate-200 px-2"
        >
            <button
                type="button"
                class="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100"
                aria-label="Close sidebar"
                onclick={onClose}
            >
                <svg
                    viewBox="0 0 24 24"
                    class="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path d="M18 6 6 18M6 6l12 12" />
                </svg>
            </button>
        </div>
        {@render NavContent()}
    </div>
{/if}
