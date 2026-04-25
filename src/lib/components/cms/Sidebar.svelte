<script lang="ts">
    import { browser } from "$app/environment";
    import { enhance } from "$app/forms";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import type { SubmitFunction } from "@sveltejs/kit";
    import type { User } from "@supabase/supabase-js";
    import { ContextMenu } from "bits-ui";
    import { onMount, tick } from "svelte";
    import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import { pagesStore } from "$lib/client/pagesStore";
    import {
        blockFoldersStore,
        reusableBlocksStore,
    } from "$lib/client/reusableBlocksStore";
    import ThemeToggle from "$lib/components/ThemeToggle.svelte";
    import {
        Bell,
        ChevronDown,
        EllipsisVertical,
        FileText,
        Folder,
        Home,
        LogOut,
        Plus,
        Search,
        Trash2,
    } from "$lib/icons";
    import { buildEditPagePath } from "$lib/pagePath";
    import { getReusableBlockPublishState } from "$lib/reusableBlockStatus";
    import type {
        BlockFolder,
        Page,
        ReferencingPage,
        ReusableBlock,
    } from "$lib/types";
    import ActionModal from "./ActionModal.svelte";
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

    type SidebarDesktopFocus =
        | { kind: "dashboard" }
        | { kind: "pages" }
        | { kind: "content" }
        | { kind: "content-folder"; id: string }
        | { kind: "content-block"; id: string }
        | { kind: "trash" };

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
    const displayPath = (path: string | null | undefined) =>
        path && path.trim() ? path : "/";
    const displayName = $derived(
        user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Editor",
    );
    const initials = $derived(displayName.slice(0, 2).toUpperCase());

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
    const isContentLibraryActive = $derived(isActive("/content"));
    const isContentRoute = $derived($page.url.pathname.startsWith("/content"));
    const isPageEditorRoute = $derived($page.url.pathname.startsWith("/edit/"));
    const canInsertIntoCurrentPage = $derived(isPageEditorRoute);
    const pageTree = $derived(buildSidebarTree(currentPages));
    const reusableBlocksTree = $derived(
        buildReusableBlocksTree(currentBlockFolders, currentReusableBlocks),
    );

    const getReusableBlockStateMeta = (
        state: "unpublished" | "published" | "draft-changes",
    ) => {
        switch (state) {
            case "draft-changes":
                return { dotClass: "bg-amber-500" };
            case "published":
                return { dotClass: "bg-emerald-500" };
            default:
                return { dotClass: "bg-slate-400" };
        }
    };
    const collapsedRailItems = $derived.by(() => [
        {
            key: "dashboard",
            label: "Dashboard",
            icon: Home,
            dotClass: null,
            focus: { kind: "dashboard" as const },
        },
        {
            key: "pages",
            label: "Pages",
            icon: FileText,
            dotClass: "bg-blue-500",
            focus: { kind: "pages" as const },
        },
        {
            key: "content-root",
            label: "Content",
            icon: Folder,
            dotClass:
                currentBlockFolders.length > 0 ||
                currentReusableBlocks.length > 0
                    ? "bg-emerald-500"
                    : null,
            focus: { kind: "content" as const },
        },
        {
            key: "trash",
            label: "Trash",
            icon: Trash2,
            dotClass: null,
            focus: { kind: "trash" as const },
        },
    ]);

    const toggleNode = (id: string) => {
        closedNodes = {
            ...closedNodes,
            [id]: !closedNodes[id],
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
                blockFolders?: BlockFolder[];
                reusableBlocks?: ReusableBlock[];
                reusableBlockPageReferences?: Record<string, ReferencingPage[]>;
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

    const handleDesktopRailClick = (focus: SidebarDesktopFocus) => {
        if (focus.kind === "dashboard") {
            void goto("/");
            return;
        }

        if (focus.kind === "trash") {
            void goto("/trash");
            return;
        }

        onDesktopRailSelect(focus);
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
            if (closedNodes[pageId]) {
                closedNodes = { ...closedNodes, [pageId]: false };
            }
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
            if (closedNodes[folderId]) {
                closedNodes = { ...closedNodes, [folderId]: false };
            }
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

{#snippet NavContent(isMobile = false)}
    <div class="flex h-full flex-col bg-background">
        <div
            class={[
                "sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur",
                desktopCollapsed && !isMobile ? "px-4 py-4" : "px-5 py-4",
            ].join(" ")}
        >
            <div
                class={desktopCollapsed && !isMobile
                    ? "flex justify-center"
                    : "flex items-start gap-3"}
            >
                <div
                    class="grid h-12 w-12 place-items-center rounded-lg bg-[#173a63] text-xl font-semibold text-white shadow-sm"
                >
                    S
                </div>
                {#if !desktopCollapsed || isMobile}
                    <div class="min-w-0 flex-1 pt-0.5">
                        <div class="text-[15px] font-semibold text-foreground">
                            SvelteKit CMS
                        </div>
                        <button
                            type="button"
                            class="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
                        >
                            <span>Acme Marketing</span>
                            <ChevronDown class="h-4 w-4" />
                        </button>
                    </div>
                {/if}
                {#if !desktopCollapsed || isMobile}
                    <div class="ml-auto flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Search"
                        >
                            <Search class="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Notifications"
                        >
                            <Bell class="h-4 w-4" />
                        </Button>
                        <ThemeToggle />
                    </div>
                {/if}
            </div>
        </div>

        <div class={desktopCollapsed && !isMobile ? "min-h-0 flex-1 overflow-y-auto px-4 py-5" : "min-h-0 flex-1 overflow-y-auto px-5 py-5"}>
            {#if desktopCollapsed && !isMobile}
                <div class="space-y-4">
                    {#each collapsedRailItems as item (item.key)}
                        <button
                            type="button"
                            class={[
                                "relative flex h-11 w-full items-center justify-center rounded-md text-muted-foreground transition",
                                railItemIsActive(item.focus)
                                    ? "bg-muted text-foreground"
                                    : "hover:bg-muted/70 hover:text-foreground",
                            ].join(" ")}
                            title={item.label}
                            aria-label={item.label}
                            onclick={() => handleDesktopRailClick(item.focus)}
                        >
                            <item.icon class="h-5 w-5" />
                            {#if item.dotClass}
                                <span
                                    class={`absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${item.dotClass}`}
                                ></span>
                            {/if}
                        </button>
                    {/each}
                </div>
            {:else}
                <a
                    href="/"
                    class={[
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
                        isActive("/")
                            ? "bg-muted text-foreground"
                            : "text-slate-700 hover:bg-muted hover:text-foreground dark:text-muted-foreground",
                    ].join(" ")}
                    onclick={onClose}
                >
                    <Home class="h-4 w-4" />
                    <span>Dashboard</span>
                </a>
                <section class="mt-7 space-y-2" bind:this={pagesSectionElement}>
                    <div
                        class="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                        <div class="flex w-full items-center justify-between">
                            <span>Pages</span>
                            <div class="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    class="h-9 gap-2 rounded-md px-3 text-sm normal-case tracking-normal"
                                    href="/#create"
                                    onclick={onClose}
                                >
                                    <Plus class="h-4 w-4" />
                                    New Page
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    class="h-9 w-9 rounded-md text-muted-foreground"
                                    aria-label="Page actions"
                                >
                                    <EllipsisVertical class="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div class="space-y-1">
                        {#if currentPages.length === 0}
                            <div
                                class="px-3 py-2 text-sm text-muted-foreground"
                            >
                                No pages yet
                            </div>
                        {:else}
                            {#each pageTree as root (root.page.id)}
                                <SidebarPageTreeItem
                                    node={root}
                                    depth={0}
                                    {activePageId}
                                    {closedNodes}
                                    collapsed={false}
                                    onToggle={toggleNode}
                                    {onClose}
                                    {editHref}
                                    {displayPath}
                                />
                            {/each}
                        {/if}
                    </div>
                </section>

                <section
                    class="mt-7 space-y-2 border-t border-border pt-5"
                    bind:this={contentSectionElement}
                >
                    <div
                        class="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                        <div class="flex w-full items-center justify-between">
                            <a
                                href="/content"
                                class={[
                                    "transition",
                                    isContentLibraryActive
                                        ? "text-foreground"
                                        : "hover:text-foreground",
                                ].join(" ")}
                                onclick={onClose}
                            >
                                Content
                            </a>
                            <div class="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    class="h-9 gap-2 rounded-md px-3 text-sm normal-case tracking-normal"
                                    href="/content"
                                    onclick={onClose}
                                >
                                    <Plus class="h-4 w-4" />
                                    Insert
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    class="h-9 w-9 rounded-md text-muted-foreground"
                                    aria-label="Content actions"
                                >
                                    <EllipsisVertical class="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div class="space-y-1">
                        {#if currentBlockFolders.length === 0 && currentReusableBlocks.length === 0}
                            <div
                                class="px-3 py-2 text-sm text-muted-foreground"
                            >
                                No content yet
                            </div>
                        {:else}
                            {#each reusableBlocksTree.folders as folder (folder.folder?.id)}
                                <SidebarReusableBlocksTreeItem
                                    node={folder}
                                    depth={0}
                                    activeBlockId={activeReusableBlockId}
                                    {closedNodes}
                                    collapsed={false}
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
                                {@const stateMeta = getReusableBlockStateMeta(
                                    getReusableBlockPublishState(block),
                                )}
                                <div
                                    class={[
                                        "flex min-w-0 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition",
                                        activeReusableBlockId === block.id
                                            ? "bg-[#e8eef9] text-[#1655e2]"
                                            : "text-foreground/88 hover:bg-muted/30 hover:text-foreground",
                                    ].join(" ")}
                                >
                                    <ContextMenu.Root>
                                        <ContextMenu.Trigger
                                            class="flex min-w-0 flex-1"
                                        >
                                            <a
                                                href={`/content/${block.id}`}
                                                class="flex min-w-0 flex-1 items-center justify-between gap-3"
                                                draggable={canInsertIntoCurrentPage &&
                                                    canDragReusableBlocks}
                                                onclick={onClose}
                                                ondragstart={(event) =>
                                                    setReusableBlockDragData(
                                                        event,
                                                        block.id,
                                                    )}
                                            >
                                                <div
                                                    class="flex min-w-0 flex-1 items-center gap-3"
                                                >
                                                    <span
                                                        class="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border/80 bg-background text-muted-foreground"
                                                    >
                                                        <FileText
                                                            class="h-4 w-4"
                                                        />
                                                    </span>
                                                    <span
                                                        class="min-w-0 flex-1 truncate text-sm font-medium"
                                                        >{block.name}</span
                                                    >
                                                </div>
                                                <div
                                                    class="flex shrink-0 items-center gap-2"
                                                >
                                                    <span
                                                        class="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                                                    >
                                                        {block.block_type}
                                                    </span>
                                                    <span
                                                        class={`h-2.5 w-2.5 rounded-full ${stateMeta.dotClass}`}
                                                    ></span>
                                                </div>
                                            </a>
                                        </ContextMenu.Trigger>
                                        <ContextMenu.Content
                                            class="z-50 min-w-44 rounded-xl border border-border bg-popover p-1.5 shadow-lg"
                                        >
                                            {#if canInsertIntoCurrentPage}
                                                <ContextMenu.Item
                                                    class="rounded-lg px-2 py-2 text-sm text-slate-700 outline-none transition focus:bg-slate-100"
                                                    onSelect={() =>
                                                        insertBlockIntoCurrentPage(
                                                            block.id,
                                                        )}
                                                >
                                                    Insert into page
                                                </ContextMenu.Item>
                                            {/if}
                                            <ContextMenu.Item
                                                class="rounded-lg px-2 py-2 text-sm text-red-700 outline-none transition focus:bg-red-50"
                                                onSelect={() =>
                                                    openDeleteBlockModal(
                                                        block.id,
                                                        block.name,
                                                    )}
                                            >
                                                Delete content
                                            </ContextMenu.Item>
                                        </ContextMenu.Content>
                                    </ContextMenu.Root>

                                    <DropdownMenu.Root>
                                        <DropdownMenu.Trigger
                                            class={`${buttonVariants({ variant: "ghost", size: "icon-sm" })} h-8 w-8 shrink-0 rounded-md text-muted-foreground`}
                                        >
                                            <EllipsisVertical class="h-4 w-4" />
                                        </DropdownMenu.Trigger>
                                        <DropdownMenu.Content
                                            class="min-w-44 rounded-xl p-1.5"
                                        >
                                            {#if canInsertIntoCurrentPage}
                                                <DropdownMenu.Item
                                                    class="rounded-lg px-2 py-2 text-sm"
                                                    onSelect={() =>
                                                        insertBlockIntoCurrentPage(
                                                            block.id,
                                                        )}
                                                >
                                                    Insert into page
                                                </DropdownMenu.Item>
                                            {/if}
                                            <DropdownMenu.Item
                                                variant="destructive"
                                                class="rounded-lg px-2 py-2 text-sm"
                                                onSelect={() =>
                                                    openDeleteBlockModal(
                                                        block.id,
                                                        block.name,
                                                    )}
                                            >
                                                Delete content
                                            </DropdownMenu.Item>
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Root>
                                </div>
                            {/each}
                        {/if}

                        {#if actionPending}
                            <div
                                class="mx-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
                            >
                                Applying sidebar action…
                            </div>
                        {:else if actionNotice}
                            <div
                                class={[
                                    "mx-3 rounded-md px-3 py-2 text-xs",
                                    actionNotice.tone === "success"
                                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                        : "border border-destructive/30 bg-destructive/10 text-destructive",
                                ].join(" ")}
                            >
                                {actionNotice.text}
                            </div>
                        {/if}
                    </div>
                </section>
            {/if}
        </div>

        <div
            class="sticky bottom-0 border-t border-border bg-background/95 p-4 backdrop-blur"
        >
            <div class={desktopCollapsed && !isMobile ? "space-y-4" : "rounded-lg border border-border bg-muted/30 p-3"}>
                {#if desktopCollapsed && !isMobile}
                    <div class="flex flex-col items-center gap-4">
                        <div class="flex w-full flex-col items-center gap-3 border-b border-border pb-4">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                class="h-10 w-10 rounded-md"
                                aria-label="New page"
                                title="New page"
                                onclick={() => void goto("/#create")}
                            >
                                <Plus class="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                class="h-10 w-10 rounded-md"
                                aria-label="Open content section"
                                title="Open content section"
                                onclick={() =>
                                    onDesktopRailSelect({ kind: "content" })}
                            >
                                <EllipsisVertical class="h-4 w-4" />
                            </Button>
                        </div>
                        <div
                            class="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-xs font-semibold text-white"
                        >
                            {initials}
                        </div>
                        <form
                            method="POST"
                            action="/auth?/signOut"
                            use:enhance={logoutEnhanceSubmit}
                        >
                            <Button
                                type="submit"
                                variant="outline"
                                size="icon-sm"
                                class="h-10 w-10 rounded-md"
                            >
                                <LogOut class="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                {:else}
                    <div class="flex items-center gap-3">
                        <div
                            class="grid h-11 w-11 place-items-center rounded-full bg-blue-600 text-sm font-semibold text-white"
                        >
                            {initials}
                        </div>
                        <div class="min-w-0 flex-1">
                            <div
                                class="truncate text-sm font-semibold text-foreground"
                            >
                                {displayName}
                            </div>
                            <div class="truncate text-xs text-muted-foreground">
                                {user.email}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Account menu"
                        >
                            <ChevronDown class="h-4 w-4" />
                        </Button>
                    </div>

                    <div class="mt-3 flex items-center justify-end">
                        <form
                            method="POST"
                            action="/auth?/signOut"
                            use:enhance={logoutEnhanceSubmit}
                        >
                            <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                                class="gap-2"
                            >
                                <LogOut class="h-4 w-4" />
                                Logout
                            </Button>
                        </form>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/snippet}

<ActionModal
    open={modalState !== null}
    title={modalState?.kind === "createFolder"
        ? "Create subfolder"
        : modalState?.kind === "deleteFolder"
          ? "Delete folder"
          : modalState?.kind === "deleteBlock"
            ? "Delete content"
            : ""}
    description={modalState?.kind === "createFolder"
        ? `Add a folder${modalState.parentId ? ` inside ${modalState.parentName}` : ""}.`
        : modalState?.kind === "deleteFolder"
          ? `Delete “${modalState.name}” only if it has no child folders and no content items.`
          : modalState?.kind === "deleteBlock"
            ? modalState.references.length > 0
                ? `Move “${modalState.name}” to trash and remove it from published and draft pages that use it.`
                : `Move “${modalState.name}” to trash.`
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

<aside
    class={[
        "hidden bg-transparent p-3 transition-[width] duration-200 lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:flex-col",
        desktopCollapsed ? "lg:w-24" : "lg:w-[33rem]",
    ].join(" ")}
>
    <div class="flex min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-background shadow-sm">
        {@render NavContent()}
    </div>
</aside>

{#if mobileOpen}
    <div
        class="fixed inset-0 z-40 bg-black/40 lg:hidden"
        aria-hidden="true"
        onclick={onClose}
    ></div>
    <div
        class="fixed inset-y-0 left-0 z-50 w-80 border-r border-border bg-background shadow-lg lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Sidebar"
    >
        <div
            class="flex h-14 items-center justify-end border-b border-border px-2"
        >
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
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
            </Button>
        </div>
        {@render NavContent(true)}
    </div>
{/if}
