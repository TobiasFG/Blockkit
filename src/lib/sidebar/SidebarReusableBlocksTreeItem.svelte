<script lang="ts">
    import * as Collapsible from "$lib/components/ui/collapsible/index.js";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import { ChevronRight, EllipsisVertical, Folder } from "$lib/icons";
    import SidebarReusableBlockRow from "./SidebarReusableBlockRow.svelte";
    import SidebarReusableBlocksTreeItem from "./SidebarReusableBlocksTreeItem.svelte";
    import type { ReusableBlocksTreeNode } from "./ReusableBlocksTree";

    type Props = {
        node: ReusableBlocksTreeNode;
        depth: number;
        activeBlockId: string | null;
        closedNodes: Record<string, boolean>;
        collapsed?: boolean;
        onToggle: (id: string) => void;
        onClose: () => void;
        canInsertIntoPage: boolean;
        canDragIntoPage: boolean;
        onCreateSubfolder: (folderId: string, folderName: string) => void;
        onDeleteFolder: (folderId: string, folderName: string) => void;
        onDeleteBlock: (blockId: string, blockName: string) => void;
        onInsertBlockIntoPage: (blockId: string) => void;
    };

    let {
        node,
        depth,
        activeBlockId,
        closedNodes,
        collapsed = false,
        onToggle,
        onClose,
        canInsertIntoPage,
        canDragIntoPage,
        onCreateSubfolder,
        onDeleteFolder,
        onDeleteBlock,
        onInsertBlockIntoPage,
    }: Props = $props();

    const hasChildren = $derived(
        node.folders.length > 0 || node.blocks.length > 0,
    );
    const nodeId = $derived(node.folder?.id ?? "");
    const folderName = $derived(node.folder?.name ?? "Folder");
    const isOpen = $derived(node.folder ? !closedNodes[nodeId] : true);
    const rowPadding = $derived(
        collapsed
            ? undefined
            : `padding-left: calc(0.5rem + ${depth} * 0.875rem); padding-right: ${hasChildren ? "6.75rem" : "4.25rem"};`,
    );
</script>

{#if node.folder}
    <Collapsible.Root open={isOpen} class="group/collapsible">
        {#snippet child({ props })}
            <Sidebar.MenuItem {...props}>
                <Sidebar.MenuButton
                    class="w-full"
                    style={rowPadding}
                    tooltipContent={folderName}
                >
                    {#snippet child({ props })}
                        <button type="button" {...props}>
                            <Folder class="size-4 shrink-0" />
                            <span>{folderName}</span>
                        </button>
                    {/snippet}
                </Sidebar.MenuButton>

                {#if hasChildren && !collapsed}
                    <Collapsible.Trigger>
                        {#snippet child({ props })}
                            <Sidebar.MenuAction
                                {...props}
                                class="right-14 opacity-100 hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground dark:hover:bg-muted/50 [&[data-state=open]>svg]:rotate-90"
                                onclick={() => onToggle(node.folder!.id)}
                            >
                                <ChevronRight class="size-4 transition-transform duration-200" />
                                <span class="sr-only">Toggle folder</span>
                            </Sidebar.MenuAction>
                        {/snippet}
                    </Collapsible.Trigger>
                {/if}

                {#if !collapsed}
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                            {#snippet child({ props })}
                                <Sidebar.MenuAction
                                    {...props}
                                    class="right-8 opacity-100 hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground dark:hover:bg-muted/50"
                                >
                                    <EllipsisVertical class="size-4" />
                                    <span class="sr-only">Folder actions</span>
                                </Sidebar.MenuAction>
                            {/snippet}
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content
                            side="right"
                            align="start"
                            class="min-w-44"
                        >
                            <DropdownMenu.Item
                                onSelect={() =>
                                    onCreateSubfolder(
                                        node.folder!.id,
                                        node.folder!.name,
                                    )}
                            >
                                Create subfolder
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                variant="destructive"
                                onSelect={() =>
                                    onDeleteFolder(
                                        node.folder!.id,
                                        node.folder!.name,
                                    )}
                            >
                                Delete folder
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>

                    <Badge
                        variant="secondary"
                        class="absolute right-1 top-1.5 h-5 min-w-5 rounded-full px-1 font-mono tabular-nums"
                    >
                        {node.folders.length + node.blocks.length}
                    </Badge>
                {/if}

                {#if isOpen}
                    <Collapsible.Content>
                        <div class="relative">
                            {#each node.folders as child (child.folder?.id)}
                                <SidebarReusableBlocksTreeItem
                                    node={child}
                                    depth={depth + 1}
                                    {activeBlockId}
                                    {closedNodes}
                                    {collapsed}
                                    {onToggle}
                                    {onClose}
                                    {canInsertIntoPage}
                                    {canDragIntoPage}
                                    {onCreateSubfolder}
                                    {onDeleteFolder}
                                    {onDeleteBlock}
                                    {onInsertBlockIntoPage}
                                />
                            {/each}

                            {#each node.blocks as block (block.id)}
                                <SidebarReusableBlockRow
                                    {block}
                                    active={activeBlockId === block.id}
                                    depth={depth + 1}
                                    {canInsertIntoPage}
                                    {canDragIntoPage}
                                    {onClose}
                                    {onDeleteBlock}
                                    {onInsertBlockIntoPage}
                                />
                            {/each}
                        </div>
                    </Collapsible.Content>
                {/if}
            </Sidebar.MenuItem>
        {/snippet}
    </Collapsible.Root>
{/if}
