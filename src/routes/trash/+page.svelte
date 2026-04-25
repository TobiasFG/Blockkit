<script lang="ts">
    import { browser } from "$app/environment";
    import { applyAction, enhance } from "$app/forms";
    import { getToastState } from "$lib/toasts/toastState.svelte";
    import { pagesStore } from "$lib/client/pagesStore";
    import { reusableBlocksStore } from "$lib/client/reusableBlocksStore";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import type { Page, ReusableBlock } from "$lib/types";
    import type { PageProps } from "./$types";

    let { data }: PageProps = $props();

    let restoringPageId = $state<string | null>(null);
    let restoringBlockId = $state<string | null>(null);
    let pageParentSelections = $state<Record<string, string>>({});

    const toastState = getToastState();
    const activePages = $derived(data.pages ?? []);
    const deletedPages = $derived(data.deletedPages ?? []);
    const deletedReusableBlocks = $derived(data.deletedReusableBlocks ?? []);

    const formatDate = (value: string | null | undefined) =>
        value
            ? new Intl.DateTimeFormat("en", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
              }).format(new Date(value))
            : "Unknown";

    const displayPath = (value: string | null | undefined) =>
        value && value.trim() ? value : "/";
    const parentOptions = (pageId: string) =>
        activePages.filter((page) => page.id !== pageId);

    $effect(() => {
        if (browser) {
            pagesStore.set(activePages);
            reusableBlocksStore.set(data.reusableBlocks ?? []);
        }

        for (const page of deletedPages) {
            if (pageParentSelections[page.id] !== undefined) continue;
            pageParentSelections = {
                ...pageParentSelections,
                [page.id]: page.parent_page_id ?? "",
            };
        }
    });
</script>

<svelte:head>
    <title>Trash</title>
</svelte:head>

<main class="space-y-8">
    <section
        class="rounded-[2rem] border border-border/80 bg-card/95 px-6 py-8 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.3)] sm:px-8"
    >
        <p
            class="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground"
        >
            Trash
        </p>
        <h1
            class="mt-2 text-[2.4rem] font-semibold tracking-[-0.045em] text-foreground sm:text-5xl"
        >
            Deleted work stays recoverable.
        </h1>
        <p class="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            Pages and content moved here stay out of normal CMS lists until
            restored. Deleted content does not auto-reinsert into pages it was
            removed from.
        </p>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div
            class="rounded-[1.75rem] border border-border/80 bg-card p-5 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.3)]"
        >
            <div class="space-y-2 border-b border-border pb-4">
                <p
                    class="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground"
                >
                    Pages
                </p>
                <h2
                    class="text-[1.45rem] font-semibold tracking-[-0.03em] text-foreground"
                >
                    Deleted pages
                </h2>
                <p class="text-sm leading-6 text-muted-foreground">
                    Pages with child pages still cannot be deleted. Restoring
                    can target a new parent.
                </p>
            </div>

            <div class="mt-5 space-y-4">
                {#if deletedPages.length === 0}
                    <div
                        class="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground"
                    >
                        No deleted pages.
                    </div>
                {:else}
                    {#each deletedPages as page (page.id)}
                        <div
                            class="rounded-2xl border border-border bg-muted/35 p-4"
                        >
                            <div
                                class="flex flex-wrap items-start justify-between gap-3"
                            >
                                <div class="space-y-1">
                                    <div
                                        class="flex flex-wrap items-center gap-2"
                                    >
                                        <h3
                                            class="text-lg font-semibold text-foreground"
                                        >
                                            {page.title}
                                        </h3>
                                        <Badge
                                            variant="outline"
                                            class="uppercase tracking-[0.18em]"
                                        >
                                            Page
                                        </Badge>
                                    </div>
                                    <div
                                        class="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground"
                                    >
                                        <span
                                            class="font-mono text-[12px] text-foreground"
                                            >{displayPath(page.path)}</span
                                        >
                                        <span
                                            >Deleted {formatDate(
                                                page.deleted_at,
                                            )}</span
                                        >
                                    </div>
                                </div>
                                <span
                                    class="text-sm font-medium text-muted-foreground"
                                    >Editor unavailable while trashed</span
                                >
                            </div>

                            <form
                                method="POST"
                                action="?/restorePage"
                                class="mt-4 space-y-3"
                                use:enhance={() => {
                                    restoringPageId = page.id;

                                    return async ({ result, update }) => {
                                        restoringPageId = null;

                                        if (
                                            result.type === "success" &&
                                            result.data
                                        ) {
                                            toastState.success(
                                                "Page restored.",
                                            );
                                            pagesStore.set(
                                                (result.data.pages as Page[]) ??
                                                    [],
                                            );
                                        } else if (result.type === "failure") {
                                            toastState.error(
                                                `Failed to restore page: ${result.data?.error ?? "Unknown error"}`,
                                            );
                                        }

                                        await applyAction(result);
                                        await update({
                                            reset: false,
                                            invalidateAll: false,
                                        });
                                    };
                                }}
                            >
                                <input
                                    type="hidden"
                                    name="pageId"
                                    value={page.id}
                                />
                                <div class="space-y-1">
                                    <Label for={`parent-${page.id}`}
                                        >Restore under parent</Label
                                    >
                                    <select
                                        id={`parent-${page.id}`}
                                        name="parentPageId"
                                        bind:value={
                                            pageParentSelections[page.id]
                                        }
                                        class="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-11 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus-visible:ring-3"
                                    >
                                        <option value="" disabled
                                            >Select parent page</option
                                        >
                                        {#each parentOptions(page.id) as parent (parent.id)}
                                            <option value={parent.id}
                                                >{parent.title} ({displayPath(
                                                    parent.path,
                                                )})</option
                                            >
                                        {/each}
                                    </select>
                                </div>
                                <Button
                                    type="submit"
                                    class="h-11 rounded-full"
                                    disabled={restoringPageId === page.id ||
                                        !pageParentSelections[page.id]}
                                >
                                    {restoringPageId === page.id
                                        ? "Restoring..."
                                        : "Restore page"}
                                </Button>
                            </form>
                        </div>
                    {/each}
                {/if}
            </div>
        </div>

        <div
            class="rounded-[1.75rem] border border-border/80 bg-card p-5 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.3)]"
        >
            <div class="space-y-2 border-b border-border pb-4">
                <p
                    class="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground"
                >
                    Content
                </p>
                <h2
                    class="text-[1.45rem] font-semibold tracking-[-0.03em] text-foreground"
                >
                    Deleted content
                </h2>
                <p class="text-sm leading-6 text-muted-foreground">
                    Restoring content makes item available again, but does not
                    reinsert removed page references.
                </p>
            </div>

            <div class="mt-5 space-y-4">
                {#if deletedReusableBlocks.length === 0}
                    <div
                        class="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground"
                    >
                        No deleted content.
                    </div>
                {:else}
                    {#each deletedReusableBlocks as block (block.id)}
                        <div
                            class="rounded-2xl border border-border bg-muted/35 p-4"
                        >
                            <div class="space-y-1">
                                <div class="flex flex-wrap items-center gap-2">
                                    <h3
                                        class="text-lg font-semibold text-foreground"
                                    >
                                        {block.name}
                                    </h3>
                                    <Badge
                                        class="bg-amber-500/15 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300"
                                    >
                                        {block.block_type}
                                    </Badge>
                                </div>
                                <div
                                    class="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground"
                                >
                                    <span
                                        >Deleted {formatDate(
                                            block.deleted_at,
                                        )}</span
                                    >
                                    <span
                                        >{block.is_published
                                            ? "Had published version"
                                            : "Draft only"}</span
                                    >
                                </div>
                            </div>

                            <form
                                method="POST"
                                action="?/restoreReusableBlock"
                                class="mt-4"
                                use:enhance={() => {
                                    restoringBlockId = block.id;

                                    return async ({ result, update }) => {
                                        restoringBlockId = null;

                                        if (
                                            result.type === "success" &&
                                            result.data
                                        ) {
                                            toastState.success(
                                                "Content restored. Removed page references stay removed.",
                                            );
                                            reusableBlocksStore.set(
                                                (result.data
                                                    .reusableBlocks as ReusableBlock[]) ??
                                                    [],
                                            );
                                        } else if (result.type === "failure") {
                                            toastState.error(
                                                `Failed to restore content: ${result.data?.error ?? "Unknown error"}`,
                                            );
                                        }

                                        await applyAction(result);
                                        await update({
                                            reset: false,
                                            invalidateAll: false,
                                        });
                                    };
                                }}
                            >
                                <input
                                    type="hidden"
                                    name="id"
                                    value={block.id}
                                />
                                <Button
                                    type="submit"
                                    class="h-11 rounded-full"
                                    disabled={restoringBlockId === block.id}
                                >
                                    {restoringBlockId === block.id
                                        ? "Restoring..."
                                        : "Restore content"}
                                </Button>
                            </form>
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    </section>
</main>
