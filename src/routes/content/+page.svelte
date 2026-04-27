<script lang="ts">
    import { browser } from "$app/environment";
    import { applyAction, enhance } from "$app/forms";
    import { getToastState } from "$lib/Toasts/ToastState.svelte";
    import {
        blockFoldersStore,
        reusableBlocksStore,
    } from "$lib/client/reusableBlocksStore";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { listBlockDefinitions } from "$lib/blocks/registry";
    import ActionModal from "$lib/components/cms/ActionModal.svelte";
    import CmsEmptyState from "$lib/components/cms/CmsEmptyState.svelte";
    import type {
        BlockFolder,
        ReusableBlock,
        ReferencingPage,
    } from "$lib/types";
    import type { PageProps } from "./$types";
    import ReusableBlockLibraryTreeItem from "./ReusableBlockLibraryTreeItem.svelte";
    import { buildReusableBlocksTree } from "$lib/Sidebar/Index";

    let { data }: PageProps = $props();

    let closedNodes = $state<Record<string, boolean>>({});
    let createFolderSubmitting = $state(false);
    let createBlockSubmitting = $state(false);
    let deletePending = $state(false);
    let modalState = $state<
        | { kind: "deleteFolder"; id: string; name: string }
        | {
              kind: "deleteBlock";
              id: string;
              name: string;
              references: ReferencingPage[];
          }
        | null
    >(null);
    let reusableBlockPageReferences = $state<Record<string, ReferencingPage[]>>(
        {},
    );

    const toastState = getToastState();
    const currentBlockFolders = $derived(
        browser ? ($blockFoldersStore ?? data.blockFolders) : data.blockFolders,
    );
    const currentReusableBlocks = $derived(
        browser
            ? ($reusableBlocksStore ?? data.reusableBlocks)
            : data.reusableBlocks,
    );
    const currentBlockDefinitions = $derived(
        data.blockDefinitions ?? listBlockDefinitions(),
    );
    const reusableBlocksTree = $derived(
        buildReusableBlocksTree(currentBlockFolders, currentReusableBlocks),
    );

    const syncLibraryState = (result: {
        blockFolders?: BlockFolder[];
        reusableBlocks?: ReusableBlock[];
        reusableBlockPageReferences?: Record<string, ReferencingPage[]>;
    }) => {
        if (result.blockFolders) {
            blockFoldersStore.set(result.blockFolders);
        }
        if (result.reusableBlocks) {
            reusableBlocksStore.set(result.reusableBlocks);
        }
        if (result.reusableBlockPageReferences) {
            reusableBlockPageReferences = result.reusableBlockPageReferences;
        }
    };

    const toggleNode = (id: string) => {
        closedNodes = {
            ...closedNodes,
            [id]: !closedNodes[id],
        };
    };

    const openDeleteFolderModal = (id: string, name: string) => {
        modalState = { kind: "deleteFolder", id, name };
    };

    const openDeleteBlockModal = (id: string, name: string) => {
        modalState = {
            kind: "deleteBlock",
            id,
            name,
            references: reusableBlockPageReferences[id] ?? [],
        };
    };

    const closeModal = () => {
        modalState = null;
        deletePending = false;
    };

    $effect(() => {
        reusableBlockPageReferences = data.reusableBlockPageReferences ?? {};
    });
</script>

<svelte:head>
    <title>Content</title>
</svelte:head>

<main class="space-y-8">
    <section class="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <form
            method="POST"
            action="?/createBlockFolder"
            class="rounded-[1.75rem] border border-border/80 bg-card p-5 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.45)]"
            use:enhance={({ formElement }) => {
                createFolderSubmitting = true;

                return async ({ result, update }) => {
                    createFolderSubmitting = false;

                    if (result.type === "success" && result.data) {
                        formElement.reset();
                        toastState.success("Folder created.");
                        syncLibraryState(
                            result.data as Record<string, unknown>,
                        );
                    } else if (result.type === "failure") {
                        toastState.error(
                            `Failed to create folder: ${result.data?.error ?? "Unknown error"}`,
                        );
                    }

                    await applyAction(result);
                    await update({ reset: false, invalidateAll: false });
                };
            }}
        >
            <div class="space-y-2">
                <p
                    class="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
                >
                    Folder admin
                </p>
                <h2 class="text-2xl font-black tracking-tight text-foreground">
                    New folder
                </h2>
                <p class="max-w-prose text-sm leading-6 text-muted-foreground">
                    Use folders to shape the library tree before you create
                    shared content.
                </p>
            </div>

            <div class="mt-5 grid gap-4">
                <div class="space-y-1">
                    <Label for="folder-name">Folder name</Label>
                    <Input
                        id="folder-name"
                        type="text"
                        name="name"
                        required
                        placeholder="Homepage, Product, Footer"
                        class="h-11 rounded-2xl"
                    />
                </div>
                <div class="space-y-1">
                    <Label for="folder-parent">Parent folder</Label>
                    <select
                        id="folder-parent"
                        name="parentId"
                        class="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-11 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus-visible:ring-3"
                    >
                        <option value="">Root</option>
                        {#each currentBlockFolders as folder}
                            <option value={folder.id}>{folder.name}</option>
                        {/each}
                    </select>
                </div>
                <Button
                    type="submit"
                    class="h-11 rounded-2xl"
                    disabled={createFolderSubmitting}
                >
                    {createFolderSubmitting
                        ? "Creating folder..."
                        : "Create folder"}
                </Button>
            </div>
        </form>

        <form
            method="POST"
            action="?/createReusableBlock"
            class="rounded-[1.75rem] border border-border/80 bg-card p-5 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.45)]"
            use:enhance={({ formElement }) => {
                createBlockSubmitting = true;

                return async ({ result, update }) => {
                    createBlockSubmitting = false;

                    if (result.type === "success" && result.data) {
                        formElement.reset();
                        toastState.success("Shared content created.");
                        syncLibraryState(
                            result.data as Record<string, unknown>,
                        );
                    } else if (result.type === "failure") {
                        toastState.error(
                            `Failed to create shared content: ${result.data?.error ?? "Unknown error"}`,
                        );
                    }

                    await applyAction(result);
                    await update({ reset: false, invalidateAll: false });
                };
            }}
        >
            <div class="space-y-2">
                <p
                    class="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
                >
                    Content item
                </p>
                <h2 class="text-2xl font-black tracking-tight text-foreground">
                    New content item
                </h2>
                <p class="max-w-prose text-sm leading-6 text-muted-foreground">
                    Choose a registered block type, give it a clear name, and
                    place it in the tree.
                </p>
            </div>

            <div class="mt-5 grid gap-4">
                <div class="space-y-1">
                    <Label for="block-name">Content name</Label>
                    <Input
                        id="block-name"
                        type="text"
                        name="name"
                        required
                        placeholder="Homepage hero, Footer note"
                        class="h-11 rounded-2xl"
                    />
                </div>
                <div class="space-y-1">
                    <Label for="block-type">Block type</Label>
                    <select
                        id="block-type"
                        name="blockType"
                        required
                        class="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-11 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus-visible:ring-3"
                    >
                        {#each currentBlockDefinitions as definition}
                            <option value={definition.type}
                                >{definition.label}</option
                            >
                        {/each}
                    </select>
                </div>
                <div class="space-y-1">
                    <Label for="block-folder">Folder</Label>
                    <select
                        id="block-folder"
                        name="folderId"
                        class="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-11 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus-visible:ring-3"
                    >
                        <option value="">Root</option>
                        {#each currentBlockFolders as folder}
                            <option value={folder.id}>{folder.name}</option>
                        {/each}
                    </select>
                </div>
                <Button
                    type="submit"
                    variant="secondary"
                    class="h-11 rounded-2xl"
                    disabled={createBlockSubmitting}
                >
                    {createBlockSubmitting
                        ? "Creating content..."
                        : "Create content"}
                </Button>
            </div>
        </form>
    </section>

    <section
        class="rounded-[2rem] border border-border/80 bg-card p-5 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.45)]"
    >
        <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="space-y-2">
                <p
                    class="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
                >
                    Library tree
                </p>
                <h2 class="text-2xl font-black tracking-tight text-foreground">
                    Folders and content items
                </h2>
                <p class="max-w-2xl text-sm leading-6 text-muted-foreground">
                    Open any content item to edit it in dedicated editor. Delete
                    actions stay behind confirmation.
                </p>
            </div>
            <div
                class="rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground"
            >
                <span class="font-semibold text-foreground"
                    >{currentBlockFolders.length}</span
                >
                folders,
                <span class="font-semibold text-foreground"
                    >{currentReusableBlocks.length}</span
                > content items
            </div>
        </div>

        <div class="mt-6">
            {#if currentBlockFolders.length === 0 && currentReusableBlocks.length === 0}
                <CmsEmptyState
                    eyebrow="Empty library"
                    title="Create reusable content for shared sections."
                    description="Start with a folder if you want structure first, or create a content item and move it into folders later."
                />
            {:else}
                <div class="space-y-4">
                    {#each reusableBlocksTree.folders as folder (folder.folder?.id)}
                        <ReusableBlockLibraryTreeItem
                            node={folder}
                            depth={0}
                            {closedNodes}
                            onToggle={toggleNode}
                            onDeleteFolder={openDeleteFolderModal}
                            onDeleteBlock={openDeleteBlockModal}
                        />
                    {/each}

                    {#each reusableBlocksTree.blocks as block (block.id)}
                        <div
                            class="flex items-center gap-3 rounded-2xl border border-border bg-muted/35 px-4 py-3 shadow-[0_12px_36px_-28px_rgba(15,23,42,0.45)]"
                        >
                            <a
                                href={`/content/${block.id}`}
                                class="min-w-0 flex-1"
                            >
                                <div class="flex items-center gap-2">
                                    <span
                                        class="truncate font-medium text-foreground"
                                        >{block.name}</span
                                    >
                                    {#if !block.is_published || block.has_unpublished_changes}
                                        <Badge
                                            class="bg-amber-500/15 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300"
                                        >
                                            Draft
                                        </Badge>
                                    {/if}
                                </div>
                                <div
                                    class="mt-1 flex items-center gap-2 text-xs text-muted-foreground"
                                >
                                    <Badge
                                        variant="outline"
                                        class="uppercase tracking-[0.2em]"
                                    >
                                        {block.block_type}
                                    </Badge>
                                    <span
                                        >Open in the editor to refine the draft
                                        and publish it.</span
                                    >
                                </div>
                            </a>

                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                class="rounded-full"
                                aria-label={`Delete ${block.name}`}
                                onclick={() =>
                                    openDeleteBlockModal(block.id, block.name)}
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
                            </Button>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </section>
</main>

<ActionModal
    open={modalState !== null}
    title={modalState?.kind === "deleteFolder"
        ? "Delete folder"
        : modalState?.kind === "deleteBlock"
          ? "Delete content"
          : ""}
    description={modalState?.kind === "deleteFolder"
        ? `Delete “${modalState.name}” only if it has no child folders and no content items.`
        : modalState?.kind === "deleteBlock"
          ? modalState.references.length > 0
              ? `Moving “${modalState.name}” to trash will remove it from published and draft pages using it:`
              : `Move “${modalState.name}” to trash.`
          : null}
    onClose={closeModal}
>
    {#if modalState?.kind === "deleteFolder"}
        <div class="flex items-center justify-end gap-2">
            <button
                type="button"
                class="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onclick={closeModal}
            >
                Cancel
            </button>
            <form
                method="POST"
                action="?/deleteBlockFolder"
                use:enhance={() => {
                    deletePending = true;

                    return async ({ result, update }) => {
                        deletePending = false;

                        if (result.type === "success" && result.data) {
                            toastState.success("Folder deleted.");
                            syncLibraryState(
                                result.data as Record<string, unknown>,
                            );
                            closeModal();
                        } else if (result.type === "failure") {
                            toastState.error(
                                `Failed to delete folder: ${result.data?.error ?? "Unknown error"}`,
                            );
                        }

                        await applyAction(result);
                        await update({ reset: false, invalidateAll: false });
                    };
                }}
            >
                <input type="hidden" name="id" value={modalState.id} />
                <button
                    type="submit"
                    class="inline-flex items-center rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={deletePending}
                >
                    {deletePending ? "Deleting..." : "Delete folder"}
                </button>
            </form>
        </div>
    {:else if modalState?.kind === "deleteBlock"}
        <div class="space-y-4">
            {#if modalState.references.length > 0}
                <ul
                    class="max-h-56 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                >
                    {#each modalState.references as page (page.id)}
                        <li class="rounded-xl bg-white px-3 py-2 shadow-sm">
                            {page.title}
                            <span class="text-slate-500">({page.path})</span>
                        </li>
                    {/each}
                </ul>
            {:else}
                <div
                    class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                >
                    No pages currently reference this content item.
                </div>
            {/if}

            <div class="flex items-center justify-end gap-2">
                <button
                    type="button"
                    class="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    onclick={closeModal}
                >
                    Cancel
                </button>
                <form
                    method="POST"
                    action="?/deleteReusableBlock"
                    use:enhance={() => {
                        deletePending = true;

                        return async ({ result, update }) => {
                            deletePending = false;

                            if (result.type === "success" && result.data) {
                                toastState.success("Content moved to trash.");
                                syncLibraryState(
                                    result.data as Record<string, unknown>,
                                );
                                closeModal();
                            } else if (result.type === "failure") {
                                toastState.error(
                                    `Failed to delete content: ${result.data?.error ?? "Unknown error"}`,
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
                    <input type="hidden" name="id" value={modalState.id} />
                    <button
                        type="submit"
                        class="inline-flex items-center rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={deletePending}
                    >
                        {deletePending
                            ? "Moving..."
                            : modalState.references.length > 0
                              ? "Move to trash anyway"
                              : "Move to trash"}
                    </button>
                </form>
            </div>
        </div>
    {/if}
</ActionModal>
