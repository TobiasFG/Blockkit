<script lang="ts">
    import { browser } from "$app/environment";
    import { applyAction, enhance } from "$app/forms";
    import { flip } from "svelte/animate";

    import { pagesStore } from "$lib/client/pagesStore";
    import ActionModal from "$lib/components/cms/ActionModal.svelte";
    import * as Alert from "$lib/components/ui/alert/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import {
        buildEditPagePath,
        buildPagePathPreview,
        isRootPage,
    } from "$lib/pagePath";
    import { getPagePublishState, pageHasDraftChanges } from "$lib/pageStatus";
    import { BlockQuote, H, Highlight, List, P } from "$lib/Typography/Index";
    import type { Page } from "$lib/types";
    import type { PageProps } from "./$types";

    type FeedbackState = { tone: "success" | "error"; text: string } | null;
    type TypographySize = "small" | "medium" | "large";
    type ListPreview = {
        label: string;
        style: "ordered" | "unordered" | "none";
    };

    let { data }: PageProps = $props();
    const pages = $derived(
        browser ? ($pagesStore ?? data.pages ?? []) : (data.pages ?? []),
    );
    const dashboardPages = $derived(sortDashboardPages(pages));
    const draftPageCount = $derived(
        dashboardPages.filter((page) => pageHasDraftChanges(page)).length,
    );
    const reusableBlockCount = $derived(data.reusableBlocks?.length ?? 0);
    let formSubmitting = $state(false);
    let pageFeedback = $state<FeedbackState>(null);
    let deletingPage = $state<string | null>(null);
    let pendingDeletePage = $state<Page | null>(null);
    let createTitle = $state("");
    let createUrlName = $state("");
    let createParentPageId = $state("");

    const dateFormatter = new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    const captionClass =
        "text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground";
    const panelClass =
        "rounded-[1.75rem] border border-border/80 bg-card/92 p-5 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.24)]";
    const typographySizes: TypographySize[] = ["small", "medium", "large"];
    const listPreviews: ListPreview[] = [
        { label: "Unordered", style: "unordered" },
        { label: "Ordered", style: "ordered" },
        { label: "None", style: "none" },
    ];

    function sortDashboardPages(items: Page[]) {
        return [...items].sort((a, b) => {
            const draftDiff =
                Number(pageHasDraftChanges(b)) - Number(pageHasDraftChanges(a));
            if (draftDiff !== 0) return draftDiff;

            const updatedDiff =
                new Date(b.updated_at).getTime() -
                new Date(a.updated_at).getTime();
            if (updatedDiff !== 0) return updatedDiff;

            return a.title.localeCompare(b.title);
        });
    }

    const clearPageFeedback = () => {
        pageFeedback = null;
    };

    const openDeletePageModal = (page: Page) => {
        pendingDeletePage = page;
    };

    const closeDeletePageModal = () => {
        pendingDeletePage = null;
    };

    const editHref = (pageId: string) => buildEditPagePath(pageId);
    const displayPath = (path: string | null | undefined) =>
        path && path.trim() ? path : "/";
    const displayDate = (value: string) =>
        dateFormatter.format(new Date(value));
    const createPathPreview = $derived.by(() => {
        if (!createParentPageId) return "/";

        try {
            return buildPagePathPreview({
                pageId: "__new__",
                parentPageId: createParentPageId,
                title: createTitle,
                urlName: createUrlName,
                pages,
            });
        } catch {
            return "/";
        }
    });
    const getPublishStateLabel = (page: Page) => {
        const state = getPagePublishState(page);
        if (state === "draft-changes") return "Draft changes";
        if (state === "published") return "Published";
        return "Unpublished";
    };
    const getPublishStateClass = (page: Page) => {
        const state = getPagePublishState(page);
        if (state === "draft-changes")
            return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
        if (state === "published")
            return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
        return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    };

    $effect(() => {
        if (browser) {
            pagesStore.set(data.pages ?? []);
        }

        if (!createParentPageId) {
            createParentPageId =
                (data.pages ?? []).find((page) => isRootPage(page))?.id ?? "";
        }
    });
</script>

<main class="mx-auto max-w-[96rem] px-4 pb-10 pt-6 sm:px-6 lg:px-8">
    <div class="space-y-8">
        <header class="border-b border-border/70 pb-8">
            <div
                class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start"
            >
                <div class="space-y-5">
                    <div class="space-y-2">
                        <p class={captionClass}>Dashboard</p>
                        <h1
                            class="max-w-3xl text-[2.6rem] font-semibold tracking-[-0.045em] text-foreground sm:text-5xl"
                        >
                            Pages first. Shared content stays close, not loud.
                        </h1>
                        <p
                            class="max-w-[66ch] text-base leading-7 text-muted-foreground"
                        >
                            Open draft work first, create next page fast, leave
                            shared content structure to dedicated Content
                            library.
                        </p>
                    </div>

                    <div
                        class="flex flex-wrap gap-6 border-t border-border pt-5"
                    >
                        <div class="space-y-1">
                            <p class={captionClass}>Pages</p>
                            <p
                                class="text-3xl font-semibold tracking-[-0.04em] text-foreground"
                            >
                                {dashboardPages.length}
                            </p>
                        </div>
                        <div class="space-y-1">
                            <p class={captionClass}>Draft work</p>
                            <p
                                class="text-3xl font-semibold tracking-[-0.04em] text-foreground"
                            >
                                {draftPageCount}
                            </p>
                        </div>
                        <div class="space-y-1">
                            <p class={captionClass}>Content items</p>
                            <p
                                class="text-3xl font-semibold tracking-[-0.04em] text-foreground"
                            >
                                {reusableBlockCount}
                            </p>
                        </div>
                    </div>
                </div>

                <section id="create" class={`${panelClass} scroll-mt-20`}>
                    <div class="space-y-1">
                        <p class={captionClass}>New page</p>
                        <h2
                            class="text-[1.35rem] font-semibold tracking-[-0.03em] text-foreground"
                        >
                            Create next draft
                        </h2>
                        <p class="text-sm leading-6 text-muted-foreground">
                            Start with page name, parent, optional URL override.
                        </p>
                    </div>

                    {#if pageFeedback}
                        <Alert.Root
                            class="mt-4"
                            variant={pageFeedback.tone === "success"
                                ? "default"
                                : "destructive"}
                        >
                            <Alert.Description
                                >{pageFeedback.text}</Alert.Description
                            >
                        </Alert.Root>
                    {/if}

                    <form
                        method="POST"
                        action="?/createPage"
                        class="mt-5 space-y-4"
                        use:enhance={({ formElement }) => {
                            clearPageFeedback();
                            formSubmitting = true;

                            return async ({ result, update }) => {
                                formSubmitting = false;

                                if (result.type === "success") {
                                    formElement.reset();
                                    createTitle = "";
                                    createUrlName = "";
                                    createParentPageId =
                                        pages.find((page) => isRootPage(page))
                                            ?.id ?? "";
                                    pageFeedback = {
                                        tone: "success",
                                        text: "Page created successfully.",
                                    };
                                } else if (result.type === "failure") {
                                    pageFeedback = {
                                        tone: "error",
                                        text:
                                            "Failed to create page: " +
                                            (result.data?.error ||
                                                "Unknown error"),
                                    };
                                }

                                await applyAction(result);
                                await update({
                                    reset: true,
                                    invalidateAll: false,
                                });

                                if (
                                    result.type === "success" &&
                                    result.data &&
                                    "pages" in result.data
                                ) {
                                    pagesStore.set(result.data.pages as Page[]);
                                }
                            };
                        }}
                    >
                        <div class="space-y-2">
                            <Label for="title">Page title</Label>
                            <Input
                                id="title"
                                type="text"
                                name="title"
                                placeholder="About us"
                                required
                                bind:value={createTitle}
                                class="h-11 rounded-2xl"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="parentPageId">Parent page</Label>
                            <select
                                id="parentPageId"
                                name="parentPageId"
                                required
                                bind:value={createParentPageId}
                                class="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-11 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus-visible:ring-3"
                            >
                                {#each pages as page (page.id)}
                                    <option value={page.id}
                                        >{page.title} ({displayPath(
                                            page.path,
                                        )})</option
                                    >
                                {/each}
                            </select>
                        </div>
                        <div class="space-y-2">
                            <Label for="urlName">URL name</Label>
                            <Input
                                id="urlName"
                                type="text"
                                name="urlName"
                                placeholder="about-us"
                                bind:value={createUrlName}
                                class="h-11 rounded-2xl font-mono text-[13px]"
                            />
                            <p class="text-sm leading-6 text-muted-foreground">
                                Optional. Leave empty to derive URL from title.
                            </p>
                        </div>
                        <div
                            class="rounded-2xl border border-border/80 bg-muted/50 px-4 py-3"
                        >
                            <p class={captionClass}>Path preview</p>
                            <p class="mt-1 font-mono text-sm text-foreground">
                                {displayPath(createPathPreview)}
                            </p>
                        </div>
                        <Button
                            type="submit"
                            class="h-11 w-full rounded-full"
                            disabled={formSubmitting}
                        >
                            {formSubmitting ? "Creating..." : "Create page"}
                        </Button>
                    </form>
                </section>
            </div>
        </header>

        <section
            class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start"
        >
            <div class="space-y-5">
                <div
                    class="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between"
                >
                    <div class="space-y-2">
                        <p class={captionClass}>Pages</p>
                        <h2
                            class="text-[1.7rem] font-semibold tracking-[-0.035em] text-foreground"
                        >
                            Open current page work
                        </h2>
                        <p
                            class="max-w-[62ch] text-base leading-7 text-muted-foreground"
                        >
                            Draft changes sort first, then most recently updated
                            pages.
                        </p>
                    </div>
                    <span class="text-sm font-medium text-muted-foreground"
                        >{dashboardPages.length} total</span
                    >
                </div>

                {#if dashboardPages.length > 0}
                    <ul class="divide-y divide-border border-t border-border">
                        {#each dashboardPages as page (page.id)}
                            <li animate:flip={{ duration: 300 }} class="py-5">
                                <div
                                    class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
                                >
                                    <div class="min-w-0 space-y-2">
                                        <div
                                            class="flex flex-wrap items-center gap-2"
                                        >
                                            <h3
                                                class="text-[1.12rem] font-semibold tracking-[-0.02em] text-foreground"
                                            >
                                                {page.title}
                                            </h3>
                                            <Badge
                                                class={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getPublishStateClass(page)}`}
                                            >
                                                {getPublishStateLabel(page)}
                                            </Badge>
                                        </div>
                                        <div
                                            class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground"
                                        >
                                            <span
                                                class="font-mono text-[12px] text-foreground"
                                                >{displayPath(page.path)}</span
                                            >
                                            {#if page.live_path && page.live_path !== page.path}
                                                <span
                                                    >Live path {displayPath(
                                                        page.live_path,
                                                    )}</span
                                                >
                                            {/if}
                                            <span
                                                >Updated {displayDate(
                                                    page.updated_at,
                                                )}</span
                                            >
                                            {#if page.last_published_at}
                                                <span
                                                    >Live {displayDate(
                                                        page.last_published_at,
                                                    )}</span
                                                >
                                            {/if}
                                        </div>
                                    </div>
                                    <div
                                        class="flex items-center gap-2 sm:justify-end"
                                    >
                                        <Button
                                            href={editHref(page.id)}
                                            class="rounded-full"
                                        >
                                            Edit
                                        </Button>
                                        {#if !isRootPage(page)}
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                class="rounded-full"
                                                disabled={deletingPage ===
                                                    page.id}
                                                onclick={() =>
                                                    openDeletePageModal(page)}
                                            >
                                                {deletingPage === page.id
                                                    ? "Deleting..."
                                                    : "Delete"}
                                            </Button>
                                        {/if}
                                    </div>
                                </div>
                            </li>
                        {/each}
                    </ul>
                {:else}
                    <div
                        class="rounded-[1.5rem] border border-dashed border-border bg-muted/40 px-6 py-8 text-sm text-muted-foreground"
                    >
                        No pages yet. Create first page draft to start building
                        site structure.
                    </div>
                {/if}
            </div>

            <aside class={panelClass}>
                <div class="space-y-2">
                    <p class={captionClass}>Content library</p>
                    <h2
                        class="text-[1.35rem] font-semibold tracking-[-0.03em] text-foreground"
                    >
                        Shared content stays separate
                    </h2>
                    <p class="text-sm leading-6 text-muted-foreground">
                        Use Content library to create, organize, and update
                        reusable content items without crowding page workflow.
                    </p>
                </div>

                <div class="mt-4 space-y-3 border-t border-border pt-4">
                    <div class="flex items-center justify-between gap-3">
                        <span class="text-sm text-muted-foreground"
                            >Content items</span
                        >
                        <span class="text-lg font-semibold text-foreground"
                            >{reusableBlockCount}</span
                        >
                    </div>
                    <div class="flex items-center justify-between gap-3">
                        <span class="text-sm text-muted-foreground"
                            >Home page</span
                        >
                        <span class="font-mono text-xs text-foreground">/</span>
                    </div>
                </div>

                <Button
                    href="/content"
                    variant="outline"
                    class="mt-5 h-11 w-full rounded-full"
                >
                    Open Content
                </Button>
            </aside>
        </section>

        <section class="space-y-8 border-t border-border pt-8">
            <div class="space-y-2">
                <p class={captionClass}>Typography preview</p>
                <h2
                    class="text-[1.7rem] font-semibold tracking-[-0.035em] text-foreground"
                >
                    Reusable component variations
                </h2>
                <p
                    class="max-w-[62ch] text-base leading-7 text-muted-foreground"
                >
                    Temporary review surface for typography primitives.
                </p>
            </div>

            <div class="grid gap-6 xl:grid-cols-2">
                <section class={panelClass}>
                    <p class={captionClass}>Headings</p>
                    <div class="mt-4 space-y-4">
                        {#each typographySizes as size}
                            <div>
                                <H {size}>Heading {size}</H>
                                <H {size} muted>Muted heading {size}</H>
                            </div>
                        {/each}
                    </div>
                </section>

                <section class={panelClass}>
                    <p class={captionClass}>Paragraphs</p>
                    <div class="mt-4 space-y-4">
                        {#each typographySizes as size}
                            <div>
                                <P {size}
                                    >Paragraph {size}. Reusable typography keeps
                                    copy styling consistent.</P
                                >
                                <P {size} muted
                                    >Muted paragraph {size}. Secondary copy uses
                                    muted foreground.</P
                                >
                            </div>
                        {/each}
                    </div>
                </section>

                <section class={panelClass}>
                    <p class={captionClass}>Blockquote</p>
                    <div class="mt-4 space-y-4">
                        {#each typographySizes as size}
                            <BlockQuote {size}
                                >Blockquote {size} with primary border.</BlockQuote
                            >
                            <BlockQuote {size} muted
                                >Muted blockquote {size} with primary border.</BlockQuote
                            >
                        {/each}
                    </div>
                </section>

                <section class={panelClass}>
                    <p class={captionClass}>Highlight</p>
                    <div class="mt-4 flex flex-wrap items-center gap-3">
                        {#each typographySizes as size}
                            <Highlight {size}>Highlight {size}</Highlight>
                            <Highlight {size} muted
                                >Muted highlight {size}</Highlight
                            >
                        {/each}
                    </div>
                </section>

                <section class={`${panelClass} xl:col-span-2`}>
                    <p class={captionClass}>Lists</p>
                    <div class="mt-4 grid gap-6 lg:grid-cols-3">
                        {#each listPreviews as preview}
                            <div class="rounded-2xl border border-border p-4">
                                <p class={captionClass}>{preview.label}</p>
                                {#each typographySizes as size}
                                    <List {size} style={preview.style}>
                                        <li>{preview.label} list {size}</li>
                                        <li>Second item</li>
                                        <li>Third item</li>
                                    </List>
                                    <List {size} muted style={preview.style}>
                                        <li>
                                            Muted {preview.label.toLowerCase()} list
                                            {size}
                                        </li>
                                        <li>Second muted item</li>
                                    </List>
                                {/each}
                            </div>
                        {/each}
                    </div>
                </section>
            </div>
        </section>
    </div>
</main>

{#if pendingDeletePage}
    {@const deletePage = pendingDeletePage}
    <ActionModal
        open={true}
        title="Move page to trash"
        description={`Move “${deletePage.title}” at ${displayPath(deletePage.path)} to trash. Featured content stays untouched.`}
        onClose={closeDeletePageModal}
        labelledBy="delete-page-dialog-title"
    >
        {#snippet children()}
            <p class={captionClass}>Delete page</p>
            <form
                method="POST"
                action="?/deletePage"
                class="flex items-center justify-end gap-2"
                use:enhance={({ formData }) => {
                    const pageId = String(formData.get("pageId") ?? "");
                    clearPageFeedback();
                    deletingPage = pageId;

                    return async ({ result, update }) => {
                        deletingPage = null;

                        if (result.type === "success") {
                            pageFeedback = {
                                tone: "success",
                                text: "Page moved to trash.",
                            };
                            closeDeletePageModal();
                        } else if (result.type === "failure") {
                            pageFeedback = {
                                tone: "error",
                                text:
                                    "Failed to delete page: " +
                                    (result.data?.error || "Unknown error"),
                            };
                        }

                        await applyAction(result);
                        await update({
                            reset: false,
                            invalidateAll: false,
                        });

                        if (
                            result.type === "success" &&
                            result.data &&
                            "pages" in result.data
                        ) {
                            pagesStore.set(result.data.pages as Page[]);
                        }
                    };
                }}
            >
                <input type="hidden" name="pageId" value={deletePage.id} />
                <Button
                    type="button"
                    variant="outline"
                    class="rounded-full"
                    onclick={closeDeletePageModal}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="destructive"
                    class="rounded-full"
                    disabled={deletingPage === deletePage.id}
                >
                    {deletingPage === deletePage.id
                        ? "Moving..."
                        : "Move to trash"}
                </Button>
            </form>
        {/snippet}
    </ActionModal>
{/if}
