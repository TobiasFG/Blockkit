<script lang="ts">
    import { browser } from "$app/environment";
    import { applyAction, enhance } from "$app/forms";
    import { getToastState } from "$lib/Toasts/ToastState.svelte";
    import { pagesStore } from "$lib/client/pagesStore";
    import { reusableBlocksStore } from "$lib/client/reusableBlocksStore";
    import CmsEmptyState from "$lib/components/cms/CmsEmptyState.svelte";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { FileText, Filter, Package, RotateCcw, Trash2 } from "$lib/icons";
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
    const deletedTotal = $derived(
        deletedPages.length + deletedReusableBlocks.length,
    );

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
    const defaultParentSelection = (page: Page) => {
        const options = parentOptions(page.id);
        if (
            page.parent_page_id &&
            options.some((parent) => parent.id === page.parent_page_id)
        ) {
            return page.parent_page_id;
        }

        return options[0]?.id ?? "";
    };

    $effect(() => {
        if (browser) {
            pagesStore.set(activePages);
            reusableBlocksStore.set(data.reusableBlocks ?? []);
        }

        for (const page of deletedPages) {
            if (pageParentSelections[page.id] !== undefined) continue;
            pageParentSelections = {
                ...pageParentSelections,
                [page.id]: defaultParentSelection(page),
            };
        }
    });
</script>

<svelte:head>
    <title>Trash</title>
</svelte:head>

<main class="space-y-6">
    <section class="flex flex-wrap items-start justify-between gap-4">
        <div>
            <h1
                class="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
            >
                Trash
            </h1>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Review and restore deleted pages and reusable content.
            </p>
        </div>
        <div
            class="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm"
        >
            <span class="font-semibold text-foreground">{deletedTotal}</span>
            recoverable items
        </div>
    </section>

    <section
        class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200"
    >
        <span class="flex items-center gap-2">
            <RotateCcw class="size-4" />
            Deleted work stays outside normal CMS lists until restored.
        </span>
        <a href="/content" class="font-medium underline-offset-4 hover:underline">
            Content library
        </a>
    </section>

    <section class="grid gap-4 xl:grid-cols-2">
        <div class="rounded-lg border border-border bg-card shadow-sm">
            <div
                class="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"
            >
                <div>
                    <h2 class="text-base font-semibold text-foreground">
                        Deleted pages ({deletedPages.length})
                    </h2>
                    <p class="mt-1 text-sm text-muted-foreground">
                        Restore pages under active parent page.
                    </p>
                </div>
                <Button variant="outline" size="icon-sm" aria-label="Filter pages">
                    <Filter class="size-4" />
                </Button>
            </div>

            <div>
                {#if deletedPages.length === 0}
                    <div class="p-5">
                        <CmsEmptyState
                            eyebrow="Clean"
                            title="No deleted pages."
                            description="Pages moved to trash appear here with restore controls and parent selection."
                        />
                    </div>
                {:else}
                    <div class="divide-y divide-border">
                        {#each deletedPages as page (page.id)}
                            <form
                                method="POST"
                                action="?/restorePage"
                                class="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_12rem_auto] lg:items-center"
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
                                <div class="flex min-w-0 items-start gap-3">
                                    <span
                                        class="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
                                    >
                                        <FileText class="size-4" />
                                    </span>
                                    <span class="min-w-0">
                                        <span
                                            class="block truncate text-sm font-semibold text-foreground"
                                            >{page.title}</span
                                        >
                                        <span
                                            class="mt-1 block truncate font-mono text-xs text-muted-foreground"
                                            >{displayPath(page.path)}</span
                                        >
                                        <span
                                            class="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
                                        >
                                            <Badge
                                                class="bg-amber-500/15 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300"
                                                >Page</Badge
                                            >
                                            Deleted {formatDate(page.deleted_at)}
                                        </span>
                                    </span>
                                </div>
                                <div class="space-y-1">
                                    <Label
                                        for={`parent-${page.id}`}
                                        class="text-xs"
                                        >Parent</Label
                                    >
                                    <select
                                        id={`parent-${page.id}`}
                                        name="parentPageId"
                                        aria-label="Restore under parent"
                                        bind:value={
                                            pageParentSelections[page.id]
                                        }
                                        class="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-3"
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
                                    size="sm"
                                    variant="outline"
                                    class="w-fit rounded-lg"
                                    disabled={restoringPageId === page.id ||
                                        !pageParentSelections[page.id]}
                                >
                                    {restoringPageId === page.id
                                        ? "Restoring..."
                                        : "Restore page"}
                                </Button>
                            </form>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        <div class="rounded-lg border border-border bg-card shadow-sm">
            <div
                class="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"
            >
                <div>
                    <h2 class="text-base font-semibold text-foreground">
                        Deleted content ({deletedReusableBlocks.length})
                    </h2>
                    <p class="mt-1 text-sm text-muted-foreground">
                        Restored content returns to library without page refs.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Filter content"
                >
                    <Filter class="size-4" />
                </Button>
            </div>

            <div>
                {#if deletedReusableBlocks.length === 0}
                    <div class="p-5">
                        <CmsEmptyState
                            eyebrow="Clean"
                            title="No deleted content."
                            description="Deleted content items appear here. Restoring does not reinsert removed page references."
                        />
                    </div>
                {:else}
                    <div class="divide-y divide-border">
                        {#each deletedReusableBlocks as block (block.id)}
                            <form
                                method="POST"
                                action="?/restoreReusableBlock"
                                class="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
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
                                <div class="flex min-w-0 items-start gap-3">
                                    <span
                                        class="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
                                    >
                                        <Package class="size-4" />
                                    </span>
                                    <span class="min-w-0">
                                        <span
                                            class="block truncate text-sm font-semibold text-foreground"
                                            >{block.name}</span
                                        >
                                        <span
                                            class="mt-1 block text-xs text-muted-foreground"
                                        >
                                            Deleted {formatDate(block.deleted_at)}
                                        </span>
                                        <span
                                            class="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
                                        >
                                            <Badge
                                                class="bg-emerald-500/15 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300"
                                            >
                                                {block.block_type}
                                            </Badge>
                                            {block.is_published
                                                ? "Had published version"
                                                : "Draft only"}
                                        </span>
                                    </span>
                                </div>
                                <Button
                                    type="submit"
                                    size="sm"
                                    variant="outline"
                                    class="w-fit rounded-lg"
                                    disabled={restoringBlockId === block.id}
                                >
                                    {restoringBlockId === block.id
                                        ? "Restoring..."
                                        : "Restore content"}
                                </Button>
                            </form>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </section>

    <section class="grid gap-4 xl:grid-cols-2">
        <div class="rounded-lg border border-border bg-card p-8 text-center shadow-sm">
            <span
                class="mx-auto flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
                <Trash2 class="size-7" />
            </span>
            <h2 class="mt-5 text-base font-semibold text-foreground">
                No more deleted pages
            </h2>
            <p class="mt-2 text-sm text-muted-foreground">
                When pages are deleted, restore controls appear above.
            </p>
        </div>
        <div class="rounded-lg border border-border bg-card p-8 text-center shadow-sm">
            <span
                class="mx-auto flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
                <Trash2 class="size-7" />
            </span>
            <h2 class="mt-5 text-base font-semibold text-foreground">
                No more deleted content
            </h2>
            <p class="mt-2 text-sm text-muted-foreground">
                Restored content stays out of pages until reinserted.
            </p>
        </div>
    </section>
</main>
