<script lang="ts">
    import Self from "$lib/components/cms/BlockListEditor.svelte";
    import * as Alert from "$lib/components/ui/alert/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { Textarea } from "$lib/components/ui/textarea/index.js";
    import {
        getBlockDefinition,
        listBlockDefinitions,
        type BlockFieldDefinition,
    } from "$lib/blocks/registry";
    import type {
        BlockListLocation,
        BlockPath,
        PageContentValidationErrors,
    } from "$lib/pageContentEditor";
    import {
        isReusableBlockReference,
        type BlockInstance,
        type BlockValue,
        type PageBlockNode,
    } from "$lib/pageContent";
    import type { ReusableBlock } from "$lib/types";
    import { parseReusableBlockDragData } from "$lib/sidebar/reusableBlockInsertion";

    type Props = {
        blocks: PageBlockNode[];
        location: BlockListLocation;
        allowedTypes?: string[] | null;
        pathPrefix?: BlockPath;
        title?: string;
        description?: string;
        errors: PageContentValidationErrors;
        draggingPath: string | null;
        canDragBlocks?: boolean;
        onAddBlock: (location: BlockListLocation, type: string) => void;
        onInsertReusableBlockReference?: (
            reusableBlockId: string,
            index: number,
        ) => void;
        onRemoveBlock: (path: BlockPath) => void;
        onMoveBlock: (path: BlockPath, toIndex: number) => void;
        onUpdateField: (
            path: BlockPath,
            fieldKey: string,
            value: BlockValue | undefined,
        ) => void;
        onStartDrag: (path: BlockPath) => void;
        onEndDrag: () => void;
        reusableBlocks?: ReusableBlock[];
        allowInlineBlockCreation?: boolean;
    };

    let {
        blocks,
        location,
        allowedTypes = null,
        pathPrefix = [],
        title = "",
        description,
        errors,
        draggingPath,
        canDragBlocks = false,
        onAddBlock,
        onInsertReusableBlockReference,
        onRemoveBlock,
        onMoveBlock,
        onUpdateField,
        onStartDrag,
        onEndDrag,
        reusableBlocks = [],
        allowInlineBlockCreation = true,
    }: Props = $props();

    const getFieldError = (path: BlockPath, fieldKey: string) =>
        errors[`${path.join(".")}:${fieldKey}`] ?? "";
    const getBlockError = (path: BlockPath) => errors[path.join(".")] ?? "";
    const getPathKey = (path: BlockPath) => path.join(".");

    const isTextareaField = (field: BlockFieldDefinition) =>
        field.type === "string" && field.key.toLowerCase().includes("body");

    const allowedDefinitions = $derived.by(() => {
        if (!allowedTypes?.length) {
            return listBlockDefinitions();
        }

        return allowedTypes
            .map((type) => getBlockDefinition(type))
            .filter(
                (definition): definition is NonNullable<typeof definition> =>
                    Boolean(definition),
            );
    });

    const isRootList = $derived(
        location.parentPath === null && location.fieldKey === null,
    );
    const canInsertReusableBlocks = $derived(
        isRootList && reusableBlocks.length > 0,
    );
    const showInlineBlockCreate = $derived(
        allowInlineBlockCreation || !isRootList,
    );
    let hoveredDropTarget = $state<string | null>(null);

    const fieldClass = "h-11 rounded-2xl";

    const tertiaryButtonClass = "rounded-full";

    const captionClass =
        "text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground";

    const parseStringValue = (
        value: string,
        field: BlockFieldDefinition,
    ): BlockValue | undefined => {
        if (field.type === "number") {
            const trimmed = value.trim();
            if (!trimmed) return undefined;
            const parsed = Number(trimmed);
            return Number.isFinite(parsed) ? parsed : value;
        }

        if (field.type === "date") {
            return value;
        }

        return value;
    };

    const getNestedBlocks = (value: BlockValue | undefined): BlockInstance[] =>
        Array.isArray(value) ? value : [];

    const getReusableBlock = (id: string) =>
        reusableBlocks.find((block) => block.id === id) ?? null;
    const getContentHref = (id: string) => `/content/${id}`;

    const insertReusableBlockReference = (
        reusableBlockId: string,
        index: number,
    ) => {
        onInsertReusableBlockReference?.(reusableBlockId, index);
    };

    const handleDrop = (event: DragEvent, targetIndex: number) => {
        event.preventDefault();
        hoveredDropTarget = null;

        const reusablePayload = parseReusableBlockDragData(event);
        if (reusablePayload) {
            if (!isRootList) return;
            insertReusableBlockReference(
                reusablePayload.reusableBlockId,
                targetIndex,
            );
            onEndDrag();
            return;
        }

        const raw = event.dataTransfer?.getData("text/plain") ?? draggingPath;
        if (!raw) return;

        const fromPath = raw
            .split(".")
            .filter(Boolean)
            .map((segment) => Number(segment));

        if (fromPath.length !== pathPrefix.length + 1) return;
        if (fromPath.slice(0, -1).join(".") !== pathPrefix.join(".")) return;

        onMoveBlock(fromPath, targetIndex);
        onEndDrag();
    };

    const handleBlockDragStart = (event: DragEvent, path: BlockPath) => {
        event.dataTransfer?.setData("text/plain", path.join("."));
        event.dataTransfer?.setDragImage(
            event.currentTarget as Element,
            24,
            24,
        );
        onStartDrag(path);
    };
</script>

<div class="space-y-4">
    {#if title || description || showInlineBlockCreate}
        <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="space-y-1">
                {#if title}
                    <h3
                        class="text-[1.2rem] font-semibold tracking-[-0.025em] text-foreground"
                    >
                        {title}
                    </h3>
                {/if}
                {#if description}
                    <p
                        class="max-w-[62ch] text-base leading-7 text-muted-foreground"
                    >
                        {description}
                    </p>
                {/if}
            </div>
            <div class="flex items-center gap-2">
                {#if showInlineBlockCreate}
                    <select
                        class="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 min-w-[11rem] rounded-2xl border px-4 py-2.5 pr-10 text-sm outline-none focus-visible:ring-3"
                        onchange={(event) => {
                            const select =
                                event.currentTarget as HTMLSelectElement;
                            if (!select.value) return;
                            onAddBlock(location, select.value);
                            select.value = "";
                        }}
                    >
                        <option value="">Add block…</option>
                        {#each allowedDefinitions as definition}
                            <option value={definition.type}
                                >{definition.label}</option
                            >
                        {/each}
                    </select>
                {/if}
            </div>
        </div>
    {/if}

    {#if blocks.length === 0}
        <Button
            type="button"
            variant="outline"
            class={[
                "rounded-[1.5rem] border border-dashed px-5 py-6 text-left text-sm",
                canDragBlocks
                    ? "border-border bg-muted/60 text-muted-foreground"
                    : "border-border bg-muted/40 text-muted-foreground",
            ].join(" ")}
            aria-label="Drop block before the empty list"
            ondragover={(event) => canDragBlocks && event.preventDefault()}
            ondrop={(event) => canDragBlocks && handleDrop(event, 0)}
        >
            <div class="font-semibold text-foreground">No content yet.</div>
            {#if canDragBlocks}
                <span class="mt-1 block text-muted-foreground"
                    >Drag content here to start page.</span
                >
            {:else if !showInlineBlockCreate}
                <span class="mt-1 block text-muted-foreground"
                    >Choose content from library to start page.</span
                >
            {:else}
                <span class="mt-1 block text-muted-foreground"
                    >Start with a block type, then build the page from there.</span
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
                        hoveredDropTarget === `${pathPrefix.join(".")}:0`
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-muted/60 text-muted-foreground",
                    ].join(" ")}
                    aria-label="Drop block before the first block"
                    ondragover={(event) => {
                        event.preventDefault();
                        hoveredDropTarget = `${pathPrefix.join(".")}:0`;
                    }}
                    ondragenter={(event) => {
                        event.preventDefault();
                        hoveredDropTarget = `${pathPrefix.join(".")}:0`;
                    }}
                    ondrop={(event) => handleDrop(event, 0)}
                >
                    Drop before the first block
                </Button>
            {/if}

            {#each blocks as block, index (block.id)}
                {@const path = [...pathPrefix, index]}
                {@const definition = isReusableBlockReference(block)
                    ? null
                    : getBlockDefinition(block.type)}
                {@const reusableBlock = isReusableBlockReference(block)
                    ? getReusableBlock(block.reusableBlockId)
                    : null}

                {#if canDragBlocks && draggingPath}
                    <Button
                        type="button"
                        variant="outline"
                        class={[
                            "rounded-full border-dashed px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.22em]",
                            hoveredDropTarget ===
                            `${pathPrefix.join(".")}:${index + 1}`
                                ? "border-foreground bg-foreground text-background"
                                : "border-border bg-muted/60 text-muted-foreground",
                        ].join(" ")}
                        aria-label={`Drop block after ${index + 1}`}
                        ondragover={(event) => {
                            event.preventDefault();
                            hoveredDropTarget = `${pathPrefix.join(".")}:${index + 1}`;
                        }}
                        ondragenter={(event) => {
                            event.preventDefault();
                            hoveredDropTarget = `${pathPrefix.join(".")}:${index + 1}`;
                        }}
                        ondrop={(event) => handleDrop(event, index + 1)}
                    >
                        Drop after this block
                    </Button>
                {/if}

                <div
                    class={[
                        "px-1 py-5",
                        draggingPath === getPathKey(path)
                            ? "rounded-[1.25rem] bg-amber-500/10 ring-2 ring-amber-500/30"
                            : "",
                    ].join(" ")}
                    role="listitem"
                    draggable={canDragBlocks}
                    ondragstart={canDragBlocks
                        ? (event) => handleBlockDragStart(event, path)
                        : undefined}
                    ondragend={() => {
                        hoveredDropTarget = null;
                        onEndDrag();
                    }}
                >
                    <div
                        class="flex flex-wrap items-start justify-between gap-3"
                    >
                        <div class="space-y-1">
                            <div class="flex flex-wrap items-center gap-2">
                                <h4
                                    class="text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground"
                                >
                                    {#if isReusableBlockReference(block)}
                                        {#if reusableBlock}
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
                                    {:else}
                                        {definition?.label ?? block.type}
                                    {/if}
                                </h4>
                                <Badge
                                    variant="outline"
                                    class="font-mono text-[10px] uppercase tracking-[0.12em]"
                                >
                                    {#if isReusableBlockReference(block)}
                                        content
                                    {:else}
                                        {block.type}
                                    {/if}
                                </Badge>
                                {#if isReusableBlockReference(block) && reusableBlock}
                                    <Badge
                                        variant="secondary"
                                        class="text-[10px] font-medium uppercase tracking-[0.12em]"
                                    >
                                        {reusableBlock.block_type}
                                    </Badge>
                                {/if}
                                {#if canDragBlocks && draggingPath === getPathKey(path)}
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
                                            onMoveBlock(path, index - 1)}
                                        disabled={index === 0}
                                        class="rounded-xl px-3 py-2"
                                    >
                                        Move up
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                        onSelect={() =>
                                            onMoveBlock(path, index + 1)}
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
                                                {#each reusableBlocks as reusableBlock}
                                                    <DropdownMenu.Item
                                                        onSelect={() =>
                                                            insertReusableBlockReference(
                                                                reusableBlock.id,
                                                                index,
                                                            )}
                                                        class="rounded-xl px-3 py-2"
                                                    >
                                                        <span
                                                            class="min-w-0 flex-1 truncate font-medium"
                                                        >
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
                                            </DropdownMenu.SubContent>
                                        </DropdownMenu.Sub>
                                    {/if}
                                    <DropdownMenu.Item
                                        variant="destructive"
                                        onSelect={() => onRemoveBlock(path)}
                                        class="rounded-xl px-3 py-2"
                                    >
                                        Remove block
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                        </div>
                    </div>

                    {#if getBlockError(path)}
                        <Alert.Root class="mt-4" variant="destructive">
                            <Alert.Description
                                >{getBlockError(path)}</Alert.Description
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
                    {:else if definition}
                        <div class="mt-4 space-y-4">
                            {#each definition.fields as field (field.key)}
                                {@const nestedBlocks = getNestedBlocks(
                                    block.fields[field.key],
                                )}
                                <div class="space-y-2">
                                    <Label for={`${block.id}-${field.key}`}
                                        >{field.label}</Label
                                    >
                                    {#if field.type === "string" && isTextareaField(field)}
                                        <Textarea
                                            id={`${block.id}-${field.key}`}
                                            rows={4}
                                            value={String(
                                                block.fields[field.key] ?? "",
                                            )}
                                            class="min-h-28 rounded-2xl"
                                            oninput={(event) =>
                                                onUpdateField(
                                                    path,
                                                    field.key,
                                                    parseStringValue(
                                                        (
                                                            event.currentTarget as HTMLTextAreaElement
                                                        ).value,
                                                        field,
                                                    ),
                                                )}
                                        />
                                    {:else if field.type === "string" || field.type === "date" || field.type === "number"}
                                        <Input
                                            id={`${block.id}-${field.key}`}
                                            type={field.type === "number"
                                                ? "number"
                                                : field.type === "date"
                                                  ? "date"
                                                  : "text"}
                                            value={String(
                                                block.fields[field.key] ?? "",
                                            )}
                                            class={fieldClass}
                                            oninput={(event) =>
                                                onUpdateField(
                                                    path,
                                                    field.key,
                                                    parseStringValue(
                                                        (
                                                            event.currentTarget as HTMLInputElement
                                                        ).value,
                                                        field,
                                                    ),
                                                )}
                                        />
                                    {:else if field.type === "boolean"}
                                        <label
                                            for={`${block.id}-${field.key}`}
                                            class="flex items-start gap-3 rounded-2xl bg-muted/40 px-4 py-3 text-sm text-foreground"
                                        >
                                            <input
                                                id={`${block.id}-${field.key}`}
                                                type="checkbox"
                                                checked={Boolean(
                                                    block.fields[field.key],
                                                )}
                                                class="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-ring"
                                                onchange={(event) =>
                                                    onUpdateField(
                                                        path,
                                                        field.key,
                                                        (
                                                            event.currentTarget as HTMLInputElement
                                                        ).checked,
                                                    )}
                                            />
                                            <span
                                                class="block text-sm font-medium text-foreground"
                                                >{field.label}</span
                                            >
                                        </label>
                                    {:else if field.type === "blocks"}
                                        <div
                                            class="border-l border-border pl-4"
                                        >
                                            <Self
                                                blocks={nestedBlocks}
                                                location={{
                                                    parentPath: path,
                                                    fieldKey: field.key,
                                                }}
                                                allowedTypes={field.blocks
                                                    ?.allowedTypes ?? null}
                                                pathPrefix={path}
                                                title={field.label}
                                                description="Nested content stays inside this parent block."
                                                {errors}
                                                {draggingPath}
                                                {canDragBlocks}
                                                {onAddBlock}
                                                {onInsertReusableBlockReference}
                                                {onRemoveBlock}
                                                {onMoveBlock}
                                                {onUpdateField}
                                                {onStartDrag}
                                                {onEndDrag}
                                                {reusableBlocks}
                                            />
                                        </div>
                                    {/if}
                                    {#if getFieldError(path, field.key)}
                                        <p class="text-sm text-red-700">
                                            {getFieldError(path, field.key)}
                                        </p>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <Alert.Root class="mt-4" variant="destructive">
                            <Alert.Description
                                >Unknown block type.</Alert.Description
                            >
                        </Alert.Root>
                    {/if}
                </div>
            {/each}

            {#if canDragBlocks && draggingPath}
                <Button
                    type="button"
                    variant="outline"
                    class={[
                        "rounded-full border-dashed px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.22em]",
                        hoveredDropTarget ===
                        `${pathPrefix.join(".")}:${blocks.length}`
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-muted/60 text-muted-foreground",
                    ].join(" ")}
                    aria-label="Drop block after the last block"
                    ondragover={(event) => {
                        event.preventDefault();
                        hoveredDropTarget = `${pathPrefix.join(".")}:${blocks.length}`;
                    }}
                    ondragenter={(event) => {
                        event.preventDefault();
                        hoveredDropTarget = `${pathPrefix.join(".")}:${blocks.length}`;
                    }}
                    ondrop={(event) => handleDrop(event, blocks.length)}
                >
                    Drop after the last block
                </Button>
            {/if}
        </div>
    {/if}
</div>
