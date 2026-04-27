<script lang="ts">
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import type { SubmitFunction } from "@sveltejs/kit";
    import type { User } from "@supabase/supabase-js";
    import { onMount, tick } from "svelte";
    import { fade } from "svelte/transition";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import * as UiSidebar from "$lib/components/ui/sidebar/index.js";
    import { pagesStore } from "$lib/client/pagesStore";
    import {
        blockFoldersStore,
        reusableBlocksStore,
    } from "$lib/client/reusableBlocksStore";
    import { buildEditPagePath } from "$lib/pagePath";
    import type {
        BlockFolder,
        Page,
        ReferencingPage,
        ReusableBlock,
    } from "$lib/types";
    import ActionModal from "../components/cms/ActionModal.svelte";
    import SidebarCollapsedContent from "./SidebarCollapsedContent.svelte";
    import SidebarExpandedContent from "./SidebarExpandedContent.svelte";
    import { requestReusableBlockInsert } from "./ReusableBlockInsertion";
    import {
        buildReusableBlocksTree,
        collectReusableBlockFolderAncestors,
    } from "./ReusableBlocksTree";
    import { buildSidebarTree, collectAncestorPageIds } from "./SidebarTree";
    import type { SidebarDesktopFocus } from "./Types";

    let {
        pages,
        blockFolders,
        reusableBlocks,
        reusableBlockPageReferences,
        user,
        desktopCollapsed,
        desktopFocus,
        mobileOpen,
        onClose,
        onDesktopRailSelect,
        logoutEnhanceSubmit,
    } = $props<{
        pages: Page[];
        blockFolders: BlockFolder[];
        reusableBlocks: ReusableBlock[];
        reusableBlockPageReferences: Record<string, ReferencingPage[]>;
        user: User;
        desktopCollapsed: boolean;
        desktopFocus: SidebarDesktopFocus;
        mobileOpen: boolean;
        onClose: () => void;
        onDesktopRailSelect: (focus: SidebarDesktopFocus) => void;
        logoutEnhanceSubmit?: SubmitFunction;
    }>();

    let closedNodes = $state<Record<string, boolean>>({});
    let actionNotice = $state<{
        tone: "success" | "error";
        text: string;
    } | null>(null);
    let actionPending = $state(false);
    let canDragReusableBlocks = $state(false);
    let currentReusableBlockPageReferences = $state<
        Record<string, ReferencingPage[]>
    >({});
    let pagesSectionElement = $state<HTMLElement | null>(null);
    let contentSectionElement = $state<HTMLElement | null>(null);
    let lastDesktopFocusKey = $state<string | null>(null);
    let modalState = $state<
        | {
              kind: "createFolder";
              parentId: string | null;
              parentName: string;
              name: string;
          }
        | { kind: "deleteFolder"; id: string; name: string }
        | {
              kind: "deletePage";
              id: string;
              title: string;
              hasChildren: boolean;
          }
        | {
              kind: "deleteBlock";
              id: string;
              name: string;
              references: ReferencingPage[];
          }
        | null
    >(null);

    const actionSuccessMessages: Record<string, string> = {
        createBlockFolder: "Folder created.",
        deleteBlockFolder: "Folder deleted.",
        deleteReusableBlock: "Content moved to trash.",
        deletePage: "Page moved to trash.",
    };

    const editHref = (pageId: string) => buildEditPagePath(pageId);
    const isActive = (href: string) => $page.url.pathname === href;
    const currentPages = $derived(browser ? ($pagesStore ?? pages) : pages);
    const currentBlockFolders = $derived(
        browser ? ($blockFoldersStore ?? blockFolders) : blockFolders,
    );
    const currentReusableBlocks = $derived(
        browser ? ($reusableBlocksStore ?? reusableBlocks) : reusableBlocks,
    );
    const activePageId = $derived(
        currentPages.find((entry: Page) => isActive(editHref(entry.id)))?.id ??
            null,
    );
    const activeReusableBlockId = $derived(
        currentReusableBlocks.find((entry: ReusableBlock) =>
            isActive(`/content/${entry.id}`),
        )?.id ?? null,
    );
    const isContentRoute = $derived($page.url.pathname.startsWith("/content"));
    const isPageEditorRoute = $derived($page.url.pathname.startsWith("/edit/"));
    const canInsertIntoCurrentPage = $derived(isPageEditorRoute);
    const pageTree = $derived(buildSidebarTree(currentPages));
    const reusableBlocksTree = $derived(
        buildReusableBlocksTree(currentBlockFolders, currentReusableBlocks),
    );
    const hasContent = $derived(
        currentBlockFolders.length > 0 || currentReusableBlocks.length > 0,
    );
    const toggleNode = (id: string) => {
        closedNodes = { ...closedNodes, [id]: !closedNodes[id] };
    };

    const closeModal = () => {
        modalState = null;
    };

    const applySidebarState = (result: {
        pages?: Page[];
        blockFolders?: BlockFolder[];
        reusableBlocks?: ReusableBlock[];
        reusableBlockPageReferences?: Record<string, ReferencingPage[]>;
    }) => {
        if (result.pages) pagesStore.set(result.pages);
        if (result.blockFolders) blockFoldersStore.set(result.blockFolders);
        if (result.reusableBlocks)
            reusableBlocksStore.set(result.reusableBlocks);
        if (result.reusableBlockPageReferences) {
            currentReusableBlockPageReferences =
                result.reusableBlockPageReferences;
        }
    };

    const runSidebarAction = async (payload: Record<string, unknown>) => {
        actionNotice = null;
        actionPending = true;

        try {
            const response = await fetch("/api/sidebar-actions", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = (await response.json()) as {
                error?: string;
                pages?: Page[];
                blockFolders?: BlockFolder[];
                reusableBlocks?: ReusableBlock[];
                reusableBlockPageReferences?: Record<string, ReferencingPage[]>;
            };

            if (!response.ok)
                throw new Error(result.error ?? "Sidebar action failed");

            applySidebarState(result);
            actionNotice = {
                tone: "success",
                text:
                    typeof payload.intent === "string"
                        ? (actionSuccessMessages[payload.intent] ??
                          "Sidebar action completed.")
                        : "Sidebar action completed.",
            };

            if (
                payload.intent === "deleteReusableBlock" &&
                typeof payload.id === "string" &&
                $page.url.pathname === `/content/${payload.id}`
            ) {
                await goto("/");
            }

            if (
                payload.intent === "deletePage" &&
                typeof payload.id === "string" &&
                $page.url.pathname === `/edit/page/${payload.id}`
            ) {
                await goto("/trash");
            }
        } catch (error) {
            actionNotice = {
                tone: "error",
                text:
                    error instanceof Error
                        ? error.message
                        : "Sidebar action failed",
            };
        } finally {
            actionPending = false;
        }
    };

    const openCreateFolderModal = (
        parentId: string | null,
        parentName: string,
    ) => {
        modalState = { kind: "createFolder", parentId, parentName, name: "" };
    };

    const openDeleteFolderModal = (id: string, name: string) => {
        modalState = { kind: "deleteFolder", id, name };
    };

    const openDeletePageModal = (
        id: string,
        title: string,
        hasChildren: boolean,
    ) => {
        modalState = { kind: "deletePage", id, title, hasChildren };
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
            ? { tone: "success", text: "Content added to current page draft." }
            : {
                  tone: "error",
                  text: "Open page editor first to insert content.",
              };
        if (inserted) onClose();
    };

    const uiSidebar = UiSidebar.useSidebar();

    const closeSidebar = () => {
        onClose();
        uiSidebar.setOpenMobile(false);
    };

    const expandedContentProps = $derived({
        user,
        pageTree,
        reusableBlocksTree,
        currentPages,
        currentBlockFolders,
        currentReusableBlocks,
        activePageId,
        activeReusableBlockId,
        closedNodes,
        canInsertIntoCurrentPage,
        canDragReusableBlocks,
        actionPending,
        actionNotice,
        logoutEnhanceSubmit,
        onClose: closeSidebar,
        onToggle: toggleNode,
        onCreateFolder: openCreateFolderModal,
        onDeletePage: openDeletePageModal,
        onDeleteFolder: openDeleteFolderModal,
        onDeleteBlock: openDeleteBlockModal,
        onInsertBlock: insertBlockIntoCurrentPage,
    });

    const railItemIsActive = (focus: SidebarDesktopFocus) => {
        if (focus.kind === "dashboard") return isActive("/");
        if (focus.kind === "pages") return isPageEditorRoute;
        if (focus.kind === "content") return isContentRoute;
        if (focus.kind === "content-folder") {
            return (
                desktopFocus.kind === "content-folder" &&
                desktopFocus.id === focus.id
            );
        }
        if (focus.kind === "content-block") {
            return (
                activeReusableBlockId === focus.id ||
                (desktopFocus.kind === "content-block" &&
                    desktopFocus.id === focus.id)
            );
        }
        return isActive("/trash");
    };

    onMount(() => {
        const mediaQuery = window.matchMedia(
            "(pointer: fine) and (hover: hover) and (min-width: 1024px)",
        );
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
        for (const pageId of collectAncestorPageIds(
            pageTree,
            activePageId ?? "",
        )) {
            if (closedNodes[pageId])
                closedNodes = { ...closedNodes, [pageId]: false };
        }
    });

    $effect(() => {
        const activeBlockFolderId =
            currentReusableBlocks.find(
                (entry: ReusableBlock) => entry.id === activeReusableBlockId,
            )?.folder_id ?? null;

        for (const folderId of collectReusableBlockFolderAncestors(
            reusableBlocksTree,
            activeBlockFolderId,
        )) {
            if (closedNodes[folderId])
                closedNodes = { ...closedNodes, [folderId]: false };
        }
    });

    $effect(() => {
        if (desktopCollapsed) {
            lastDesktopFocusKey = null;
            return;
        }

        const focusKey =
            desktopFocus.kind === "content-folder" ||
            desktopFocus.kind === "content-block"
                ? `${desktopFocus.kind}:${desktopFocus.id}`
                : desktopFocus.kind;

        if (focusKey === lastDesktopFocusKey) return;
        lastDesktopFocusKey = focusKey;

        if (
            desktopFocus.kind === "content-folder" &&
            closedNodes[desktopFocus.id]
        ) {
            closedNodes = { ...closedNodes, [desktopFocus.id]: false };
        }

        void tick().then(() => {
            if (desktopFocus.kind === "pages") {
                pagesSectionElement?.scrollIntoView({
                    block: "start",
                    behavior: "smooth",
                });
                return;
            }

            if (
                desktopFocus.kind === "content" ||
                desktopFocus.kind === "content-folder" ||
                desktopFocus.kind === "content-block"
            ) {
                contentSectionElement?.scrollIntoView({
                    block: "start",
                    behavior: "smooth",
                });
            }
        });
    });
</script>

<ActionModal
    open={modalState !== null}
    title={modalState?.kind === "createFolder"
        ? "Create subfolder"
        : modalState?.kind === "deleteFolder"
          ? "Delete folder"
          : modalState?.kind === "deletePage"
            ? "Move page to trash"
          : modalState?.kind === "deleteBlock"
            ? "Delete content"
            : ""}
    description={modalState?.kind === "createFolder"
        ? `Add a folder${modalState.parentId ? ` inside ${modalState.parentName}` : ""}.`
        : modalState?.kind === "deleteFolder"
          ? `Delete "${modalState.name}" only if it has no child folders and no content items.`
          : modalState?.kind === "deletePage"
            ? modalState.hasChildren
                ? `"${modalState.title}" has child pages. Move or delete child pages before moving this page to trash.`
                : `Move "${modalState.title}" to trash. It will disappear from normal page lists until restored.`
          : modalState?.kind === "deleteBlock"
            ? modalState.references.length > 0
                ? `Move "${modalState.name}" to trash and remove it from published and draft pages that use it.`
                : `Move "${modalState.name}" to trash.`
            : null}
    onClose={closeModal}
>
    {#if modalState?.kind === "createFolder"}
        <form
            class="space-y-4"
            onsubmit={(event) => {
                event.preventDefault();
                if (modalState?.kind !== "createFolder") return;
                const trimmed = modalState.name.trim();
                if (!trimmed) return;
                void runSidebarAction({
                    intent: "createBlockFolder",
                    name: trimmed,
                    parentId: modalState.parentId,
                });
                closeModal();
            }}
        >
            <div class="space-y-1">
                <label
                    for="sidebar-folder-name"
                    class="text-sm font-medium text-foreground"
                    >Folder name</label
                >
                <Input
                    id="sidebar-folder-name"
                    type="text"
                    class="w-full"
                    bind:value={modalState.name}
                    required
                />
            </div>
            <div class="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onclick={closeModal}
                    >Cancel</Button
                >
                <Button
                    type="submit"
                    disabled={actionPending ||
                        modalState.name.trim().length === 0}
                >
                    Create folder
                </Button>
            </div>
        </form>
    {:else if modalState?.kind === "deleteFolder"}
        <div class="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onclick={closeModal}
                >Cancel</Button
            >
            <Button
                type="button"
                variant="destructive"
                disabled={actionPending}
                onclick={() => {
                    if (modalState?.kind !== "deleteFolder") return;
                    void runSidebarAction({
                        intent: "deleteBlockFolder",
                        id: modalState.id,
                    });
                    closeModal();
                }}
            >
                Delete folder
            </Button>
        </div>
    {:else if modalState?.kind === "deletePage"}
        <div class="space-y-4">
            {#if modalState.hasChildren}
                <div
                    class="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
                >
                    Pages with child pages cannot be moved to trash.
                </div>
            {/if}

            <div class="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onclick={closeModal}
                    >Cancel</Button
                >
                <Button
                    type="button"
                    variant="destructive"
                    disabled={actionPending || modalState.hasChildren}
                    onclick={() => {
                        if (modalState?.kind !== "deletePage") return;
                        void runSidebarAction({
                            intent: "deletePage",
                            id: modalState.id,
                        });
                        closeModal();
                    }}
                >
                    Move to trash
                </Button>
            </div>
        </div>
    {:else if modalState?.kind === "deleteBlock"}
        <div class="space-y-4">
            {#if modalState.references.length > 0}
                <ul
                    class="max-h-56 space-y-2 overflow-y-auto rounded-2xl border border-border bg-muted/40 p-3 text-sm text-foreground"
                >
                    {#each modalState.references as pageItem (pageItem.id)}
                        <li class="rounded-xl bg-card px-3 py-2 shadow-sm">
                            {pageItem.title}
                            <span class="text-muted-foreground"
                                >({pageItem.path})</span
                            >
                        </li>
                    {/each}
                </ul>
            {:else}
                <div
                    class="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
                >
                    No pages currently reference this content item.
                </div>
            {/if}

            <div class="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onclick={closeModal}
                    >Cancel</Button
                >
                <Button
                    type="button"
                    variant="destructive"
                    disabled={actionPending}
                    onclick={() => {
                        if (modalState?.kind !== "deleteBlock") return;
                        void runSidebarAction({
                            intent: "deleteReusableBlock",
                            id: modalState.id,
                        });
                        closeModal();
                    }}
                >
                    {modalState.references.length > 0
                        ? "Move to trash anyway"
                        : "Move to trash"}
                </Button>
            </div>
        </div>
    {/if}
</ActionModal>

<UiSidebar.Root variant="inset" collapsible="icon">
    {#key desktopCollapsed}
        <div
            class="flex min-h-0 flex-1 flex-col overflow-hidden"
            in:fade={{ duration: 150 }}
            out:fade={{ duration: 110 }}
        >
            {#if desktopCollapsed}
                <SidebarCollapsedContent
                    {user}
                    {hasContent}
                    {logoutEnhanceSubmit}
                    {railItemIsActive}
                    {onDesktopRailSelect}
                />
            {:else}
                <SidebarExpandedContent
                    {...expandedContentProps}
                    bindPagesSectionElement={(element) =>
                        (pagesSectionElement = element)}
                    bindContentSectionElement={(element) =>
                        (contentSectionElement = element)}
                />
            {/if}
        </div>
    {/key}
</UiSidebar.Root>
