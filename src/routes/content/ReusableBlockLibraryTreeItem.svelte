<script lang="ts">
    import Self from "./ReusableBlockLibraryTreeItem.svelte";
    import type { ReusableBlocksTreeNode } from "$lib/sidebar";
    import { getReusableBlockPublishState } from "$lib/reusableBlockStatus";

    type Props = {
        node: ReusableBlocksTreeNode;
        depth: number;
        closedNodes: Record<string, boolean>;
        onToggle: (id: string) => void;
        onDeleteFolder: (id: string, name: string) => void;
        onDeleteBlock: (id: string, name: string) => void;
    };

    let {
        node,
        depth,
        closedNodes,
        onToggle,
        onDeleteFolder,
        onDeleteBlock,
    }: Props = $props();

    const hasChildren = $derived(
        node.folders.length > 0 || node.blocks.length > 0,
    );
    const nodeId = $derived(node.folder?.id ?? "");
    const isOpen = $derived(node.folder ? !closedNodes[nodeId] : true);
    const getStateMeta = (
        state: "unpublished" | "published" | "draft-changes",
    ) => {
        switch (state) {
            case "draft-changes":
                return {
                    label: "Saved draft",
                    className: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
                };
            case "published":
                return {
                    label: "Published",
                    className:
                        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                };
            default:
                return {
                    label: "Unpublished",
                    className:
                        "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                };
        }
    };
</script>

{#if node.folder}
    <div class="space-y-3">
        <div
            class="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.55)]"
            style={`margin-left: ${depth * 1.1}rem`}
        >
            <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                    <span class="truncate font-semibold text-foreground"
                        >{node.folder.name}</span
                    >
                    <span
                        class="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-background"
                    >
                        Folder
                    </span>
                </div>
                <p class="mt-1 text-xs text-muted-foreground">
                    {node.folders.length} subfolder{node.folders.length === 1
                        ? ""
                        : "s"} and
                    {node.blocks.length} shared content item{node.blocks
                        .length === 1
                        ? ""
                        : "s"}
                </p>
            </div>
            <div class="flex items-center gap-1">
                <button
                    type="button"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label={`Delete ${node.folder.name}`}
                    onclick={() =>
                        onDeleteFolder(node.folder!.id, node.folder!.name)}
                >
                    <svg
                        viewBox="0 0 24 24"
                        class="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M6 6l1 14h10l1-14" />
                        <path d="M10 10v6M14 10v6" />
                    </svg>
                </button>
                {#if hasChildren}
                    <button
                        type="button"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label={isOpen
                            ? `Collapse ${node.folder.name}`
                            : `Expand ${node.folder.name}`}
                        aria-expanded={isOpen}
                        onclick={() => onToggle(node.folder!.id)}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            class={[
                                "h-4 w-4 transition-transform",
                                isOpen ? "rotate-90" : "",
                            ].join(" ")}
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <path d="m9 6 6 6-6 6" />
                        </svg>
                    </button>
                {/if}
            </div>
        </div>

        {#if isOpen}
            <div class="space-y-3">
                {#each node.folders as child (child.folder?.id)}
                    <Self
                        node={child}
                        depth={depth + 1}
                        {closedNodes}
                        {onToggle}
                        {onDeleteFolder}
                        {onDeleteBlock}
                    />
                {/each}

                {#each node.blocks as block (block.id)}
                    {@const stateMeta = getStateMeta(
                        getReusableBlockPublishState(block),
                    )}
                    <div
                        class="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-[0_12px_36px_-28px_rgba(15,23,42,0.45)]"
                        style={`margin-left: ${(depth + 1) * 1.1}rem`}
                    >
                        <a href={`/content/${block.id}`} class="min-w-0 flex-1">
                            <div class="flex items-center gap-2">
                                <span
                                    class="truncate font-medium text-foreground"
                                    >{block.name}</span
                                >
                                <span
                                    class={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${stateMeta.className}`}
                                >
                                    {stateMeta.label}
                                </span>
                            </div>
                            <div
                                class="mt-1 flex items-center gap-2 text-xs text-muted-foreground"
                            >
                                <span
                                    class="rounded-full bg-muted px-2 py-0.5 font-semibold uppercase tracking-[0.2em] text-muted-foreground"
                                >
                                    {block.block_type}
                                </span>
                                <span
                                    >Open to edit the draft and publish state.</span
                                >
                            </div>
                        </a>

                        <button
                            type="button"
                            class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive transition hover:bg-destructive/20"
                            aria-label={`Delete ${block.name}`}
                            onclick={() => onDeleteBlock(block.id, block.name)}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                class="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <path d="M3 6h18" />
                                <path d="M8 6V4h8v2" />
                                <path d="M6 6l1 14h10l1-14" />
                                <path d="M10 10v6M14 10v6" />
                            </svg>
                        </button>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
{/if}
