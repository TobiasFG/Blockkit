<script lang="ts">
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import {
        ChevronRight,
        EllipsisVertical,
        FileText,
        Folder,
    } from "$lib/icons";
    import { getPagePublishState } from "$lib/pageStatus";
    import SidebarPageTreeItem from "./SidebarPageTreeItem.svelte";
    import type { SidebarTreeNode } from "./SidebarTree";

    type Props = {
        node: SidebarTreeNode;
        depth: number;
        activePageId: string | null;
        closedNodes: Record<string, boolean>;
        collapsed?: boolean;
        onToggle: (pageId: string) => void;
        onClose: () => void;
        onDeletePage: (id: string, title: string, hasChildren: boolean) => void;
        editHref: (pageId: string) => string;
        displayPath: (path: string) => string;
    };

    let {
        node,
        depth,
        activePageId,
        closedNodes,
        collapsed = false,
        onToggle,
        onClose,
        onDeletePage,
        editHref,
        displayPath,
    }: Props = $props();

    const hasChildren = $derived(node.children.length > 0);
    const isOpen = $derived(hasChildren ? !closedNodes[node.page.id] : false);
    const isActive = $derived(activePageId === node.page.id);
    const publishState = $derived(getPagePublishState(node.page));
    const pageHref = $derived(editHref(node.page.id));
    const rowPadding = $derived(
        collapsed
            ? undefined
            : `padding-left: calc(0.5rem + ${depth} * 0.875rem); padding-right: ${hasChildren ? "6.75rem" : "4.25rem"};`,
    );
    const statusLabel = $derived(
        publishState === "draft-changes"
            ? "Draft changes"
            : publishState === "published"
              ? "Published"
              : "Unpublished",
    );
    const statusDotClass = $derived(
        publishState === "draft-changes"
            ? "bg-amber-500"
            : publishState === "published"
              ? "bg-emerald-500"
              : "bg-slate-400",
    );
</script>

<div class="space-y-0.5">
    <div class="relative">
        <a
            href={pageHref}
            class={[
                "group flex min-w-0 items-center gap-2 rounded-md py-1.5 text-sm transition",
                collapsed ? "justify-center px-0" : "",
                isActive
                    ? "bg-muted text-foreground"
                    : "text-slate-700 hover:bg-muted hover:text-foreground dark:text-muted-foreground",
            ].join(" ")}
            style={rowPadding}
            title={collapsed
                ? `${node.page.title} (${displayPath(node.page.path)})`
                : undefined}
            onclick={onClose}
        >
            {#if hasChildren}
                <Folder class="size-4 shrink-0" />
            {:else}
                <FileText class="size-4 shrink-0" />
            {/if}
            {#if !collapsed}
                <span class="min-w-0 flex-1 truncate font-medium">
                    {node.page.title}
                </span>
            {/if}
        </a>

        {#if !collapsed && hasChildren}
            <button
                type="button"
                class="absolute right-14 top-1.5 inline-flex size-5 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                aria-label={isOpen
                    ? `Collapse ${node.page.title}`
                    : `Expand ${node.page.title}`}
                aria-expanded={isOpen}
                onclick={() => onToggle(node.page.id)}
            >
                <ChevronRight
                    class={[
                        "size-4 transition-transform",
                        isOpen ? "rotate-90" : "",
                    ].join(" ")}
                />
            </button>
        {/if}

        {#if !collapsed}
            <DropdownMenu.Root>
                <DropdownMenu.Trigger
                    class={[
                        "absolute top-1.5 inline-flex size-5 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                        hasChildren ? "right-8" : "right-8",
                    ].join(" ")}
                    aria-label={`Actions for ${node.page.title}`}
                >
                    <EllipsisVertical class="size-4" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content side="right" align="start" class="min-w-44">
                    <DropdownMenu.Item>
                        {#snippet child({ props })}
                            <a href={pageHref} {...props} onclick={onClose}
                                >Open page</a
                            >
                        {/snippet}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                        {#snippet child({ props })}
                            <a href="/#create" {...props} onclick={onClose}
                                >Create child page</a
                            >
                        {/snippet}
                    </DropdownMenu.Item>
                    {#if node.page.parent_page_id !== null}
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item
                            onclick={() =>
                                onDeletePage(
                                    node.page.id,
                                    node.page.title,
                                    hasChildren,
                                )}
                        >
                            Move to trash
                        </DropdownMenu.Item>
                    {/if}
                </DropdownMenu.Content>
            </DropdownMenu.Root>

            {#if hasChildren}
                <Badge
                    variant="secondary"
                    class="absolute right-1 top-1.5 h-5 min-w-5 rounded-full px-1 font-mono tabular-nums"
                    >{node.children.length}</Badge
                >
            {:else}
                <span
                    class={`absolute right-2.5 top-3 size-2.5 rounded-full ${statusDotClass}`}
                    title={statusLabel}
                ></span>
            {/if}
        {/if}
    </div>

    {#if hasChildren && isOpen}
        <div class={collapsed ? "hidden" : "space-y-0.5"}>
            {#each node.children as child (child.page.id)}
                <SidebarPageTreeItem
                    node={child}
                    depth={depth + 1}
                    {activePageId}
                    {closedNodes}
                    {collapsed}
                    {onToggle}
                    {onClose}
                    {onDeletePage}
                    {editHref}
                    {displayPath}
                />
            {/each}
        </div>
    {/if}
</div>
