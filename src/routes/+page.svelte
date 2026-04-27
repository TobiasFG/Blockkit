<script lang="ts">
    import CmsEmptyState from "$lib/components/cms/CmsEmptyState.svelte";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import {
        CircleAlert,
        ExternalLink,
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
    const publishedPages = $derived(
        pages.filter((page) => page.is_published && !page.has_unpublished_changes),
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
    const statCards = $derived([
        {
            label: "Pages",
            value: pages.length,
            note: `${unpublishedPages.length} need review`,
            href: "/",
            icon: FileText,
        },
        {
            label: "Content items",
            value: reusableBlocks.length,
            note: `${unpublishedBlocks.length} draft or changed`,
            href: "/content",
            icon: Package,
        },
        {
            label: "Published pages",
            value: publishedPages.length,
            note: "Live without draft changes",
            href: "/",
            icon: ExternalLink,
        },
        {
            label: "Recoverable",
            value: deletedCount,
            note: "Items in trash",
            href: "/trash",
            icon: Trash2,
        },
    ]);
    const attentionItems = $derived([
        {
            title: `${unpublishedPages.length} pages have unpublished changes`,
            detail: "Review and publish to make them live.",
            href: "/",
            action: "Review pages",
            icon: CircleAlert,
        },
        {
            title: `${unpublishedBlocks.length} content items need review`,
            detail: "Publish shared content before live pages reference it.",
            href: "/content",
            action: "Review content",
            icon: Package,
        },
        {
            title: `${deletedCount} items are recoverable`,
            detail: "Restore deleted work or leave it out of active lists.",
            href: "/trash",
            action: "Open trash",
            icon: Trash2,
        },
    ]);
    const quickActions = [
        {
            label: "New content",
            detail: "Add content item",
            href: "/content",
            icon: Plus,
        },
        {
            label: "Content library",
            detail: "Manage shared blocks",
            href: "/content",
            icon: Folder,
        },
        {
            label: "Review trash",
            detail: "Restore deleted work",
            href: "/trash",
            icon: Trash2,
        },
    ];

    const displayPath = (value: string | null | undefined) =>
        value && value.trim() ? value : "/";

    const formatUpdated = (value: string) =>
        new Intl.DateTimeFormat("en", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(value));
</script>

<svelte:head>
    <title>Dashboard</title>
</svelte:head>

<main class="space-y-6">
    <section class="flex flex-wrap items-start justify-between gap-4">
        <div>
            <h1
                class="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
            >
                Dashboard
            </h1>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Monitor pages, reusable content, and recovery work from one
                operational view.
            </p>
        </div>
        <div class="flex flex-wrap gap-2">
            <Button href="/" variant="outline" class="rounded-lg">
                View site
                <ExternalLink />
            </Button>
            <Button href="/content" class="rounded-lg">
                <Plus />
                New
            </Button>
        </div>
    </section>

    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {#each statCards as stat (stat.label)}
            <a
                href={stat.href}
                class="rounded-lg border border-border bg-card p-5 shadow-sm transition hover:bg-muted/35"
            >
                <span
                    class="inline-flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground"
                >
                    <stat.icon class="size-4" />
                </span>
                <p class="mt-5 text-3xl font-semibold tracking-tight text-foreground">
                    {stat.value}
                </p>
                <p class="mt-1 text-sm font-medium text-foreground">
                    {stat.label}
                </p>
                <p class="mt-3 text-xs text-muted-foreground">{stat.note}</p>
            </a>
        {/each}
    </section>

    <section class="grid gap-4 xl:grid-cols-[1fr_17rem]">
        <div class="rounded-lg border border-border bg-card shadow-sm">
            <div
                class="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"
            >
                <div>
                    <h2 class="text-base font-semibold text-foreground">
                        Recent page edits
                    </h2>
                    <p class="mt-1 text-sm text-muted-foreground">
                        Latest changed pages by editor timestamp.
                    </p>
                </div>
                <Button href="/" variant="outline" size="sm">View all</Button>
            </div>

            {#if recentPages.length === 0}
                <div class="p-5">
                    <CmsEmptyState
                        eyebrow="No pages"
                        title="Create a root page to begin."
                        description="Pages become site structure. After first page exists, recent edits appear here."
                    />
                </div>
            {:else}
                <div class="divide-y divide-border">
                    {#each recentPages as page (page.id)}
                        <a
                            href={`/edit/page/${page.id}`}
                            class="grid gap-3 px-5 py-4 transition hover:bg-muted/35 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                        >
                            <span class="flex min-w-0 items-center gap-3">
                                <span
                                    class="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
                                >
                                    <FileText class="size-4" />
                                </span>
                                <span class="min-w-0">
                                    <span
                                        class="block truncate text-sm font-medium text-foreground"
                                        >{page.title}</span
                                    >
                                    <span
                                        class="mt-1 block truncate font-mono text-xs text-muted-foreground"
                                        >{displayPath(page.path)}</span
                                    >
                                </span>
                            </span>
                            <span class="text-xs text-muted-foreground">
                                {formatUpdated(page.updated_at)}
                            </span>
                            {#if !page.is_published || page.has_unpublished_changes}
                                <Badge
                                    class="w-fit bg-amber-500/15 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300"
                                >
                                    Draft
                                </Badge>
                            {:else}
                                <Badge
                                    class="w-fit bg-emerald-500/15 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300"
                                >
                                    Published
                                </Badge>
                            {/if}
                        </a>
                    {/each}
                </div>
            {/if}
        </div>

        <aside class="space-y-4">
            <div class="rounded-lg border border-border bg-card shadow-sm">
                <div class="border-b border-border px-5 py-4">
                    <h2 class="text-base font-semibold text-foreground">
                        Needs attention
                    </h2>
                </div>
                <div class="divide-y divide-border">
                    {#each attentionItems as item (item.title)}
                        <a
                            href={item.href}
                            class="block px-5 py-4 transition hover:bg-muted/35"
                        >
                            <span class="flex items-start gap-3">
                                <item.icon
                                    class="mt-0.5 size-4 shrink-0 text-amber-600"
                                />
                                <span>
                                    <span
                                        class="block text-sm font-semibold leading-5 text-foreground"
                                        >{item.title}</span
                                    >
                                    <span
                                        class="mt-1 block text-xs leading-5 text-muted-foreground"
                                        >{item.detail}</span
                                    >
                                    <span
                                        class="mt-3 inline-flex text-xs font-medium text-foreground underline-offset-4 hover:underline"
                                        >{item.action}</span
                                    >
                                </span>
                            </span>
                        </a>
                    {/each}
                </div>
            </div>
        </aside>
    </section>

    <section class="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 class="text-base font-semibold text-foreground">Quick actions</h2>
        <div class="mt-4 grid gap-3 sm:grid-cols-3">
            {#each quickActions as action (action.label)}
                <a
                    href={action.href}
                    class="rounded-lg border border-border bg-background p-4 text-center transition hover:bg-muted/35"
                >
                    <span
                        class="mx-auto flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground"
                    >
                        <action.icon class="size-5" />
                    </span>
                    <span
                        class="mt-3 block text-sm font-semibold text-foreground"
                        >{action.label}</span
                    >
                    <span class="mt-1 block text-xs text-muted-foreground"
                        >{action.detail}</span
                    >
                </a>
            {/each}
        </div>
    </section>
</main>
