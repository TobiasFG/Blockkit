<script lang="ts">
    import * as Alert from "$lib/components/ui/alert/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import type { BlockType } from "$lib/blocks/registry";
    import type { BlockListLocation } from "$lib/blockContentEditor";
    import type { ReusableBlockReference } from "$lib/pageContent";
    import type { ReusableBlock } from "$lib/types";

    type Props = {
        references: ReusableBlockReference[];
        location: BlockListLocation;
        allowedTypes?: BlockType[] | null;
        reusableBlocks?: ReusableBlock[];
        title?: string;
        description?: string;
        errorKeyPrefix: string;
        errors: Record<string, string>;
        onInsert: (
            location: BlockListLocation,
            reusableBlockId: string,
            index: number,
        ) => void;
        onRemove: (location: BlockListLocation, index: number) => void;
        onMove: (
            location: BlockListLocation,
            fromIndex: number,
            toIndex: number,
        ) => void;
    };

    let {
        references,
        location,
        allowedTypes = null,
        reusableBlocks = [],
        title = "",
        description,
        errorKeyPrefix,
        errors,
        onInsert,
        onRemove,
        onMove,
    }: Props = $props();

    const insertableBlocks = $derived(
        allowedTypes?.length
            ? reusableBlocks.filter((block) =>
                  allowedTypes.includes(block.block_type),
              )
            : reusableBlocks,
    );

    const getReusableBlock = (id: string) =>
        reusableBlocks.find((block) => block.id === id) ?? null;
    const getItemError = (index: number) =>
        errors[`${errorKeyPrefix}.${index}`] ?? "";
</script>

<div class="space-y-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="space-y-1">
            {#if title}
                <h3
                    class="text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground"
                >
                    {title}
                </h3>
            {/if}
            <p class="max-w-[62ch] text-sm leading-6 text-muted-foreground">
                {description ??
                    "Insert content items from the library. Blocks cannot be created here."}
            </p>
        </div>
        <DropdownMenu.Root>
            <DropdownMenu.Trigger
                class={`${buttonVariants({ variant: "outline" })} rounded-full`}
                disabled={insertableBlocks.length === 0}
            >
                Insert content
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
                align="end"
                class="max-h-64 w-64 overflow-y-auto rounded-[1.25rem] p-2"
            >
                {#each insertableBlocks as reusableBlock (reusableBlock.id)}
                    <DropdownMenu.Item
                        onSelect={() =>
                            onInsert(
                                location,
                                reusableBlock.id,
                                references.length,
                            )}
                        class="rounded-xl px-3 py-2"
                    >
                        <span class="min-w-0 flex-1 truncate font-medium">
                            {reusableBlock.name}
                        </span>
                        <Badge
                            variant="outline"
                            class="ml-3 shrink-0 text-[10px] uppercase tracking-[0.12em]"
                        >
                            {reusableBlock.block_type}
                        </Badge>
                    </DropdownMenu.Item>
                {/each}
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    </div>

    {#if insertableBlocks.length === 0}
        <p class="text-sm text-muted-foreground">
            No content library items{allowedTypes?.length
                ? ` of type ${allowedTypes.join(", ")}`
                : ""} exist yet.
        </p>
    {/if}

    {#if references.length === 0}
        <p
            class="rounded-[1.25rem] border border-dashed border-border bg-muted/40 px-5 py-4 text-sm text-muted-foreground"
        >
            No content inserted yet.
        </p>
    {:else}
        <ul class="divide-y divide-border rounded-[1.25rem] border border-border">
            {#each references as reference, index (reference.id)}
                {@const reusableBlock = getReusableBlock(
                    reference.reusableBlockId,
                )}
                <li class="space-y-2 px-4 py-3">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div class="flex min-w-0 flex-wrap items-center gap-2">
                            {#if reusableBlock}
                                <a
                                    href={`/content/${reusableBlock.id}`}
                                    class="truncate font-medium text-foreground underline decoration-border underline-offset-4"
                                >
                                    {reusableBlock.name}
                                </a>
                                <Badge
                                    variant="outline"
                                    class="text-[10px] uppercase tracking-[0.12em]"
                                >
                                    {reusableBlock.block_type}
                                </Badge>
                            {:else}
                                <span class="font-medium text-foreground"
                                    >Missing content item</span
                                >
                            {/if}
                            <span class="text-xs text-muted-foreground"
                                >{index + 1} of {references.length}</span
                            >
                        </div>
                        <div class="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                class="rounded-full"
                                disabled={index === 0}
                                onclick={() =>
                                    onMove(location, index, index - 1)}
                            >
                                Move up
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                class="rounded-full"
                                disabled={index === references.length - 1}
                                onclick={() =>
                                    onMove(location, index, index + 1)}
                            >
                                Move down
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                class="rounded-full"
                                onclick={() => onRemove(location, index)}
                            >
                                Remove
                            </Button>
                        </div>
                    </div>
                    {#if getItemError(index)}
                        <Alert.Root variant="destructive">
                            <Alert.Description
                                >{getItemError(index)}</Alert.Description
                            >
                        </Alert.Root>
                    {/if}
                </li>
            {/each}
        </ul>
    {/if}
</div>
