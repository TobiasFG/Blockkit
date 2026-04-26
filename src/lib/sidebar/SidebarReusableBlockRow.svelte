<script lang="ts">
    import { ContextMenu } from "bits-ui";
    import { buttonVariants } from "$lib/components/ui/button/index.js";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
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
    const stateDotClass = $derived.by(() => {
        const state = getReusableBlockPublishState(block);
        if (state === "draft-changes") return "bg-amber-500";
        if (state === "published") return "bg-emerald-500";
        return "bg-slate-400";
    });
    const rowStyle = $derived(
        depth === null ? undefined : `padding-left: ${depth * 1 + 0.25}rem`,
    );
    const rowClass = $derived(
        depth === null
            ? "flex min-w-0 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition"
            : "flex min-w-0 items-center justify-between gap-2 rounded-md py-1.5 pr-2 text-sm transition",
    );
</script>

<div
    class={[
        rowClass,
        active
            ? "bg-muted text-foreground"
            : "text-slate-700 hover:bg-muted hover:text-foreground dark:text-muted-foreground",
    ].join(" ")}
    style={rowStyle}
>
    <ContextMenu.Root>
        <ContextMenu.Trigger class="flex min-w-0 flex-1">
            <a
                href={`/content/${block.id}`}
                class="flex min-w-0 flex-1 items-center justify-between gap-3"
                draggable={canInsertIntoPage && canDragIntoPage}
                onclick={onClose}
                ondragstart={(event) => setReusableBlockDragData(event, block.id)}
            >
                <div class="flex min-w-0 flex-1 items-center gap-3">
                    <span
                        class="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border/70 bg-background text-muted-foreground"
                    >
                        {#if isQuoteBlock}
                            <Quote class="h-4 w-4" />
                        {:else}
                            <FileText class="h-4 w-4" />
                        {/if}
                    </span>
                    <span class="min-w-[4rem] flex-1 truncate font-medium">
                        {block.name}
                    </span>
                </div>
                <div class="flex shrink-0 items-center gap-1.5">
                    <span
                        class="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                    >
                        {block.block_type}
                    </span>
                    <span class={`h-2.5 w-2.5 rounded-full ${stateDotClass}`}
                    ></span>
                </div>
            </a>
        </ContextMenu.Trigger>
        <ContextMenu.Content
            class="z-50 min-w-44 rounded-xl border border-border bg-popover p-1.5 shadow-lg"
        >
            {#if canInsertIntoPage}
                <ContextMenu.Item
                    class="rounded-lg px-2 py-2 text-sm text-slate-700 outline-none transition focus:bg-slate-100"
                    onSelect={() => onInsertBlockIntoPage(block.id)}
                >
                    Insert into page
                </ContextMenu.Item>
            {/if}
            <ContextMenu.Item
                class="rounded-lg px-2 py-2 text-sm text-red-700 outline-none transition focus:bg-red-50"
                onSelect={() => onDeleteBlock(block.id, block.name)}
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
        <DropdownMenu.Content class="min-w-44 rounded-xl p-1.5">
            {#if canInsertIntoPage}
                <DropdownMenu.Item
                    class="rounded-lg px-2 py-2 text-sm"
                    onSelect={() => onInsertBlockIntoPage(block.id)}
                >
                    Insert into page
                </DropdownMenu.Item>
            {/if}
            <DropdownMenu.Item
                variant="destructive"
                class="rounded-lg px-2 py-2 text-sm"
                onSelect={() => onDeleteBlock(block.id, block.name)}
            >
                Delete content
            </DropdownMenu.Item>
        </DropdownMenu.Content>
    </DropdownMenu.Root>
</div>
