<script lang="ts">
    import { browser } from "$app/environment";
    import { applyAction, enhance } from "$app/forms";
    import { resolveRoute } from "$app/paths";
    import { flip } from "svelte/animate";
    import { pagesStore } from "$lib/client/pagesStore";
    import { listBlockDefinitions } from "$lib/blocks/registry";
    import ActionModal from "$lib/components/cms/ActionModal.svelte";
    import {
        blockFoldersStore,
        reusableBlocksStore,
    } from "$lib/client/reusableBlocksStore";
    import type { PageProps } from "./$types";
    import type { BlockFolder, Page, ReferencingPage, ReusableBlock } from "$lib/types";
    type FeedbackState = { tone: "success" | "error"; text: string } | null;

    let { data }: PageProps = $props();
    const pages = $derived(browser ? ($pagesStore ?? (data.pages ?? [])) : (data.pages ?? []));
    const blockFolders = $derived(
        browser ? ($blockFoldersStore ?? (data.blockFolders ?? [])) : (data.blockFolders ?? []),
    );
    const reusableBlocks = $derived(
        browser ? ($reusableBlocksStore ?? (data.reusableBlocks ?? [])) : (data.reusableBlocks ?? []),
    );
    let reusableBlockPageReferences = $state<Record<string, ReferencingPage[]>>(
        data.reusableBlockPageReferences ?? {},
    );
    const blockDefinitions = listBlockDefinitions();
    let formSubmitting = $state(false);
    let pageFeedback = $state<FeedbackState>(null);
    let sharedSectionsFeedback = $state<FeedbackState>(null);
    let deletingPage = $state<string | null>(null);
    let pendingDeletePage = $state<Page | null>(null);
    let showDeletePageModal = $state(false);
    let folderSubmitting = $state(false);
    let blockSubmitting = $state(false);
    let savingFolder = $state<string | null>(null);
    let deletingFolder = $state<string | null>(null);
    let pendingDeleteFolder = $state<BlockFolder | null>(null);
    let showDeleteFolderModal = $state(false);
    let deletingReusableBlock = $state<string | null>(null);
    let pendingDeleteReusableBlock = $state<ReusableBlock | null>(null);
    let pendingDeleteBlockPages = $state<ReferencingPage[]>([]);
    let showDeleteReusableBlockModal = $state(false);

    const clearPageFeedback = () => {
        pageFeedback = null;
    };

    const clearSharedSectionsFeedback = () => {
        sharedSectionsFeedback = null;
    };

    const openDeletePageModal = (page: Page) => {
        pendingDeletePage = page;
        showDeletePageModal = true;
    };

    const closeDeletePageModal = () => {
        showDeletePageModal = false;
        pendingDeletePage = null;
    };

    const openDeleteFolderModal = (folder: BlockFolder) => {
        pendingDeleteFolder = folder;
        showDeleteFolderModal = true;
    };

    const closeDeleteFolderModal = () => {
        showDeleteFolderModal = false;
        pendingDeleteFolder = null;
    };

    const editHref = (slug: string) => {
        const cleaned = slug.replace(/^\//, "");
        const target = isRootPage(slug) ? "__root__" : cleaned;
        return resolveRoute("/edit/[...slug]", { slug: target });
    };
    const displaySlug = (slug: string) => {
        const cleaned = slug.replace(/^\//, "");
        return cleaned.length === 0 ? "/" : `/${cleaned}`;
    };
    const isRootPage = (slug: string) => slug === "/" || slug.trim() === "";

    $effect(() => {
        if (browser) {
            pagesStore.set(data.pages ?? []);
            blockFoldersStore.set(data.blockFolders ?? []);
            reusableBlocksStore.set(data.reusableBlocks ?? []);
        }
        reusableBlockPageReferences = data.reusableBlockPageReferences ?? {};
    });

    const applyReusableBlockResult = (resultData: Record<string, unknown>) => {
        if ("blockFolders" in resultData) {
            blockFoldersStore.set(resultData.blockFolders as BlockFolder[]);
        }
        if ("reusableBlocks" in resultData) {
            reusableBlocksStore.set(resultData.reusableBlocks as ReusableBlock[]);
        }
        if ("reusableBlockPageReferences" in resultData) {
            reusableBlockPageReferences =
                resultData.reusableBlockPageReferences as Record<string, ReferencingPage[]>;
        }
    };

    const displayPageReference = (page: ReferencingPage) =>
        `${page.title} (${displaySlug(page.slug)})`;

    const openDeleteReusableBlockModal = (block: ReusableBlock) => {
        const pagesReferencingBlock = reusableBlockPageReferences[block.id] ?? [];
        pendingDeleteReusableBlock = block;
        pendingDeleteBlockPages = pagesReferencingBlock;
        showDeleteReusableBlockModal = true;
    };

    const closeDeleteReusableBlockModal = () => {
        showDeleteReusableBlockModal = false;
        pendingDeleteReusableBlock = null;
        pendingDeleteBlockPages = [];
    };
</script>

<main class="mx-auto max-w-6xl space-y-10">
    <div class="max-w-3xl space-y-3">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            CMS
        </p>
        <h1 class="text-4xl font-semibold tracking-tight text-slate-900">
            Content dashboard
        </h1>
        <p class="max-w-2xl text-base leading-7 text-slate-700">
            Create and update site pages and shared sections from one place.
        </p>
        <p class="text-sm text-slate-500">Your homepage lives at `/` and stays available at all times.</p>
    </div>

    <section class="space-y-6">
        <div class="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div class="space-y-1">
                <h2 class="text-2xl font-semibold tracking-tight text-slate-900">Pages</h2>
                <p class="max-w-2xl text-sm leading-6 text-slate-600">
                    Review the current page structure, open an editor, or add the next page in the hierarchy.
                </p>
            </div>
            <span class="text-sm font-medium text-slate-500">{pages?.length ?? 0} total</span>
        </div>

        {#if pages && pages.length > 0}
            <ul class="grid gap-3">
                {#each pages as page (page.id)}
                    <li
                        animate:flip={{ duration: 300 }}
                        class="grid gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-slate-300 hover:bg-slate-50/60 sm:grid-cols-[minmax(0,1fr)_auto]"
                    >
                        <div class="min-w-0 space-y-1">
                            <h3 class="text-base font-semibold text-slate-900">
                                {page.title}
                            </h3>
                            <p class="font-mono text-sm text-slate-500">
                                {displaySlug(page.slug)}
                            </p>
                        </div>
                        <div class="flex items-center justify-end gap-2 sm:self-center">
                            <a
                                href={editHref(page.slug)}
                                class="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                            >
                                Edit
                            </a>
                            {#if !isRootPage(page.slug)}
                                <button
                                    type="button"
                                    class="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={deletingPage === page.slug}
                                    onclick={() => openDeletePageModal(page)}
                                >
                                    {deletingPage === page.slug
                                        ? "Deleting..."
                                        : "Delete"}
                                </button>
                            {/if}
                        </div>
                    </li>
                {/each}
            </ul>
        {:else}
            <div
                class="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center"
            >
                <p class="text-slate-700">
                    No pages yet. Add your first page below to start building the site structure.
                </p>
            </div>
        {/if}

        <div
            id="create"
            class="scroll-mt-20 rounded-2xl bg-slate-100/70 p-5 space-y-4"
        >
            <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div class="space-y-1">
                    <h3 class="text-lg font-semibold text-slate-900">
                    New page
                    </h3>
                    <p class="text-sm text-slate-600">Start with the title and URL segment. You can add content after creation.</p>
                </div>
                <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pages</span>
            </div>

            {#if pageFeedback}
                <div
                    class={[
                        "rounded-md px-3 py-2 text-sm",
                        pageFeedback.tone === "success"
                            ? "border border-green-200 bg-green-50 text-green-800"
                            : "border border-red-200 bg-red-50 text-red-800",
                    ].join(" ")}
                >
                    {pageFeedback.text}
                </div>
            {/if}

            <form
                method="POST"
                action="?/createPage"
                class="flex flex-col gap-3 sm:flex-row sm:items-end"
                use:enhance={({
                    formElement,
                    formData,
                    action,
                    cancel,
                    submitter,
                }) => {
                    clearPageFeedback();
                    formSubmitting = true;

                    return async ({ result, update }) => {
                        formSubmitting = false;

                        if (result.type === "success") {
                            formElement.reset();
                            pageFeedback = {
                                tone: "success",
                                text: "Page created successfully.",
                            };
                        } else if (result.type === "failure") {
                            pageFeedback = {
                                tone: "error",
                                text:
                                    "Failed to create page: " +
                                    (result.data?.error || "Unknown error"),
                            };
                        }

                        // Apply the action to handle any redirects or other default behaviors
                        await applyAction(result);
                        // Update the DOM with new data
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
                <div class="flex-1 space-y-3">
                    <div class="space-y-1">
                        <label
                            for="title"
                            class="text-sm font-medium text-slate-700"
                            >Page title</label
                        >
                        <input
                            id="title"
                            type="text"
                            name="title"
                            placeholder="About us"
                            required
                            class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                        />
                    </div>
                    <div class="space-y-1">
                        <label
                            for="slug"
                            class="text-sm font-medium text-slate-700"
                            >Page URL</label
                        >
                        <input
                            id="slug"
                            type="text"
                            name="slug"
                            placeholder="about"
                            required
                            class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                        />
                        <p class="text-xs text-slate-500">Use the last part of the page path, for example `about`.</p>
                    </div>
                </div>
                <button
                    type="submit"
                    class="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={formSubmitting}
                >
                    {formSubmitting ? "Creating..." : "Create page"}
                </button>
            </form>
        </div>
    </section>

    <section class="space-y-6">
        <div class="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div class="space-y-1">
                <h2 class="text-2xl font-semibold tracking-tight text-slate-900">Shared sections</h2>
                <p class="max-w-2xl text-sm leading-6 text-slate-600">
                    Manage shared content sections you can publish once and reuse across multiple pages.
                </p>
            </div>
            <span class="text-sm font-medium text-slate-500">{reusableBlocks?.length ?? 0} total</span>
        </div>

        <div class="grid gap-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.85fr)]">
            <div class="space-y-6">
                <div class="space-y-4">
                    <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div class="space-y-1">
                            <h3 class="text-lg font-semibold text-slate-900">Shared section library</h3>
                            <p class="text-sm text-slate-600">Open, review, and clean up reusable sections without leaving the dashboard.</p>
                        </div>
                        <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Shared content
                        </span>
                    </div>

                    {#if sharedSectionsFeedback}
                        <div
                            class={[
                                "mb-3 rounded-md px-3 py-2 text-sm",
                                sharedSectionsFeedback.tone === "success"
                                    ? "border border-green-200 bg-green-50 text-green-800"
                                    : "border border-red-200 bg-red-50 text-red-800",
                            ].join(" ")}
                        >
                            {sharedSectionsFeedback.text}
                        </div>
                    {/if}

                    {#if reusableBlocks && reusableBlocks.length > 0}
                        <ul class="space-y-3">
                            {#each reusableBlocks as block (block.id)}
                                <li class="grid gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                                    <div class="min-w-0 space-y-2">
                                        <div class="truncate text-sm font-semibold text-slate-900">{block.name}</div>
                                        <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                <span class="rounded-full bg-slate-100 px-2 py-0.5 font-semibold uppercase tracking-wide">
                                                    {block.block_type}
                                                </span>
                                                {#if !block.is_published}
                                                    <span class="rounded-full bg-amber-100 px-2 py-0.5 font-semibold uppercase tracking-wide text-amber-800">
                                                        Unpublished
                                                    </span>
                                                {:else if block.has_unpublished_changes}
                                                    <span class="rounded-full bg-sky-100 px-2 py-0.5 font-semibold uppercase tracking-wide text-sky-800">
                                                        Draft changes
                                                    </span>
                                                {/if}
                                                <span>
                                                    Folder:
                                                    {block.folder_id
                                                        ? (blockFolders?.find((folder) => folder.id === block.folder_id)?.name ?? "Unknown")
                                                        : "Root"}
                                                </span>
                                    </div>
                                    <div class="flex flex-wrap items-center justify-end gap-2 sm:self-center">
                                        <a
                                            href={`/blocks/${block.id}`}
                                            class="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                                        >
                                            Edit section
                                        </a>
                                        <button
                                            type="button"
                                            class="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                                            onclick={() => openDeleteReusableBlockModal(block)}
                                        >
                                            Delete block
                                        </button>
                                    </div>
                                </li>
                            {/each}
                        </ul>
                    {:else}
                        <div class="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                            No reusable blocks yet.
                        </div>
                    {/if}
                    <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div class="space-y-1">
                            <h3 class="text-lg font-semibold text-slate-900">Folders</h3>
                            <p class="text-sm text-slate-600">Keep reusable sections grouped without pushing folder maintenance ahead of content work.</p>
                        </div>
                        <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Organization</span>
                    </div>

                    {#if blockFolders && blockFolders.length > 0}
                        <div class="space-y-3">
                            {#each blockFolders as folder (folder.id)}
                                <div class="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                                <form
                                    method="POST"
                                    action="?/updateBlockFolder"
                                    class="grid gap-3"
                                    use:enhance={({ formElement, formData }) => {
                                        clearSharedSectionsFeedback();
                                        savingFolder = String(formData.get("id") ?? "");

                                        return async ({ result, update }) => {
                                            savingFolder = null;

                                            if (result.type === "success" && result.data) {
                                                sharedSectionsFeedback = {
                                                    tone: "success",
                                                    text: "Folder updated successfully.",
                                                };
                                                applyReusableBlockResult(result.data as Record<string, unknown>);
                                            } else if (result.type === "failure") {
                                                sharedSectionsFeedback = {
                                                    tone: "error",
                                                    text: `Failed to update folder: ${result.data?.error ?? "Unknown error"}`,
                                                };
                                            }

                                            await applyAction(result);
                                            await update({ reset: false, invalidateAll: false });
                                            formElement.reportValidity();
                                        };
                                    }}
                                >
                                    <input type="hidden" name="id" value={folder.id} />
                                    <div class="grid gap-3 sm:grid-cols-2">
                                        <div class="space-y-1">
                                            <label class="text-sm font-medium text-slate-700" for={`folder-name-${folder.id}`}>
                                                Name
                                            </label>
                                            <input
                                                id={`folder-name-${folder.id}`}
                                                type="text"
                                                name="name"
                                                value={folder.name}
                                                required
                                                class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                                            />
                                        </div>
                                        <div class="space-y-1">
                                            <label class="text-sm font-medium text-slate-700" for={`folder-parent-${folder.id}`}>
                                                Parent folder
                                            </label>
                                            <select
                                                id={`folder-parent-${folder.id}`}
                                                name="parentId"
                                                class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                                            >
                                                <option value="">Root</option>
                                                {#each blockFolders.filter((candidate) => candidate.id !== folder.id) as candidate}
                                                    <option value={candidate.id} selected={candidate.id === folder.parent_id}>
                                                        {candidate.name}
                                                    </option>
                                                {/each}
                                            </select>
                                        </div>
                                    </div>
                                    <div class="flex items-center justify-end gap-2">
                                        <button
                                            type="submit"
                                            class="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                            disabled={savingFolder === folder.id}
                                        >
                                            {savingFolder === folder.id ? "Saving..." : "Save folder"}
                                        </button>
                                    </div>
                                </form>
                                <div class="flex justify-end">
                                    <button
                                        type="button"
                                        class="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        disabled={deletingFolder === folder.id}
                                        onclick={() => openDeleteFolderModal(folder)}
                                    >
                                        {deletingFolder === folder.id ? "Deleting..." : "Delete folder"}
                                    </button>
                                </div>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                            No folders yet. Keep blocks at the root or create folders when you need more structure.
                        </div>
                    {/if}
                </div>
            </div>

            <div class="space-y-4 xl:sticky xl:top-24 xl:self-start">
                <div
                    id="create-block-folder"
                    class="scroll-mt-20 space-y-4 rounded-2xl bg-slate-100/70 p-5"
                >
                    <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div class="space-y-1">
                            <h3 class="text-lg font-semibold text-slate-900">Add a folder</h3>
                            <p class="text-sm text-slate-600">Create structure only when shared sections need clearer grouping.</p>
                        </div>
                        <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Blocks</span>
                    </div>

                    <form
                        method="POST"
                        action="?/createBlockFolder"
                        class="grid gap-3"
                        use:enhance={({ formElement }) => {
                            clearSharedSectionsFeedback();
                            folderSubmitting = true;

                            return async ({ result, update }) => {
                                folderSubmitting = false;

                                if (result.type === "success" && result.data) {
                                    formElement.reset();
                                    sharedSectionsFeedback = {
                                        tone: "success",
                                        text: "Folder created successfully.",
                                    };
                                    applyReusableBlockResult(result.data as Record<string, unknown>);
                                } else if (result.type === "failure") {
                                    sharedSectionsFeedback = {
                                        tone: "error",
                                        text: `Failed to create folder: ${result.data?.error ?? "Unknown error"}`,
                                    };
                                }

                                await applyAction(result);
                                await update({ reset: true, invalidateAll: false });
                            };
                        }}
                    >
                        <div class="space-y-1">
                            <label for="folder-name" class="text-sm font-medium text-slate-700">Folder name</label>
                            <input
                                id="folder-name"
                                type="text"
                                name="name"
                                required
                                class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                            />
                        </div>
                        <div class="space-y-1">
                            <label for="folder-parent" class="text-sm font-medium text-slate-700">Parent folder</label>
                            <select
                                id="folder-parent"
                                name="parentId"
                                class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                            >
                                <option value="">Root</option>
                                {#each blockFolders ?? [] as folder}
                                    <option value={folder.id}>{folder.name}</option>
                                {/each}
                            </select>
                        </div>
                        <button
                            type="submit"
                            class="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={folderSubmitting}
                        >
                            {folderSubmitting ? "Creating..." : "Create folder"}
                        </button>
                    </form>
                </div>

                <div
                    id="create-block"
                    class="scroll-mt-20 space-y-4 rounded-2xl bg-slate-100/70 p-5"
                >
                    <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div class="space-y-1">
                            <h3 class="text-lg font-semibold text-slate-900">New shared section</h3>
                            <p class="text-sm text-slate-600">Choose a block type and optional folder, then publish when the section is ready for pages.</p>
                        </div>
                        <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Blocks</span>
                    </div>

                    <form
                        method="POST"
                        action="?/createReusableBlock"
                        class="grid gap-3"
                        use:enhance={({ formElement }) => {
                            clearSharedSectionsFeedback();
                            blockSubmitting = true;

                            return async ({ result, update }) => {
                                blockSubmitting = false;

                                if (result.type === "success" && result.data) {
                                    formElement.reset();
                                    sharedSectionsFeedback = {
                                        tone: "success",
                                        text: "Shared section created successfully.",
                                    };
                                    applyReusableBlockResult(result.data as Record<string, unknown>);
                                } else if (result.type === "failure") {
                                    sharedSectionsFeedback = {
                                        tone: "error",
                                        text: `Failed to create shared section: ${result.data?.error ?? "Unknown error"}`,
                                    };
                                }

                                await applyAction(result);
                                await update({ reset: true, invalidateAll: false });
                            };
                        }}
                    >
                        <div class="space-y-1">
                            <label for="block-name" class="text-sm font-medium text-slate-700">Section name</label>
                            <input
                                id="block-name"
                                type="text"
                                name="name"
                                placeholder="Homepage hero"
                                required
                                class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                            />
                        </div>
                        <div class="space-y-1">
                            <label for="block-type" class="text-sm font-medium text-slate-700">Section type</label>
                            <select
                                id="block-type"
                                name="blockType"
                                required
                                class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                            >
                                {#each blockDefinitions as definition}
                                    <option value={definition.type}>{definition.label}</option>
                                {/each}
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label for="block-folder" class="text-sm font-medium text-slate-700">Folder</label>
                            <select
                                id="block-folder"
                                name="folderId"
                                class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                            >
                                <option value="">Root</option>
                                {#each blockFolders ?? [] as folder}
                                    <option value={folder.id}>{folder.name}</option>
                                {/each}
                            </select>
                        </div>
                        <button
                            type="submit"
                            class="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={blockSubmitting}
                        >
                            {blockSubmitting ? "Creating..." : "Create section"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </section>
</main>

<ActionModal
    open={showDeletePageModal && pendingDeletePage !== null}
    title="Delete page"
    description={
        pendingDeletePage
            ? `Delete “${pendingDeletePage.title}” at ${displaySlug(pendingDeletePage.slug)}.`
            : null
    }
    onClose={closeDeletePageModal}
>
    {#if pendingDeletePage}
        <form
            method="POST"
            action="?/deletePage"
            class="flex items-center justify-end gap-2"
            use:enhance={({ formData }) => {
                const slug = String(formData.get("slug") ?? "");
                clearPageFeedback();
                deletingPage = slug;

                return async ({ result, update }) => {
                    deletingPage = null;

                    if (result.type === "success") {
                        pageFeedback = {
                            tone: "success",
                            text: "Page deleted successfully.",
                        };
                        closeDeletePageModal();
                    } else if (result.type === "failure") {
                        pageFeedback = {
                            tone: "error",
                            text: "Failed to delete page: " + (result.data?.error || "Unknown error"),
                        };
                    }

                    await applyAction(result);
                    await update({
                        reset: false,
                        invalidateAll: false,
                    });

                    if (result.type === "success" && result.data && "pages" in result.data) {
                        pagesStore.set(result.data.pages as Page[]);
                    }
                };
            }}
        >
            <input type="hidden" name="slug" value={pendingDeletePage.slug} />
            <button
                type="button"
                class="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onclick={closeDeletePageModal}
            >
                Cancel
            </button>
            <button
                type="submit"
                class="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={deletingPage === pendingDeletePage.slug}
            >
                {deletingPage === pendingDeletePage.slug ? "Deleting..." : "Delete page"}
            </button>
        </form>
    {/if}
</ActionModal>

<ActionModal
    open={showDeleteFolderModal && pendingDeleteFolder !== null}
    title="Delete folder"
    description={
        pendingDeleteFolder
            ? `Delete “${pendingDeleteFolder.name}” only if it has no child folders and no reusable blocks.`
            : null
    }
    onClose={closeDeleteFolderModal}
>
    {#if pendingDeleteFolder}
        <form
            method="POST"
            action="?/deleteBlockFolder"
            class="flex items-center justify-end gap-2"
            use:enhance={({ formData }) => {
                deletingFolder = String(formData.get("id") ?? "");
                clearSharedSectionsFeedback();

                return async ({ result, update }) => {
                    deletingFolder = null;

                    if (result.type === "success" && result.data) {
                        sharedSectionsFeedback = {
                            tone: "success",
                            text: "Folder deleted successfully.",
                        };
                        applyReusableBlockResult(result.data as Record<string, unknown>);
                        closeDeleteFolderModal();
                    } else if (result.type === "failure") {
                        sharedSectionsFeedback = {
                            tone: "error",
                            text: `Failed to delete folder: ${result.data?.error ?? "Unknown error"}`,
                        };
                    }

                    await applyAction(result);
                    await update({ reset: false, invalidateAll: false });
                };
            }}
        >
            <input type="hidden" name="id" value={pendingDeleteFolder.id} />
            <button
                type="button"
                class="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onclick={closeDeleteFolderModal}
            >
                Cancel
            </button>
            <button
                type="submit"
                class="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={deletingFolder === pendingDeleteFolder.id}
            >
                {deletingFolder === pendingDeleteFolder.id ? "Deleting..." : "Delete folder"}
            </button>
        </form>
    {/if}
</ActionModal>

<ActionModal
    open={showDeleteReusableBlockModal && pendingDeleteReusableBlock !== null}
    title="Delete reusable block"
    description={
        pendingDeleteReusableBlock
            ? `Deleting “${pendingDeleteReusableBlock.name}” will also remove its live references from the following pages:`
            : null
    }
    onClose={closeDeleteReusableBlockModal}
>
    {#if pendingDeleteReusableBlock}
        {#if pendingDeleteBlockPages.length > 0}
            <ul class="max-h-56 space-y-2 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                {#each pendingDeleteBlockPages as page (page.id)}
                    <li>{displayPageReference(page)}</li>
                {/each}
            </ul>
        {:else}
            <div class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                No pages currently reference this reusable block.
            </div>
        {/if}

        <form
            method="POST"
            action="?/deleteReusableBlock"
            class="flex items-center justify-end gap-2"
            use:enhance={({ formData }) => {
                deletingReusableBlock = String(formData.get("id") ?? "");
                clearSharedSectionsFeedback();

                return async ({ result, update }) => {
                    deletingReusableBlock = null;

                    if (result.type === "success" && result.data) {
                        sharedSectionsFeedback = {
                            tone: "success",
                            text: "Shared section deleted successfully.",
                        };
                        applyReusableBlockResult(result.data as Record<string, unknown>);
                        closeDeleteReusableBlockModal();
                    } else if (result.type === "failure") {
                        sharedSectionsFeedback = {
                            tone: "error",
                            text: `Failed to delete shared section: ${result.data?.error ?? "Unknown error"}`,
                        };
                    }

                    await applyAction(result);
                    await update({ reset: false, invalidateAll: false });
                };
            }}
        >
            <input type="hidden" name="id" value={pendingDeleteReusableBlock.id} />
            <button
                type="button"
                class="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onclick={closeDeleteReusableBlockModal}
            >
                Cancel
            </button>
            <button
                type="submit"
                class="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={deletingReusableBlock === pendingDeleteReusableBlock.id}
            >
                {deletingReusableBlock === pendingDeleteReusableBlock.id ? "Deleting..." : "Delete block"}
            </button>
        </form>
    {/if}
</ActionModal>
