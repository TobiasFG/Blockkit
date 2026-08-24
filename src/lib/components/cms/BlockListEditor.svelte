<script lang="ts">
    import * as Alert from "$lib/components/ui/alert/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import type { BlockPath, PageContentValidationErrors } from "$lib/pageContentEditor";
    import { isReusableBlockReference, type PageBlockNode } from "$lib/pageContent";
    import type { ReusableBlock } from "$lib/types";
    import { parseReusableBlockDragData } from "$lib/Sidebar/ReusableBlockInsertion";

    type Props = {
        blocks: PageBlockNode[];
        errors: PageContentValidationErrors;
        draggingPath: string | null;
        canDragBlocks?: boolean;
        onInsertReusableBlockReference: (
            reusableBlockId: string,
            index: number,
        ) => void;
        onRemoveBlock: (path: BlockPath) => void;
        onMoveBlock: (path: BlockPath, toIndex: number) => void;
        onStartDrag: (path: BlockPath) => void;
        onEndDrag: () => void;
        reusableBlocks?: ReusableBlock[];
    };

    let {
        blocks,
        errors,
        draggingPath,
        canDragBlocks = false,
        onInsertReusableBlockReference,
        onRemoveBlock,
        onMoveBlock,
        onStartDrag,
        onEndDrag,
        reusableBlocks = [],
    }: Props = $props();

    const getBlockError = (index: number) => errors[String(index)] ?? "";

    const canInsertReusableBlocks = $derived(reusableBlocks.length > 0);
    let hoveredDropTarget = $state<string | null>(null);

    const tertiaryButtonClass = "rounded-full";
    const captionClass =
        "text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground";

    const getReusableBlock = (id: string) =>
        reusableBlocks.find((block) => block.id === id) ?? null;
    const getContentHref = (id: string) => `/content/${id}`;

    const handleDrop = (event: DragEvent, targetIndex: number) => {
        event.preventDefault();
        hoveredDropTarget = null;

        const reusablePayload = parseReusableBlockDragData(event);
        if (reusablePayload) {
            onInsertReusableBlockReference(
                reusablePayload.reusableBlockId,
                targetIndex,
            );
            onEndDrag();
            return;
        }

        const raw = event.dataTransfer?.getData("text/plain") ?? draggingPath;
        if (!raw) return;

        const fromIndex = Number(raw);
        if (!Number.isInteger(fromIndex)) return;

        onMoveBlock([fromIndex], targetIndex);
        onEndDrag();
    };

    const handleBlockDragStart = (event: DragEvent, index: number) => {
        event.dataTransfer?.setData("text/plain", String(index));
        event.dataTransfer?.setDragImage(
            event.currentTarget as Element,
            24,
            24,
        );
        onStartDrag([index]);
    };
</script>

<div class="space-y-4">
    {#if blocks.length === 0}
        <Button
            type="button"
            variant="outline"
            class="rounded-[1.5rem] border border-dashed border-border bg-muted/40 px-5 py-6 text-left text-sm text-muted-foreground"
            aria-label="Drop content before the empty list"
            ondragover={(event) => canDragBlocks && event.preventDefault()}
            ondrop={(event) => canDragBlocks && handleDrop(event, 0)}
        >
            <div class="font-semibold text-foreground">No content yet.</div>
            {#if canDragBlocks}
                <span class="mt-1 block text-muted-foreground"
                    >Drag content here to start page.</span
                >
            {:else}
                <span class="mt-1 block text-muted-foreground"
                    >Choose content from library to start page.</span
                >
            {/if}
        </Button>
    {:else}
        <div class="space-y-2 divide-y divide-stone-200">
            {#if canDragBlocks && draggingPath}
                <Button
                    type="button"
                    variant="outline"
                    class={[
                        "rounded-full border-dashed px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.22em]",
                        hoveredDropTarget === "0"
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-muted/60 text-muted-foreground",
                    ].join(" ")}
                    aria-label="Drop block before the first block"
                    ondragover={(event) => {
                        event.preventDefault();
                        hoveredDropTarget = "0";
                    }}
                    ondragenter={(event) => {
                        event.preventDefault();
                        hoveredDropTarget = "0";
                    }}
                    ondrop={(event) => handleDrop(event, 0)}
                >
                    Drop before the first block
                </Button>
            {/if}

            {#each blocks as block, index (block.id)}
                {@const reusableBlock = isReusableBlockReference(block)
                    ? getReusableBlock(block.reusableBlockId)
                    : null}

                {#if canDragBlocks && draggingPath}
                    <Button
                        type="button"
                        variant="outline"
                        class={[
                            "rounded-full border-dashed px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.22em]",
                            hoveredDropTarget === String(index + 1)
                                ? "border-foreground bg-foreground text-background"
                                : "border-border bg-muted/60 text-muted-foreground",
                        ].join(" ")}
                        aria-label={`Drop block after ${index + 1}`}
                        ondragover={(event) => {
                            event.preventDefault();
                            hoveredDropTarget = String(index + 1);
                        }}
                        ondragenter={(event) => {
                            event.preventDefault();
                            hoveredDropTarget = String(index + 1);
                        }}
                        ondrop={(event) => handleDrop(event, index + 1)}
                    >
                        Drop after this block
                    </Button>
                {/if}

                <div
                    class={[
                        "px-1 py-5",
                        draggingPath === String(index)
                            ? "rounded-[1.25rem] bg-amber-500/10 ring-2 ring-amber-500/30"
                            : "",
                    ].join(" ")}
                    role="listitem"
                    draggable={canDragBlocks}
                    ondragstart={canDragBlocks
                        ? (event) => handleBlockDragStart(event, index)
                        : undefined}
                    ondragend={() => {
                        hoveredDropTarget = null;
                        onEndDrag();
                    }}
                >
                    <div class="flex flex-wrap items-start justify-between gap-3">
                        <div class="space-y-1">
                            <div class="flex flex-wrap items-center gap-2">
                                <h4
                                    class="text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground"
                                >
                                    {#if !isReusableBlockReference(block)}
                                        {block.type}
                                    {:else if reusableBlock}
                                        <a
                                            href={getContentHref(
                                                reusableBlock.id,
                                            )}
                                            class="underline decoration-border underline-offset-4"
                                        >
                                            {reusableBlock.name}
                                        </a>
                                    {:else}
                                        Missing content item
                                    {/if}
                                </h4>
                                <Badge
                                    variant="outline"
                                    class="font-mono text-[10px] uppercase tracking-[0.12em]"
                                >
                                    content
                                </Badge>
                                {#if reusableBlock}
                                    <Badge
                                        variant="secondary"
                                        class="text-[10px] font-medium uppercase tracking-[0.12em]"
                                    >
                                        {reusableBlock.block_type}
                                    </Badge>
                                {/if}
                                {#if canDragBlocks && draggingPath === String(index)}
                                    <Badge
                                        class="bg-amber-500/15 text-[10px] font-medium uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300"
                                    >
                                        Dragging
                                    </Badge>
                                {/if}
                            </div>
                            <div
                                class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground"
                            >
                                <span>{index + 1} of {blocks.length}</span>
                                <span class="font-mono" title={block.id}
                                    >ID {block.id.slice(0, 8)}</span
                                >
                            </div>
                        </div>

                        <div class="flex flex-wrap items-center gap-2">
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger
                                    class={`${buttonVariants({ variant: "outline" })} ${tertiaryButtonClass}`}
                                >
                                    Actions
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content
                                    align="end"
                                    class="w-56 rounded-[1.25rem] p-2"
                                >
                                    <DropdownMenu.Item
                                        onSelect={() =>
                                            onMoveBlock([index], index - 1)}
                                        disabled={index === 0}
                                        class="rounded-xl px-3 py-2"
                                    >
                                        Move up
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                        onSelect={() =>
                                            onMoveBlock([index], index + 1)}
                                        disabled={index === blocks.length - 1}
                                        class="rounded-xl px-3 py-2"
                                    >
                                        Move down
                                    </DropdownMenu.Item>
                                    {#if canInsertReusableBlocks}
                                        <DropdownMenu.Sub>
                                            <DropdownMenu.SubTrigger
                                                class="rounded-xl px-3 py-2"
                                            >
                                                Insert content before
                                            </DropdownMenu.SubTrigger>
                                            <DropdownMenu.SubContent
                                                class="max-h-64 w-64 overflow-y-auto rounded-[1.25rem] p-2"
                                            >
                                                <p
                                                    class={`${captionClass} px-3 py-1`}
                                                >
                                                    Insert before this row
                                                </p>
                                                {#each reusableBlocks as candidate (candidate.id)}
                                                    <DropdownMenu.Item
                                                        onSelect={() =>
                                                            onInsertReusableBlockReference(
                                                                candidate.id,
                                                                index,
                                                            )}
                                                        class="rounded-xl px-3 py-2"
                                                    >
                                                        <span
                                                            class="min-w-0 flex-1 truncate font-medium"
                                                        >
                                                            {candidate.name}
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            class="ml-3 shrink-0 text-[10px] uppercase tracking-[0.12em]"
                                                        >
                                                            {candidate.block_type}
                                                        </Badge>
                                                    </DropdownMenu.Item>
                                                {/each}
                                            </DropdownMenu.SubContent>
                                        </DropdownMenu.Sub>
                                    {/if}
                                    <DropdownMenu.Item
                                        variant="destructive"
                                        onSelect={() => onRemoveBlock([index])}
                                        class="rounded-xl px-3 py-2"
                                    >
                                        Remove block
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                        </div>
                    </div>

                    {#if getBlockError(index)}
                        <Alert.Root class="mt-4" variant="destructive">
                            <Alert.Description
                                >{getBlockError(index)}</Alert.Description
                            >
                        </Alert.Root>
                    {/if}

                    {#if isReusableBlockReference(block)}
                        <div
                            class="mt-4 border-l border-border pl-4 text-sm text-foreground"
                        >
                            <p class="text-sm font-medium text-foreground">
                                Content used on this page.
                                {#if reusableBlock}
                                    <a
                                        href={getContentHref(reusableBlock.id)}
                                        class="ml-1 font-semibold text-foreground underline"
                                    >
                                        Edit content
                                    </a>
                                {/if}
                            </p>
                            {#if reusableBlock}
                                <p
                                    class="mt-1 text-sm leading-6 text-muted-foreground"
                                >
                                    Using “{reusableBlock.name}”.
                                </p>
                            {:else}
                                <p class="mt-1 text-sm leading-6 text-red-700">
                                    This content no longer exists. Remove it or
                                    choose different content before saving.
                                </p>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/each}

            {#if canDragBlocks && draggingPath}
                <Button
                    type="button"
                    variant="outline"
                    class={[
                        "rounded-full border-dashed px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.22em]",
                        hoveredDropTarget === String(blocks.length)
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-muted/60 text-muted-foreground",
                    ].join(" ")}
                    aria-label="Drop block after the last block"
                    ondragover={(event) => {
                        event.preventDefault();
                        hoveredDropTarget = String(blocks.length);
                    }}
                    ondragenter={(event) => {
                        event.preventDefault();
                        hoveredDropTarget = String(blocks.length);
                    }}
                    ondrop={(event) => handleDrop(event, blocks.length)}
                >
                    Drop after the last block
                </Button>
            {/if}
        </div>
    {/if}
</div>
