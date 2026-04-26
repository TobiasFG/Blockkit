<script lang="ts">
    import { onMount } from "svelte";
    import { fly } from "svelte/transition";
    import { browser } from "$app/environment";
    import { applyAction, enhance } from "$app/forms";
    import { getToastState } from "$lib/toasts/ToastState.svelte";
    import { pagesStore } from "$lib/client/pagesStore";
    import * as Alert from "$lib/components/ui/alert/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import * as Tabs from "$lib/components/ui/tabs/index.js";
    import { Textarea } from "$lib/components/ui/textarea/index.js";
    import BlockListEditor from "$lib/components/cms/BlockListEditor.svelte";
    import { buildPagePathPreview, isRootPage } from "$lib/pagePath";
    import { getPagePublishState, pageHasDraftChanges } from "$lib/pageStatus";
    import type {
        BlockListLocation,
        BlockPath,
        PageContentValidationErrors,
    } from "$lib/pageContentEditor";
    import {
        addBlockAtPath,
        createEditablePageContent,
        insertReusableBlockReferenceAtIndex,
        moveBlock,
        removeBlockAtPath,
        updateBlockFieldValue,
        validatePageContentEditorState,
    } from "$lib/pageContentEditor";
    import type { BlockValue, PageContent } from "$lib/pageContent";
    import { EMPTY_PAGE_SEO_META, type PageSeoMeta } from "$lib/pageSeoMeta";
    import type { Page, ReusableBlock } from "$lib/types";
    import type { PageProps } from "./$types";
    import { registerReusableBlockInsertHandler } from "$lib/sidebar";

    type LoadedSnapshot = {
        title: string;
        parentPageId: string | null;
        urlName: string;
        seo: PageSeoMeta;
        content: PageContent;
        revertTargetLabel: "draft" | "published";
    };

    type PrimaryActionState =
        | "validation-error"
        | "save-draft"
        | "publish"
        | "all-saved";

    let { data }: PageProps = $props();

    let page = $state<Page | null>(null);
    let pages = $state<Page[]>([]);
    let title = $state("");
    let parentPageId = $state<string | null>(null);
    let urlName = $state("");
    let seo = $state<PageSeoMeta>({ ...EMPTY_PAGE_SEO_META });
    let content = $state<PageContent>(createEditablePageContent(null));
    let reusableBlocks = $state<ReusableBlock[]>([]);
    let formSubmitting = $state(false);
    let publishing = $state(false);
    let contentErrors = $state<PageContentValidationErrors>({});
    let draggingPath = $state<string | null>(null);
    let canDragBlocks = $state(false);
    let prefersReducedMotion = $state(false);
    let loadedSnapshot = $state<LoadedSnapshot | null>(null);
    let activeTab = $state<"identity" | "content" | "discovery">("content");

    const toastState = getToastState();
    const serializedContent = $derived(JSON.stringify(content));
    const hasValidationErrors = $derived(Object.keys(contentErrors).length > 0);
    const isRoot = $derived(page ? isRootPage(page) : false);
    const selectableParents = $derived(
        pages
            .filter((entry) => entry.id !== page?.id)
            .filter((entry) => !entry.path.startsWith(`${page?.path}/`)),
    );
    const pathPreview = $derived.by(() => {
        if (!page) return "/";
        if (isRoot) return "/";

        try {
            return buildPagePathPreview({
                pageId: page.id,
                parentPageId,
                title,
                urlName,
                pages,
            });
        } catch {
            return page.path;
        }
    });
    const descendantPathChangeWarning = $derived.by(() => {
        if (!page) return false;
        const currentPage = page;
        const currentPrefix = page.path === "/" ? "/" : `${page.path}/`;
        return (
            pages.some((entry) => entry.parent_page_id === currentPage.id) &&
            pathPreview !== currentPage.path &&
            currentPrefix.length > 1
        );
    });
    const hasUnsavedChanges = $derived.by(() => {
        if (!loadedSnapshot) return false;

        return (
            title !== loadedSnapshot.title ||
            parentPageId !== loadedSnapshot.parentPageId ||
            urlName !== loadedSnapshot.urlName ||
            JSON.stringify(seo) !== JSON.stringify(loadedSnapshot.seo) ||
            serializedContent !== JSON.stringify(loadedSnapshot.content)
        );
    });
    const hasDraftChanges = $derived(page ? pageHasDraftChanges(page) : false);
    const publishState = $derived(
        page ? getPagePublishState(page) : "unpublished",
    );

    const getRevertTargetLabel = (currentPage: Page | null) => {
        if (!currentPage) return "draft" as const;
        return currentPage.is_published && !pageHasDraftChanges(currentPage)
            ? "published"
            : "draft";
    };

    const formatTimestamp = (value?: string | null) =>
        value ? new Date(value).toLocaleString() : "—";
    const inputClass = "h-11 rounded-2xl";
    const captionClass =
        "text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground";
    const displayPath = (path: string | null | undefined) =>
        path && path.trim() ? path : "/";

    const getPublishStateLabel = (
        state: "unpublished" | "published" | "draft-changes",
    ) => {
        switch (state) {
            case "draft-changes":
                return "Draft changes";
            case "published":
                return "Published";
            default:
                return "Unpublished";
        }
    };

    const getPublishStateClass = (
        state: "unpublished" | "published" | "draft-changes",
    ) => {
        switch (state) {
            case "draft-changes":
                return "bg-sky-100 text-sky-800";
            case "published":
                return "bg-emerald-100 text-emerald-800";
            default:
                return "bg-amber-100 text-amber-800";
        }
    };

    const getDraftStateLabel = () => {
        if (hasUnsavedChanges) return "Unsaved changes";
        if (hasDraftChanges) return "Saved draft changes";
        return "Up to date";
    };

    const primaryActionState = $derived<PrimaryActionState>(
        hasValidationErrors
            ? "validation-error"
            : hasUnsavedChanges
              ? "save-draft"
              : hasDraftChanges
                ? "publish"
                : "all-saved",
    );
    const primaryActionDisabled = $derived(
        formSubmitting ||
            publishing ||
            primaryActionState === "validation-error" ||
            primaryActionState === "all-saved",
    );
    const primaryActionFormAction = $derived(
        primaryActionState === "publish" ? "?/publishPage" : "?/updatePage",
    );
    const primaryActionLabel = $derived.by(() => {
        if (publishing) return "Publishing...";
        if (formSubmitting) return "Saving draft...";

        switch (primaryActionState) {
            case "validation-error":
                return "Validation error";
            case "publish":
                return "Publish";
            case "all-saved":
                return "All changes saved";
            default:
                return "Save draft";
        }
    });
    const primaryActionClass = $derived(
        primaryActionState === "publish"
            ? "border border-emerald-300/70 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 focus-visible:ring-emerald-200/70"
            : primaryActionState === "validation-error"
              ? "bg-red-900 text-red-50 hover:bg-red-900 focus-visible:ring-red-200/70"
              : "bg-stone-950 text-stone-50 hover:bg-stone-800 focus-visible:ring-stone-300/70",
    );
    const showPrimaryAction = $derived(primaryActionState !== "all-saved");
    const showRevertAction = $derived(hasUnsavedChanges);
    const actionMotion = $derived({
        y: prefersReducedMotion ? -4 : -10,
        duration: prefersReducedMotion ? 0 : 180,
    });

    $effect(() => {
        page = data.page ?? null;
        pages = data.pages ?? [];
        title = data.page?.title ?? "";
        parentPageId = data.page?.parent_page_id ?? null;
        urlName = data.page?.url_name ?? "";
        seo = data.seo ? { ...data.seo } : { ...EMPTY_PAGE_SEO_META };
        content = createEditablePageContent(data.content);
        loadedSnapshot = {
            title: data.page?.title ?? "",
            parentPageId: data.page?.parent_page_id ?? null,
            urlName: data.page?.url_name ?? "",
            seo: data.seo ? { ...data.seo } : { ...EMPTY_PAGE_SEO_META },
            content: createEditablePageContent(data.content),
            revertTargetLabel: getRevertTargetLabel(data.page ?? null),
        };
        reusableBlocks = data.reusableBlocks ?? [];
        contentErrors = {};
    });

    onMount(() => {
        const mediaQuery = window.matchMedia(
            "(pointer: fine) and (hover: hover) and (min-width: 1024px)",
        );
        const reducedMotionQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        );
        const updateDragMode = () => {
            canDragBlocks = mediaQuery.matches;
        };
        const updateReducedMotion = () => {
            prefersReducedMotion = reducedMotionQuery.matches;
        };
        const unregisterReusableInsert = registerReusableBlockInsertHandler(
            ({ reusableBlockId }) => {
                insertReusableReference(reusableBlockId, content.blocks.length);
                toastState.success("Content added to page draft.");
            },
        );

        updateDragMode();
        updateReducedMotion();
        mediaQuery.addEventListener("change", updateDragMode);
        reducedMotionQuery.addEventListener("change", updateReducedMotion);

        return () => {
            unregisterReusableInsert();
            mediaQuery.removeEventListener("change", updateDragMode);
            reducedMotionQuery.removeEventListener(
                "change",
                updateReducedMotion,
            );
        };
    });

    const syncContentErrors = () => {
        contentErrors = validatePageContentEditorState(
            content,
            new Set(reusableBlocks.map((block) => block.id)),
        );
        return Object.keys(contentErrors).length === 0;
    };

    const createBlockId = () =>
        typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const addBlock = (location: BlockListLocation, type: string) => {
        content = addBlockAtPath(content, location, type, createBlockId());
        syncContentErrors();
    };

    const insertReusableReference = (
        reusableBlockId: string,
        index: number,
    ) => {
        content = insertReusableBlockReferenceAtIndex(
            content,
            reusableBlockId,
            createBlockId(),
            index,
        );
        syncContentErrors();
    };

    const removeBlock = (path: BlockPath) => {
        content = removeBlockAtPath(content, path);
        syncContentErrors();
    };

    const reorderBlock = (path: BlockPath, toIndex: number) => {
        content = moveBlock(content, path, toIndex);
        syncContentErrors();
    };

    const updateField = (
        path: BlockPath,
        fieldKey: string,
        value: BlockValue | undefined,
    ) => {
        content = updateBlockFieldValue(content, path, fieldKey, value);
        syncContentErrors();
    };

    const resetDraft = () => {
        if (!loadedSnapshot) return;

        title = loadedSnapshot.title;
        parentPageId = loadedSnapshot.parentPageId;
        urlName = loadedSnapshot.urlName;
        seo = { ...loadedSnapshot.seo };
        content = createEditablePageContent(loadedSnapshot.content);
        contentErrors = {};
        draggingPath = null;
    };
</script>

<main class="mx-auto max-w-[96rem] px-4 pb-10 pt-6 sm:px-6 lg:px-8">
    {#if page}
        <form
            method="POST"
            action="?/updatePage"
            class="space-y-6"
            use:enhance={({ formElement, cancel, submitter }) => {
                const intent =
                    submitter instanceof HTMLButtonElement
                        ? (submitter.dataset.intent ?? "save")
                        : "save";

                if (!syncContentErrors()) {
                    toastState.error(
                        intent === "publish"
                            ? "Fix highlighted content fields before publishing."
                            : "Fix highlighted content fields before saving.",
                    );
                    cancel();
                    formElement.reportValidity();
                    return;
                }

                if (intent === "publish") {
                    if (hasUnsavedChanges) {
                        toastState.error(
                            "Save draft before publishing current page changes.",
                        );
                        cancel();
                        return;
                    }

                    publishing = true;
                } else {
                    formSubmitting = true;
                }

                return async ({ result, update }) => {
                    formSubmitting = false;
                    publishing = false;

                    if (result.type === "success") {
                        toastState.success(
                            intent === "publish"
                                ? "Page published."
                                : "Page draft saved.",
                        );
                    } else if (result.type === "failure") {
                        toastState.error(
                            intent === "publish"
                                ? `Failed to publish page: ${result.data?.error ?? "Unknown error"}`
                                : `Failed to update page: ${result.data?.error ?? "Unknown error"}`,
                        );
                    }

                    await applyAction(result);
                    await update({
                        reset: false,
                        invalidateAll: false,
                    });

                    if (
                        result.type === "success" &&
                        result.data &&
                        "page" in result.data
                    ) {
                        page = result.data.page as Page;
                        pages = (result.data.pages as Page[]) ?? pages;
                        title = page.title;
                        parentPageId = page.parent_page_id;
                        urlName = page.url_name ?? "";
                        if ("seo" in result.data && result.data.seo) {
                            seo = { ...(result.data.seo as PageSeoMeta) };
                        }
                        if ("content" in result.data && result.data.content) {
                            content = createEditablePageContent(
                                result.data.content as PageContent,
                            );
                            contentErrors = {};
                        }
                        if (
                            "reusableBlocks" in result.data &&
                            result.data.reusableBlocks
                        ) {
                            reusableBlocks = result.data
                                .reusableBlocks as ReusableBlock[];
                        }
                        loadedSnapshot = {
                            title,
                            parentPageId,
                            urlName,
                            seo: { ...seo },
                            content: createEditablePageContent(content),
                            revertTargetLabel: getRevertTargetLabel(page),
                        };

                        if (browser) {
                            pagesStore.set(pages);
                        }
                    }

                    formElement.reportValidity();
                };
            }}
        >
            <input type="hidden" name="content" value={serializedContent} />

            <div class="space-y-8">
                <header class="border-b border-border/70 pb-8">
                    <div
                        class="flex flex-wrap items-start justify-between gap-6"
                    >
                        <div class="max-w-3xl space-y-3">
                            <p class={captionClass}>Page editor</p>
                            <div class="space-y-2">
                                <h1
                                    class="max-w-2xl text-[2.6rem] font-semibold tracking-[-0.045em] text-foreground sm:text-5xl"
                                >
                                    {title || page.title}
                                </h1>
                                <p
                                    class="font-mono text-sm text-muted-foreground"
                                >
                                    {displayPath(pathPreview)}
                                </p>
                                {#if page.live_path && page.live_path !== pathPreview}
                                    <p class="text-sm text-muted-foreground">
                                        Live path stays {displayPath(
                                            page.live_path,
                                        )} until related drafts publish.
                                    </p>
                                {/if}
                            </div>
                        </div>

                        <Button href="/" variant="outline" class="rounded-full">
                            Back to pages
                        </Button>
                    </div>
                </header>

                <div
                    class="grid gap-10 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start"
                >
                    <div class="space-y-8">
                        <Tabs.Root
                            value={activeTab}
                            onValueChange={(value) =>
                                (activeTab = value as typeof activeTab)}
                        >
                            <Tabs.List
                                class="w-full justify-start rounded-[1.5rem]"
                            >
                                <Tabs.Trigger
                                    value="identity"
                                    class="min-h-11 rounded-[1.1rem]"
                                    >Identity</Tabs.Trigger
                                >
                                <Tabs.Trigger
                                    value="content"
                                    class="min-h-11 rounded-[1.1rem]"
                                    >Content</Tabs.Trigger
                                >
                                <Tabs.Trigger
                                    value="discovery"
                                    class="min-h-11 rounded-[1.1rem]"
                                    >Discovery &amp; Sharing</Tabs.Trigger
                                >
                            </Tabs.List>
                        </Tabs.Root>

                        {#if activeTab === "identity"}
                            <section class="space-y-5">
                                <div class="space-y-2">
                                    <p class={captionClass}>Identity</p>
                                    <h2
                                        class="text-[1.65rem] font-semibold tracking-[-0.035em] text-foreground"
                                    >
                                        Page name and path
                                    </h2>
                                    <p
                                        class="max-w-[62ch] text-base leading-7 text-muted-foreground"
                                    >
                                        Title, parent, URL name all save into
                                        draft identity. Publish makes them live
                                        together.
                                    </p>
                                </div>

                                <div
                                    class="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]"
                                >
                                    <div class="space-y-2">
                                        <Label for="title">Title</Label>
                                        <Input
                                            id="title"
                                            type="text"
                                            name="title"
                                            required
                                            bind:value={title}
                                            class={inputClass}
                                        />
                                    </div>

                                    <div class="space-y-2">
                                        <Label for="urlName">URL name</Label>
                                        <Input
                                            id="urlName"
                                            type="text"
                                            name="urlName"
                                            bind:value={urlName}
                                            disabled={isRoot}
                                            placeholder="about-us"
                                            class={`${inputClass} font-mono text-[13px]`}
                                        />
                                        <p
                                            class="text-sm leading-6 text-muted-foreground"
                                        >
                                            {#if isRoot}
                                                Root page always uses `/`.
                                            {:else}
                                                Optional. Leave empty to derive
                                                URL from title.
                                            {/if}
                                        </p>
                                    </div>
                                </div>

                                <div class="space-y-2">
                                    <Label for="parentPageId">Parent page</Label
                                    >
                                    {#if isRoot}
                                        <Input
                                            value="Root page"
                                            disabled
                                            class={inputClass}
                                        />
                                    {:else}
                                        <select
                                            id="parentPageId"
                                            name="parentPageId"
                                            bind:value={parentPageId}
                                            class="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-11 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus-visible:ring-3"
                                        >
                                            {#each selectableParents as parent (parent.id)}
                                                <option value={parent.id}
                                                    >{parent.title} ({displayPath(
                                                        parent.path,
                                                    )})</option
                                                >
                                            {/each}
                                        </select>
                                    {/if}
                                </div>

                                <div
                                    class="rounded-2xl border border-border/80 bg-muted/50 px-4 py-3"
                                >
                                    <p class={captionClass}>Path preview</p>
                                    <p
                                        class="mt-1 font-mono text-sm text-foreground"
                                    >
                                        {displayPath(pathPreview)}
                                    </p>
                                    {#if descendantPathChangeWarning}
                                        <p
                                            class="mt-2 text-sm text-muted-foreground"
                                        >
                                            Moving or renaming this page changes
                                            child page URLs when published.
                                        </p>
                                    {/if}
                                </div>
                            </section>
                        {/if}

                        {#if activeTab === "content"}
                            <section class="space-y-5">
                                <div class="space-y-2">
                                    <p class={captionClass}>Content</p>
                                    <h2
                                        class="text-[1.65rem] font-semibold tracking-[-0.035em] text-foreground"
                                    >
                                        Page content
                                    </h2>
                                </div>

                                <div class="border-t border-border pt-5">
                                    <BlockListEditor
                                        blocks={content.blocks}
                                        location={{
                                            parentPath: null,
                                            fieldKey: null,
                                        }}
                                        allowedTypes={null}
                                        errors={contentErrors}
                                        {draggingPath}
                                        {canDragBlocks}
                                        allowInlineBlockCreation={false}
                                        onAddBlock={addBlock}
                                        onInsertReusableBlockReference={insertReusableReference}
                                        onRemoveBlock={removeBlock}
                                        onMoveBlock={reorderBlock}
                                        onUpdateField={updateField}
                                        {reusableBlocks}
                                        onStartDrag={(path: number[]) => {
                                            draggingPath = path.join(".");
                                        }}
                                        onEndDrag={() => {
                                            draggingPath = null;
                                        }}
                                    />

                                    {#if Object.keys(contentErrors).length > 0}
                                        <Alert.Root
                                            class="mt-5"
                                            variant="destructive"
                                        >
                                            <Alert.Description
                                                >Some content still needs
                                                attention before you can save.</Alert.Description
                                            >
                                        </Alert.Root>
                                    {/if}
                                </div>
                            </section>
                        {/if}

                        {#if activeTab === "discovery"}
                            <section class="space-y-5">
                                <div class="space-y-2">
                                    <p class={captionClass}>
                                        Discovery &amp; sharing
                                    </p>
                                    <h2
                                        class="text-[1.65rem] font-semibold tracking-[-0.035em] text-foreground"
                                    >
                                        Search and sharing
                                    </h2>
                                    <p
                                        class="max-w-[62ch] text-base leading-7 text-muted-foreground"
                                    >
                                        Optional. Change this only if search
                                        results or shared links should show
                                        different text or image.
                                    </p>
                                </div>

                                <div
                                    class="space-y-4 border-t border-border pt-5"
                                >
                                    <div class="space-y-2">
                                        <Label for="seoTitle"
                                            >Title for search</Label
                                        >
                                        <Input
                                            id="seoTitle"
                                            type="text"
                                            name="seoTitle"
                                            bind:value={seo.title}
                                            class={inputClass}
                                        />
                                        <p
                                            class="text-sm leading-6 text-muted-foreground"
                                        >
                                            Optional. Leave empty to use page
                                            title.
                                        </p>
                                    </div>

                                    <div class="space-y-2">
                                        <Label for="seoDescription"
                                            >Description for search</Label
                                        >
                                        <Textarea
                                            id="seoDescription"
                                            name="seoDescription"
                                            rows={4}
                                            bind:value={seo.description}
                                            class="min-h-28 rounded-2xl resize-y"
                                        />
                                    </div>

                                    <div class="space-y-2">
                                        <Label for="canonicalUrl"
                                            >Preferred link</Label
                                        >
                                        <Input
                                            id="canonicalUrl"
                                            type="url"
                                            name="canonicalUrl"
                                            bind:value={seo.canonicalUrl}
                                            class={inputClass}
                                        />
                                    </div>

                                    <div class="space-y-2">
                                        <Label for="ogImageUrl"
                                            >Image for sharing</Label
                                        >
                                        <Input
                                            id="ogImageUrl"
                                            type="url"
                                            name="ogImageUrl"
                                            bind:value={seo.ogImageUrl}
                                            class={inputClass}
                                        />
                                    </div>

                                    <div class="grid gap-3 sm:grid-cols-2">
                                        <label
                                            class="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
                                        >
                                            <input
                                                type="checkbox"
                                                name="noIndex"
                                                bind:checked={seo.noIndex}
                                                class="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-300"
                                            />
                                            <span>Hide from search engines</span
                                            >
                                        </label>
                                        <label
                                            class="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
                                        >
                                            <input
                                                type="checkbox"
                                                name="noFollow"
                                                bind:checked={seo.noFollow}
                                                class="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-300"
                                            />
                                            <span>Disable link following</span>
                                        </label>
                                    </div>
                                </div>
                            </section>
                        {/if}
                    </div>

                    <aside class="space-y-4">
                        <section
                            class="rounded-[1.75rem] border border-border/80 bg-card/92 p-5 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.2)]"
                        >
                            <div class="space-y-2">
                                <p class={captionClass}>Draft state</p>
                                <h2
                                    class="text-[1.25rem] font-semibold tracking-[-0.03em] text-foreground"
                                >
                                    {getDraftStateLabel()}
                                </h2>
                                <p
                                    class="text-sm leading-6 text-muted-foreground"
                                >
                                    {#if hasUnsavedChanges}
                                        Current form changes live only in
                                        browser until you save draft.
                                    {:else if hasDraftChanges}
                                        Draft differs from published page.
                                    {:else}
                                        Draft matches published page.
                                    {/if}
                                </p>
                            </div>

                            <div class="mt-4 flex flex-col gap-2">
                                {#if showPrimaryAction}
                                    <Button
                                        type="submit"
                                        formaction={primaryActionFormAction}
                                        data-intent={primaryActionState ===
                                        "publish"
                                            ? "publish"
                                            : "save"}
                                        variant={primaryActionState ===
                                        "validation-error"
                                            ? "destructive"
                                            : primaryActionState === "publish"
                                              ? "secondary"
                                              : "default"}
                                        class="h-11 rounded-full"
                                        disabled={primaryActionDisabled}
                                    >
                                        {primaryActionLabel}
                                    </Button>
                                {/if}
                                {#if showRevertAction}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        class="h-11 rounded-full"
                                        onclick={resetDraft}
                                    >
                                        Revert changes to {loadedSnapshot?.revertTargetLabel ??
                                            "draft"}
                                    </Button>
                                {/if}
                            </div>
                        </section>

                        <section
                            class="rounded-[1.75rem] border border-border/80 bg-card/92 p-5 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.2)]"
                        >
                            <div class="space-y-2">
                                <p class={captionClass}>Publish state</p>
                                <div class="flex items-center gap-2">
                                    <Badge
                                        class={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getPublishStateClass(publishState)}`}
                                    >
                                        {getPublishStateLabel(publishState)}
                                    </Badge>
                                </div>
                                <p
                                    class="text-sm leading-6 text-muted-foreground"
                                >
                                    Publish uses current saved draft identity,
                                    content, SEO.
                                </p>
                            </div>

                            <div
                                class="mt-4 space-y-3 border-t border-border pt-4 text-sm text-muted-foreground"
                            >
                                <div
                                    class="flex items-center justify-between gap-3"
                                >
                                    <span>Draft path</span>
                                    <span
                                        class="font-mono text-xs text-foreground"
                                        >{displayPath(pathPreview)}</span
                                    >
                                </div>
                                <div
                                    class="flex items-center justify-between gap-3"
                                >
                                    <span>Live path</span>
                                    <span
                                        class="font-mono text-xs text-foreground"
                                        >{displayPath(page.live_path)}</span
                                    >
                                </div>
                                <div
                                    class="flex items-center justify-between gap-3"
                                >
                                    <span>Last published</span>
                                    <span class="text-right text-foreground"
                                        >{formatTimestamp(
                                            page.last_published_at,
                                        )}</span
                                    >
                                </div>
                                <div
                                    class="flex items-center justify-between gap-3"
                                >
                                    <span>Updated</span>
                                    <span class="text-right text-foreground"
                                        >{formatTimestamp(
                                            page.updated_at,
                                        )}</span
                                    >
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </form>
    {/if}
</main>
