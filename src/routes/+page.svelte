<script lang="ts">
    import CmsEmptyState from "$lib/components/cms/CmsEmptyState.svelte";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import {
        CircleAlert,
        FileText,
        Folder,
        Package,
        Plus,
        Trash2,
    } from "$lib/icons";
    import type { PageProps } from "./$types";

    let { data }: PageProps = $props();

    const pages = $derived(data.pages ?? []);
    const reusableBlocks = $derived(data.reusableBlocks ?? []);
    const blockFolders = $derived(data.blockFolders ?? []);
    const unpublishedPages = $derived(
        pages.filter((page) => !page.is_published || page.has_unpublished_changes),
    );
    const unpublishedBlocks = $derived(
        reusableBlocks.filter(
            (block) => !block.is_published || block.has_unpublished_changes,
        ),
    );
    const deletedCount = $derived(
        (data.deletedPageCount ?? 0) + (data.deletedReusableBlockCount ?? 0),
    );
    const recentPages = $derived(
        [...pages]
            .sort(
                (a, b) =>
                    new Date(b.updated_at).getTime() -
                    new Date(a.updated_at).getTime(),
            )
            .slice(0, 5),
    );

    const displayPath = (value: string | null | undefined) =>
        value && value.trim() ? value : "/";
</script>

<svelte:head>
    <title>Dashboard</title>
</svelte:head>

<main class="space-y-8">
    <section
        class="rounded-[2rem] border border-border/80 bg-card/95 px-6 py-8 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.3)] sm:px-8"
    >
        <div class="flex flex-wrap items-start justify-between gap-5">
            <div class="space-y-3">
                <p
                    class="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground"
                >
                    Dashboard
                </p>
                <h1
                    class="max-w-3xl text-[2.4rem] font-semibold tracking-[-0.045em] text-foreground sm:text-5xl"
                >
                    Page work, content work, and cleanup in one place.
                </h1>
                <p class="max-w-2xl text-base leading-7 text-muted-foreground">
                    Start with pages, jump into reusable content, or recover
                    deleted work without hunting through sidebar sections.
                </p>
            </div>
            <div class="flex flex-wrap gap-2">
                <Button href="/content" variant="secondary" class="rounded-full">
                    <Package />
                    Content
                </Button>
                <Button href="/trash" variant="outline" class="rounded-full">
                    <Trash2 />
                    Trash
                </Button>
            </div>
        </div>
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <a
            href="/"
            class="rounded-[1.5rem] border border-border bg-card p-5 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.3)]"
        >
            <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-medium text-muted-foreground"
                    >Pages</span
                >
                <FileText class="h-4 w-4 text-muted-foreground" />
            </div>
            <p class="mt-4 text-3xl font-semibold tracking-tight text-foreground">
                {pages.length}
            </p>
            <p class="mt-1 text-sm text-muted-foreground">
                {unpublishedPages.length} need publish review
            </p>
        </a>

        <a
            href="/content"
            class="rounded-[1.5rem] border border-border bg-card p-5 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.3)]"
        >
            <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-medium text-muted-foreground"
                    >Content items</span
                >
                <Package class="h-4 w-4 text-muted-foreground" />
            </div>
            <p class="mt-4 text-3xl font-semibold tracking-tight text-foreground">
                {reusableBlocks.length}
            </p>
            <p class="mt-1 text-sm text-muted-foreground">
                {unpublishedBlocks.length} draft or changed
            </p>
        </a>

        <a
            href="/content"
            class="rounded-[1.5rem] border border-border bg-card p-5 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.3)]"
        >
            <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-medium text-muted-foreground"
                    >Folders</span
                >
                <Folder class="h-4 w-4 text-muted-foreground" />
            </div>
            <p class="mt-4 text-3xl font-semibold tracking-tight text-foreground">
                {blockFolders.length}
            </p>
            <p class="mt-1 text-sm text-muted-foreground">
                Library tree organization
            </p>
        </a>

        <a
            href="/trash"
            class="rounded-[1.5rem] border border-border bg-card p-5 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.3)]"
        >
            <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-medium text-muted-foreground"
                    >Trash</span
                >
                <Trash2 class="h-4 w-4 text-muted-foreground" />
            </div>
            <p class="mt-4 text-3xl font-semibold tracking-tight text-foreground">
                {deletedCount}
            </p>
            <p class="mt-1 text-sm text-muted-foreground">
                Recoverable deleted items
            </p>
        </a>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div
            class="rounded-[1.75rem] border border-border/80 bg-card p-5 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.3)]"
        >
            <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="space-y-2">
                    <p
                        class="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground"
                    >
                        Recent pages
                    </p>
                    <h2
                        class="text-[1.45rem] font-semibold tracking-[-0.03em] text-foreground"
                    >
                        Latest edits
                    </h2>
                </div>
            </div>

            <div class="mt-5 space-y-3">
                {#if recentPages.length === 0}
                    <CmsEmptyState
                        eyebrow="No pages"
                        title="Create a root page to begin."
                        description="Pages become site structure. After first page exists, recent edits appear here."
                    />
                {:else}
                    {#each recentPages as page (page.id)}
                        <a
                            href={`/edit/page/${page.id}`}
                            class="flex items-center gap-3 rounded-2xl border border-border bg-muted/35 px-4 py-3 transition hover:bg-muted/55"
                        >
                            <FileText class="h-4 w-4 text-muted-foreground" />
                            <span class="min-w-0 flex-1">
                                <span
                                    class="block truncate font-medium text-foreground"
                                    >{page.title}</span
                                >
                                <span
                                    class="mt-1 block truncate font-mono text-xs text-muted-foreground"
                                    >{displayPath(page.path)}</span
                                >
                            </span>
                            {#if !page.is_published || page.has_unpublished_changes}
                                <Badge
                                    class="bg-amber-500/15 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300"
                                >
                                    Draft
                                </Badge>
                            {:else}
                                <Badge variant="outline">Live</Badge>
                            {/if}
                        </a>
                    {/each}
                {/if}
            </div>
        </div>

        <div
            class="rounded-[1.75rem] border border-border/80 bg-card p-5 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.3)]"
        >
            <div class="space-y-2">
                <p
                    class="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground"
                >
                    Needs attention
                </p>
                <h2
                    class="text-[1.45rem] font-semibold tracking-[-0.03em] text-foreground"
                >
                    Drafts and cleanup
                </h2>
            </div>

            <div class="mt-5 space-y-3">
                <a
                    href="/"
                    class="flex items-center gap-3 rounded-2xl border border-border bg-muted/35 px-4 py-3"
                >
                    <CircleAlert class="h-4 w-4 text-amber-600" />
                    <span class="min-w-0 flex-1 text-sm text-muted-foreground">
                        <span class="font-semibold text-foreground"
                            >{unpublishedPages.length}</span
                        >
                        pages have unpublished changes.
                    </span>
                </a>
                <a
                    href="/content"
                    class="flex items-center gap-3 rounded-2xl border border-border bg-muted/35 px-4 py-3"
                >
                    <CircleAlert class="h-4 w-4 text-amber-600" />
                    <span class="min-w-0 flex-1 text-sm text-muted-foreground">
                        <span class="font-semibold text-foreground"
                            >{unpublishedBlocks.length}</span
                        >
                        content items are draft or changed.
                    </span>
                </a>
                <a
                    href="/trash"
                    class="flex items-center gap-3 rounded-2xl border border-border bg-muted/35 px-4 py-3"
                >
                    <Trash2 class="h-4 w-4 text-muted-foreground" />
                    <span class="min-w-0 flex-1 text-sm text-muted-foreground">
                        <span class="font-semibold text-foreground"
                            >{deletedCount}</span
                        >
                        deleted items can still be restored.
                    </span>
                </a>
            </div>

            <div class="mt-5 flex flex-wrap gap-2">
                <Button href="/content" class="rounded-full">
                    <Plus />
                    New content
                </Button>
                <Button href="/trash" variant="outline" class="rounded-full">
                    Review trash
                </Button>
            </div>
        </div>
    </section>
</main>
