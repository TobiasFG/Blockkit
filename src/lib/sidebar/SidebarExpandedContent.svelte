<script lang="ts">
    import { enhance } from "$app/forms";
    import { page } from "$app/stores";
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import ThemeToggle from "$lib/Theme/ThemeToggle.svelte";
    import CommandIcon from "@lucide/svelte/icons/command";
    import {
        BadgeCheck,
        Bell,
        ChevronsUpDown,
        EllipsisVertical,
        FileText,
        Folder,
        Home,
        LogOut,
        Plus,
        Search,
        Sparkles,
    } from "$lib/icons";
    import { buildEditPagePath } from "$lib/pagePath";
    import type { SidebarExpandedContentProps } from "./Types";
    import SidebarPageTreeItem from "./SidebarPageTreeItem.svelte";
    import SidebarReusableBlockRow from "./SidebarReusableBlockRow.svelte";
    import SidebarReusableBlocksTreeItem from "./SidebarReusableBlocksTreeItem.svelte";

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
        onDeletePage,
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
    const displayName = $derived(
        user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Editor",
    );
    const initials = $derived(displayName.slice(0, 2).toUpperCase());

    $effect(() => {
        bindPagesSectionElement?.(pagesSectionElement);
    });

    $effect(() => {
        bindContentSectionElement?.(contentSectionElement);
    });
</script>

<Sidebar.Header>
    <Sidebar.Menu>
        <Sidebar.MenuItem>
            <Sidebar.MenuButton size="lg">
                {#snippet child({ props })}
                    <a href="/" {...props} onclick={onClose}>
                        <span
                            class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-sm font-semibold"
                        >
                            <CommandIcon class="size-4" />
                        </span>
                        <span
                            class="grid flex-1 text-start text-sm leading-tight"
                        >
                            <span class="truncate font-medium">Acme Inc</span>
                            <span class="truncate text-xs">Enterprise</span>
                        </span>
                    </a>
                {/snippet}
            </Sidebar.MenuButton>
        </Sidebar.MenuItem>
    </Sidebar.Menu>
</Sidebar.Header>

<Sidebar.Content>
    <Sidebar.Group>
        <Sidebar.Menu>
            <Sidebar.MenuItem>
                <Sidebar.MenuButton isActive={isActive("/")}>
                    {#snippet child({ props })}
                        <a href="/" {...props} onclick={onClose}>
                            <Home class="size-4" />
                            <span>Dashboard</span>
                        </a>
                    {/snippet}
                </Sidebar.MenuButton>
            </Sidebar.MenuItem>
        </Sidebar.Menu>
    </Sidebar.Group>

    <Sidebar.Group bind:ref={pagesSectionElement}>
        <div class="flex items-center justify-between gap-2">
            <Sidebar.GroupLabel>Pages</Sidebar.GroupLabel>
            <div class="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Create page"
                    href="/#create"
                    onclick={onClose}
                >
                    <Plus class="size-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Page actions"
                >
                    <EllipsisVertical class="size-4" />
                </Button>
            </div>
        </div>
        <Sidebar.Menu>
            {#if currentPages.length === 0}
                <Sidebar.MenuItem>
                    <div class="px-2 py-1.5 text-sm text-muted-foreground">
                        No pages yet
                    </div>
                </Sidebar.MenuItem>
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
                        {onDeletePage}
                        {editHref}
                        {displayPath}
                    />
                {/each}
            {/if}
        </Sidebar.Menu>
    </Sidebar.Group>

    <Sidebar.Group bind:ref={contentSectionElement}>
        <div class="flex items-center justify-between gap-2">
            <Sidebar.GroupLabel>Content</Sidebar.GroupLabel>
            <div class="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Open content library"
                    href="/content"
                    onclick={onClose}
                >
                    <Plus class="size-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Content actions"
                    onclick={() => onCreateFolder(null, "Content")}
                >
                    <EllipsisVertical class="size-4" />
                </Button>
            </div>
        </div>
        <Sidebar.Menu>
            <Sidebar.MenuItem>
                <Sidebar.MenuButton isActive={isActive("/content")}>
                    {#snippet child({ props })}
                        <a href="/content" {...props} onclick={onClose}>
                            <Folder class="size-4" />
                            <span>Content library</span>
                        </a>
                    {/snippet}
                </Sidebar.MenuButton>
            </Sidebar.MenuItem>

            {#if currentBlockFolders.length === 0 && currentReusableBlocks.length === 0}
                <Sidebar.MenuItem>
                    <div class="px-2 py-1.5 text-sm text-muted-foreground">
                        No content yet
                    </div>
                </Sidebar.MenuItem>
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
                <Sidebar.MenuItem>
                    <div
                        class="mx-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
                    >
                        Applying sidebar action...
                    </div>
                </Sidebar.MenuItem>
            {:else if actionNotice}
                <Sidebar.MenuItem>
                    <div
                        class={[
                            "mx-2 rounded-md px-3 py-2 text-xs",
                            actionNotice.tone === "success"
                                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : "border border-destructive/30 bg-destructive/10 text-destructive",
                        ].join(" ")}
                    >
                        {actionNotice.text}
                    </div>
                </Sidebar.MenuItem>
            {/if}
        </Sidebar.Menu>
    </Sidebar.Group>
</Sidebar.Content>

<Sidebar.Footer>
    <Sidebar.Menu>
        <Sidebar.MenuItem>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                    {#snippet child({ props })}
                        <Sidebar.MenuButton
                            {...props}
                            size="lg"
                            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar.Root class="size-8 rounded-lg">
                                <Avatar.Image src="" alt="" />
                                <Avatar.Fallback class="rounded-lg">
                                    {initials}
                                </Avatar.Fallback>
                            </Avatar.Root>
                            <span
                                class="grid flex-1 text-start text-sm leading-tight"
                            >
                                <span class="truncate font-medium">
                                    {displayName}
                                </span>
                                <span class="truncate text-xs">
                                    {user.email}
                                </span>
                            </span>
                            <ChevronsUpDown class="ms-auto size-4" />
                        </Sidebar.MenuButton>
                    {/snippet}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                    class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
                    side="right"
                    align="end"
                    sideOffset={4}
                >
                    <DropdownMenu.Label class="p-0 font-normal">
                        <div
                            class="flex items-center gap-2 px-1 py-1.5 text-start text-sm"
                        >
                            <Avatar.Root class="size-8 rounded-lg">
                                <Avatar.Image src="" alt="" />
                                <Avatar.Fallback class="rounded-lg">
                                    {initials}
                                </Avatar.Fallback>
                            </Avatar.Root>
                            <span
                                class="grid flex-1 text-start text-sm leading-tight"
                            >
                                <span class="truncate font-medium">
                                    {displayName}
                                </span>
                                <span class="truncate text-xs">
                                    {user.email}
                                </span>
                            </span>
                        </div>
                    </DropdownMenu.Label>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Group>
                        <DropdownMenu.Item>
                            <Sparkles class="size-4" />
                            Upgrade to Pro
                        </DropdownMenu.Item>
                        <DropdownMenu.Item>
                            <BadgeCheck class="size-4" />
                            Account
                        </DropdownMenu.Item>
                        <DropdownMenu.Item>
                            <FileText class="size-4" />
                            Billing
                        </DropdownMenu.Item>
                    </DropdownMenu.Group>
                    <DropdownMenu.Separator />
                    <form
                        method="POST"
                        action="/auth?/signOut"
                        use:enhance={logoutEnhanceSubmit}
                    >
                        <DropdownMenu.Item>
                            {#snippet child({ props })}
                                <button type="submit" {...props}>
                                    <LogOut class="size-4" />
                                    Log out
                                </button>
                            {/snippet}
                        </DropdownMenu.Item>
                    </form>
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </Sidebar.MenuItem>
    </Sidebar.Menu>
</Sidebar.Footer>
