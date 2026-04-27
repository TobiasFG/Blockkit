<script lang="ts">
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import { EllipsisVertical, FileText, Quote } from "$lib/icons";
    import { getReusableBlockPublishState } from "$lib/reusableBlockStatus";
    import type { ReusableBlock } from "$lib/types";
    import { setReusableBlockDragData } from "./ReusableBlockInsertion";

    type Props = {
        block: ReusableBlock;
        active: boolean;
        depth?: number | null;
        canInsertIntoPage: boolean;
        canDragIntoPage: boolean;
        onClose: () => void;
        onDeleteBlock: (blockId: string, blockName: string) => void;
        onInsertBlockIntoPage: (blockId: string) => void;
    };

    let {
        block,
        active,
        depth = null,
        canInsertIntoPage,
        canDragIntoPage,
        onClose,
        onDeleteBlock,
        onInsertBlockIntoPage,
    }: Props = $props();

    const isQuoteBlock = $derived.by(() => {
        const type = block.block_type.toLowerCase();
        return type.includes("quote") || type.includes("testimonial");
    });
    const rowPadding = $derived(
        depth === null
            ? "padding-right: 4.25rem;"
            : `padding-left: calc(0.5rem + ${depth} * 0.875rem); padding-right: 4.25rem;`,
    );
    const publishState = $derived(getReusableBlockPublishState(block));
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

<Sidebar.MenuItem>
    <Sidebar.MenuButton class="w-full" style={rowPadding} isActive={active}>
        {#snippet child({ props })}
            <a
                href={`/content/${block.id}`}
                {...props}
                draggable={canInsertIntoPage && canDragIntoPage}
                onclick={onClose}
                ondragstart={(event) => setReusableBlockDragData(event, block.id)}
            >
                {#if isQuoteBlock}
                    <Quote class="size-4 shrink-0" />
                {:else}
                    <FileText class="size-4 shrink-0" />
                {/if}
                <span>{block.name}</span>
            </a>
        {/snippet}
    </Sidebar.MenuButton>

    <DropdownMenu.Root>
        <DropdownMenu.Trigger>
            {#snippet child({ props })}
                <Sidebar.MenuAction
                    {...props}
                    class="right-10 opacity-100 hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground dark:hover:bg-muted/50"
                >
                    <EllipsisVertical class="size-4" />
                    <span class="sr-only">Content actions</span>
                </Sidebar.MenuAction>
            {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content side="right" align="start" class="min-w-44">
            {#if canInsertIntoPage}
                <DropdownMenu.Item
                    onSelect={() => onInsertBlockIntoPage(block.id)}
                >
                    Insert into page
                </DropdownMenu.Item>
            {/if}
            <DropdownMenu.Item
                variant="destructive"
                onSelect={() => onDeleteBlock(block.id, block.name)}
            >
                Delete content
            </DropdownMenu.Item>
        </DropdownMenu.Content>
    </DropdownMenu.Root>

    <span
        class={`absolute right-2.5 top-3 size-2.5 rounded-full ${statusDotClass}`}
        title={`${statusLabel} (${block.block_type})`}
    ></span>
</Sidebar.MenuItem>
