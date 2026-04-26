<script lang="ts">
    import { page } from "$app/stores";
    import ThemeToggle from "$lib/Theme/ThemeToggle.svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import {
        Bell,
        ChevronDown,
        EllipsisVertical,
        Home,
        Plus,
        Search,
    } from "$lib/icons";
    import { buildEditPagePath } from "$lib/pagePath";
    import type { SidebarExpandedContentProps } from "./Types";
    import SidebarPageTreeItem from "./SidebarPageTreeItem.svelte";
    import SidebarReusableBlockRow from "./SidebarReusableBlockRow.svelte";
    import SidebarReusableBlocksTreeItem from "./SidebarReusableBlocksTreeItem.svelte";
    import SidebarUserFooter from "./SidebarUserFooter.svelte";

    let {
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
        onClose,
        onToggle,
        onCreateFolder,
        onDeleteFolder,
        onDeleteBlock,
        onInsertBlock,
        bindPagesSectionElement,
        bindContentSectionElement,
    }: SidebarExpandedContentProps = $props();

    let pagesSectionElement = $state<HTMLElement | null>(null);
    let contentSectionElement = $state<HTMLElement | null>(null);

    const editHref = (pageId: string) => buildEditPagePath(pageId);
    const displayPath = (path: string | null | undefined) =>
        path && path.trim() ? path : "/";
    const isActive = (href: string) => $page.url.pathname === href;
    const isContentLibraryActive = $derived(isActive("/content"));

    $effect(() => {
        bindPagesSectionElement?.(pagesSectionElement);
    });

    $effect(() => {
        bindContentSectionElement?.(contentSectionElement);
    });
</script>

<div class="flex h-full flex-col bg-background">
    <div
        class="sticky top-0 z-10 border-b border-border bg-background/95 px-5 py-4 backdrop-blur"
    >
        <div class="flex items-start gap-3">
            <div
                class="grid h-12 w-12 place-items-center rounded-lg bg-[#173a63] text-xl font-semibold text-white shadow-sm"
            >
                S
            </div>
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
            <div class="ml-auto flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" aria-label="Search">
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
        </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5">
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
                    <div class="px-3 py-2 text-sm text-muted-foreground">
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
                            {onToggle}
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
                    <div class="px-3 py-2 text-sm text-muted-foreground">
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
                            {onToggle}
                            {onClose}
                            canInsertIntoPage={canInsertIntoCurrentPage}
                            canDragIntoPage={canDragReusableBlocks}
                            onCreateSubfolder={onCreateFolder}
                            {onDeleteFolder}
                            {onDeleteBlock}
                            onInsertBlockIntoPage={onInsertBlock}
                        />
                    {/each}

                    {#each reusableBlocksTree.blocks as block (block.id)}
                        <SidebarReusableBlockRow
                            {block}
                            active={activeReusableBlockId === block.id}
                            canInsertIntoPage={canInsertIntoCurrentPage}
                            canDragIntoPage={canDragReusableBlocks}
                            {onClose}
                            {onDeleteBlock}
                            onInsertBlockIntoPage={onInsertBlock}
                        />
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
    </div>

    <SidebarUserFooter {user} {logoutEnhanceSubmit} />
</div>
