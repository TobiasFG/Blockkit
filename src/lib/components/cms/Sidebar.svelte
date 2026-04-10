<script lang="ts">
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { resolveRoute } from "$app/paths";
    import { page } from "$app/stores";
    import { pagesStore } from "$lib/client/pagesStore";
    import { blockFoldersStore, reusableBlocksStore } from "$lib/client/reusableBlocksStore";
    import type { BlockFolder, Page, ReusableBlock } from "$lib/types";
    import ActionModal from "./ActionModal.svelte";
    import SidebarPageTreeItem from "./SidebarPageTreeItem.svelte";
    import SidebarReusableBlocksTreeItem from "./SidebarReusableBlocksTreeItem.svelte";
    import { buildSidebarTree, collectAncestorSlugs } from "./sidebarTree";
    import {
        buildReusableBlocksTree,
        collectReusableBlockFolderAncestors,
    } from "./reusableBlocksTree";

    let { pages, blockFolders, reusableBlocks, mobileOpen, onClose } = $props<{
        pages: Page[];
        blockFolders: BlockFolder[];
        reusableBlocks: ReusableBlock[];
        mobileOpen: boolean;
        onClose: () => void;
    }>();

    let closedNodes = $state<Record<string, boolean>>({});
    let contextMenu = $state<
        | {
                x: number;
                y: number;
                title: string;
                items: Array<{
                    label: string;
                    tone?: "default" | "danger";
                    action: () => void | Promise<void>;
                }>;
          }
        | null
    >(null);
    let actionNotice = $state<
        | {
                tone: "success" | "error";
                text: string;
          }
        | null
    >(null);
    let actionPending = $state(false);
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
          }
        | null
    >(null);

    const isRootPage = (slug: string) => slug === "/" || slug.trim() === "";
    const editHref = (slug: string) => {
        const cleaned = slug.replace(/^\//, "");
        const target = isRootPage(slug) ? "__root__" : cleaned;
        return resolveRoute("/edit/[...slug]", { slug: target });
    };
    const displaySlug = (slug: string) => {
        const cleaned = slug.replace(/^\//, "");
        return cleaned.length === 0 ? "/" : `/${cleaned}`;
    };

    const isActive = (href: string) => $page.url.pathname === href;
    const currentPages = $derived(browser ? ($pagesStore ?? pages) : pages);
    const currentBlockFolders = $derived(
        browser ? ($blockFoldersStore ?? blockFolders) : blockFolders,
    );
    const currentReusableBlocks = $derived(
        browser ? ($reusableBlocksStore ?? reusableBlocks) : reusableBlocks,
    );
    const activePageSlug = $derived(
        currentPages.find((entry: Page) => isActive(editHref(entry.slug)))?.slug ?? null,
    );
    const activeReusableBlockId = $derived(
        currentReusableBlocks.find((entry: ReusableBlock) =>
            isActive(`/blocks/${entry.id}`),
        )?.id ?? null,
    );
    const pageTree = $derived(buildSidebarTree(currentPages));
    const reusableBlocksTree = $derived(
        buildReusableBlocksTree(currentBlockFolders, currentReusableBlocks),
    );

    const toggleNode = (slug: string) => {
        closedNodes = {
            ...closedNodes,
            [slug]: !closedNodes[slug],
        };
    };

    const closeContextMenu = () => {
        contextMenu = null;
    };

    const closeModal = () => {
        modalState = null;
    };

    const applySidebarState = (result: {
        blockFolders?: BlockFolder[];
        reusableBlocks?: ReusableBlock[];
    }) => {
        if (result.blockFolders) {
            blockFoldersStore.set(result.blockFolders);
        }
        if (result.reusableBlocks) {
            reusableBlocksStore.set(result.reusableBlocks);
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
            closeContextMenu();
            actionNotice = {
                tone: "success",
                text:
                    payload.intent === "createBlockFolder"
                        ? "Folder created."
                        : payload.intent === "deleteBlockFolder"
                          ? "Folder deleted."
                          : payload.intent === "deleteReusableBlock"
                            ? "Reusable block deleted."
                            : "Sidebar action completed.",
            };

            if (
                payload.intent === "deleteReusableBlock" &&
                typeof payload.id === "string" &&
                $page.url.pathname === `/blocks/${payload.id}`
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
        closeContextMenu();
        modalState = {
            kind: "createFolder",
            parentId,
            parentName,
            name: "",
        };
    };

    const openDeleteFolderModal = (id: string, name: string) => {
        closeContextMenu();
        modalState = {
            kind: "deleteFolder",
            id,
            name,
        };
    };

    const openDeleteBlockModal = (id: string, name: string) => {
        closeContextMenu();
        modalState = {
            kind: "deleteBlock",
            id,
            name,
        };
    };

    const openContextMenu = (
        event: MouseEvent,
        title: string,
        items: Array<{
            label: string;
            tone?: "default" | "danger";
            action: () => void | Promise<void>;
        }>,
    ) => {
        event.preventDefault();
        actionNotice = null;

        contextMenu = {
            x: event.clientX,
            y: event.clientY,
            title,
            items,
        };
    };

    const openFolderContextMenu = (
        event: MouseEvent,
        folderId: string,
        folderName: string,
    ) => {
        openContextMenu(event, folderName, [
            {
                label: "Create subfolder",
                action: () => openCreateFolderModal(folderId, folderName),
            },
            {
                label: "Delete folder",
                tone: "danger",
                action: () => openDeleteFolderModal(folderId, folderName),
            },
        ]);
    };

    const openBlockContextMenu = (
        event: MouseEvent,
        blockId: string,
        blockName: string,
    ) => {
        openContextMenu(event, blockName, [
            {
                label: "Delete reusable block",
                tone: "danger",
                action: () => openDeleteBlockModal(blockId, blockName),
            },
        ]);
    };

    $effect(() => {
        for (const slug of collectAncestorSlugs(pageTree, activePageSlug ?? "/")) {
            if (closedNodes[slug]) {
                closedNodes = {
                    ...closedNodes,
                    [slug]: false,
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

    $effect(() => {
        if (!browser || !contextMenu) {
            return;
        }

        const handleWindowClick = () => closeContextMenu();
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeContextMenu();
            }
        };

        window.addEventListener("click", handleWindowClick);
        window.addEventListener("contextmenu", handleWindowClick);
        window.addEventListener("keydown", handleEscape);

        return () => {
            window.removeEventListener("click", handleWindowClick);
            window.removeEventListener("contextmenu", handleWindowClick);
            window.removeEventListener("keydown", handleEscape);
        };
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
                            activeSlug={activePageSlug}
                            {closedNodes}
                            onToggle={toggleNode}
                            {onClose}
                            {editHref}
                            {displaySlug}
                        />
                    {/if}
                </div>
            </div>

            <div class="space-y-2">
                <div
                    class="flex items-center justify-between px-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                    <span>Blocks</span>
                    <div class="flex items-center gap-1">
                        <a
                            href="/#create-block-folder"
                            class="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                            onclick={onClose}
                        >
                            Folder
                        </a>
                        <a
                            href="/#create-block"
                            class="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                            onclick={onClose}
                        >
                            Block
                        </a>
                    </div>
                </div>
                <div class="space-y-1">
                    {#if currentBlockFolders.length === 0 && currentReusableBlocks.length === 0}
                        <div class="px-3 py-2 text-sm text-slate-500">
                            No reusable blocks yet
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
                                onOpenFolderContextMenu={openFolderContextMenu}
                                onOpenBlockContextMenu={openBlockContextMenu}
                            />
                        {/each}
                        {#each reusableBlocksTree.blocks as block (block.id)}
                            <a
                                href={`/blocks/${block.id}`}
                                class={[
                                    "flex min-w-0 items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition",
                                    activeReusableBlockId === block.id
                                        ? "bg-slate-100 text-slate-900"
                                        : "text-slate-700 hover:bg-slate-100",
                                ].join(" ")}
                                onclick={onClose}
                                oncontextmenu={(event) =>
                                    openBlockContextMenu(event, block.id, block.name)}
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

        <div class="border-t border-slate-200 p-3 text-xs text-slate-500">
            <span class="font-medium text-slate-700">{currentPages.length}</span>
            page{currentPages.length === 1 ? "" : "s"}
            <span class="mx-1.5 text-slate-300">•</span>
            <span class="font-medium text-slate-700">{currentReusableBlocks.length}</span>
            block{currentReusableBlocks.length === 1 ? "" : "s"}
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
                ? "Delete reusable block"
                : ""
    }
    description={
        modalState?.kind === "createFolder"
            ? `Add a folder${modalState.parentId ? ` inside ${modalState.parentName}` : ""}.`
            : modalState?.kind === "deleteFolder"
              ? `Delete “${modalState.name}” only if it has no child folders and no reusable blocks.`
              : modalState?.kind === "deleteBlock"
                ? `Delete “${modalState.name}” and remove its draft page references.`
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
                Delete block
            </button>
        </div>
    {/if}
</ActionModal>

{#if contextMenu}
    <div
        class="fixed z-[70] min-w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl"
        style={`left: ${contextMenu.x}px; top: ${contextMenu.y}px;`}
        role="menu"
        tabindex="-1"
        aria-label={`${contextMenu.title} actions`}
        onmousedown={(event) => event.stopPropagation()}
        oncontextmenu={(event) => event.preventDefault()}
    >
        <div class="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {contextMenu.title}
        </div>
        {#each contextMenu.items as item}
            <button
                type="button"
                class={[
                    "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition",
                    item.tone === "danger"
                        ? "text-red-700 hover:bg-red-50"
                        : "text-slate-700 hover:bg-slate-100",
                ].join(" ")}
                disabled={actionPending}
                onclick={() => void item.action()}
            >
                {item.label}
            </button>
        {/each}
    </div>
{/if}

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
