<script lang="ts">
	import { browser } from '$app/environment';
	import { applyAction, enhance } from '$app/forms';
	import { blockFoldersStore, reusableBlocksStore } from '$lib/client/reusableBlocksStore';
	import { listBlockDefinitions } from '$lib/blocks/registry';
	import ActionModal from '$lib/components/cms/ActionModal.svelte';
	import { buildReusableBlocksTree } from '$lib/components/cms/reusableBlocksTree';
	import type { BlockFolder, ReusableBlock, ReferencingPage } from '$lib/types';
	import type { PageProps } from './$types';
	import ReusableBlockLibraryTreeItem from './ReusableBlockLibraryTreeItem.svelte';

	let { data }: PageProps = $props();

	let closedNodes = $state<Record<string, boolean>>({});
	let feedback = $state<{ tone: 'success' | 'error'; text: string } | null>(null);
	let createFolderSubmitting = $state(false);
	let createBlockSubmitting = $state(false);
	let deletePending = $state(false);
	let modalState = $state<
		| { kind: 'deleteFolder'; id: string; name: string }
		| { kind: 'deleteBlock'; id: string; name: string; references: ReferencingPage[] }
		| null
	>(null);
	let reusableBlockPageReferences = $state<Record<string, ReferencingPage[]>>({});

	const currentBlockFolders = $derived(
		browser ? ($blockFoldersStore ?? data.blockFolders) : data.blockFolders
	);
	const currentReusableBlocks = $derived(
		browser ? ($reusableBlocksStore ?? data.reusableBlocks) : data.reusableBlocks
	);
	const currentBlockDefinitions = $derived(data.blockDefinitions ?? listBlockDefinitions());
	const reusableBlocksTree = $derived(
		buildReusableBlocksTree(currentBlockFolders, currentReusableBlocks)
	);

	const resetFeedback = () => {
		feedback = null;
	};

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
			[id]: !closedNodes[id]
		};
	};

	const openDeleteFolderModal = (id: string, name: string) => {
		feedback = null;
		modalState = { kind: 'deleteFolder', id, name };
	};

	const openDeleteBlockModal = (id: string, name: string) => {
		feedback = null;
		modalState = {
			kind: 'deleteBlock',
			id,
			name,
			references: reusableBlockPageReferences[id] ?? []
		};
	};

	const closeModal = () => {
		modalState = null;
		deletePending = false;
	};
</script>

<svelte:head>
	<title>Content</title>
</svelte:head>

<main class="space-y-8">
	<section class="relative overflow-hidden rounded-[2rem] border border-slate-900/10 bg-[linear-gradient(135deg,oklch(0.18_0.035_250)_0%,oklch(0.24_0.03_245)_48%,oklch(0.95_0.02_94)_48%,oklch(0.97_0.015_88)_100%)] px-6 py-8 text-white shadow-[0_30px_90px_-38px_rgba(15,23,42,0.75)] sm:px-8">
		<div class="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_70%)] lg:block"></div>
		<div class="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
			<div class="space-y-4">
				<p class="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">Content</p>
				<h1 class="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
					Create shared content here. Edit it elsewhere. Keep the CMS tree clean.
				</h1>
				<p class="max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
					This is dedicated surface for folders and content items. Sidebar stays focused on navigation
					while this page handles creation, organization, and direct links into the editor.
				</p>
			</div>

			<div class="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
				<div class="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm">
					<div class="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Folders</div>
					<div class="mt-2 text-3xl font-black text-white">{currentBlockFolders.length}</div>
				</div>
				<div class="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm">
					<div class="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Content items</div>
					<div class="mt-2 text-3xl font-black text-white">{currentReusableBlocks.length}</div>
				</div>
				<div class="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm">
					<div class="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Block types</div>
					<div class="mt-2 text-3xl font-black text-white">{currentBlockDefinitions.length}</div>
				</div>
			</div>
		</div>
	</section>

	{#if feedback}
		<div
			class={[
				'rounded-2xl border px-4 py-3 text-sm shadow-sm',
				feedback.tone === 'success'
					? 'border-emerald-200 bg-emerald-50 text-emerald-800'
					: 'border-red-200 bg-red-50 text-red-800'
			].join(' ')}
		>
			{feedback.text}
		</div>
	{/if}

	<section class="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
		<form
			method="POST"
			action="?/createBlockFolder"
			class="rounded-[1.75rem] border border-slate-900/10 bg-white p-5 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.6)]"
			use:enhance={({ formElement }) => {
				resetFeedback();
				createFolderSubmitting = true;

				return async ({ result, update }) => {
					createFolderSubmitting = false;

					if (result.type === 'success' && result.data) {
						formElement.reset();
						feedback = {
							tone: 'success',
							text: 'Folder created.'
						};
						syncLibraryState(result.data as Record<string, unknown>);
					} else if (result.type === 'failure') {
						feedback = {
							tone: 'error',
							text: `Failed to create folder: ${result.data?.error ?? 'Unknown error'}`
						};
					}

					await applyAction(result);
					await update({ reset: false, invalidateAll: false });
				};
			}}
		>
			<div class="space-y-2">
				<p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Folder admin</p>
				<h2 class="text-2xl font-black tracking-tight text-slate-950">New folder</h2>
				<p class="max-w-prose text-sm leading-6 text-slate-600">
					Use folders to shape the library tree before you create shared content.
				</p>
			</div>

			<div class="mt-5 grid gap-4">
				<div class="space-y-1">
					<label for="folder-name" class="text-sm font-medium text-slate-700">Folder name</label>
					<input
						id="folder-name"
						type="text"
						name="name"
						required
						placeholder="Homepage, Product, Footer"
						class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
					/>
				</div>
				<div class="space-y-1">
					<label for="folder-parent" class="text-sm font-medium text-slate-700">Parent folder</label>
					<select
						id="folder-parent"
						name="parentId"
						class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
					>
						<option value="">Root</option>
						{#each currentBlockFolders as folder}
							<option value={folder.id}>{folder.name}</option>
						{/each}
					</select>
				</div>
				<button
					type="submit"
					class="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
					disabled={createFolderSubmitting}
				>
					{createFolderSubmitting ? 'Creating folder...' : 'Create folder'}
				</button>
			</div>
		</form>

		<form
			method="POST"
			action="?/createReusableBlock"
			class="rounded-[1.75rem] border border-slate-900/10 bg-white p-5 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.6)]"
			use:enhance={({ formElement }) => {
				resetFeedback();
				createBlockSubmitting = true;

				return async ({ result, update }) => {
					createBlockSubmitting = false;

					if (result.type === 'success' && result.data) {
						formElement.reset();
						feedback = {
							tone: 'success',
							text: 'Shared content created.'
						};
						syncLibraryState(result.data as Record<string, unknown>);
					} else if (result.type === 'failure') {
						feedback = {
							tone: 'error',
							text: `Failed to create shared content: ${result.data?.error ?? 'Unknown error'}`
						};
					}

					await applyAction(result);
					await update({ reset: false, invalidateAll: false });
				};
			}}
		>
			<div class="space-y-2">
				<p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Content item</p>
				<h2 class="text-2xl font-black tracking-tight text-slate-950">New content item</h2>
				<p class="max-w-prose text-sm leading-6 text-slate-600">
					Choose a registered block type, give it a clear name, and place it in the tree.
				</p>
			</div>

			<div class="mt-5 grid gap-4">
				<div class="space-y-1">
					<label for="block-name" class="text-sm font-medium text-slate-700">Content name</label>
					<input
						id="block-name"
						type="text"
						name="name"
						required
						placeholder="Homepage hero, Footer note"
						class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
					/>
				</div>
				<div class="space-y-1">
					<label for="block-type" class="text-sm font-medium text-slate-700">Block type</label>
					<select
						id="block-type"
						name="blockType"
						required
						class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
					>
						{#each currentBlockDefinitions as definition}
							<option value={definition.type}>{definition.label}</option>
						{/each}
					</select>
				</div>
				<div class="space-y-1">
					<label for="block-folder" class="text-sm font-medium text-slate-700">Folder</label>
					<select
						id="block-folder"
						name="folderId"
						class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
					>
						<option value="">Root</option>
						{#each currentBlockFolders as folder}
							<option value={folder.id}>{folder.name}</option>
						{/each}
					</select>
				</div>
				<button
					type="submit"
					class="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
					disabled={createBlockSubmitting}
				>
					{createBlockSubmitting ? 'Creating content...' : 'Create content'}
				</button>
			</div>
		</form>
	</section>

	<section class="rounded-[2rem] border border-slate-900/10 bg-white p-5 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.6)]">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div class="space-y-2">
				<p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Library tree</p>
				<h2 class="text-2xl font-black tracking-tight text-slate-950">Folders and content items</h2>
				<p class="max-w-2xl text-sm leading-6 text-slate-600">
					Open any content item to edit it in dedicated editor. Delete actions stay behind confirmation.
				</p>
			</div>
			<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
				<span class="font-semibold text-slate-900">{currentBlockFolders.length}</span> folders,
				<span class="font-semibold text-slate-900">{currentReusableBlocks.length}</span> content items
			</div>
		</div>

		<div class="mt-6">
			{#if currentBlockFolders.length === 0 && currentReusableBlocks.length === 0}
				<div class="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm text-slate-500">
					No content yet. Create first folder or content item above.
				</div>
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
						<div class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-[0_12px_36px_-28px_rgba(15,23,42,0.45)]">
							<a href={`/content/${block.id}`} class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<span class="truncate font-medium text-slate-900">{block.name}</span>
									{#if !block.is_published || block.has_unpublished_changes}
										<span class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800">
											Draft
										</span>
									{/if}
								</div>
								<div class="mt-1 flex items-center gap-2 text-xs text-slate-500">
									<span class="rounded-full bg-slate-100 px-2 py-0.5 font-semibold uppercase tracking-[0.2em] text-slate-600">
										{block.block_type}
									</span>
									<span>Open in the editor to refine the draft and publish it.</span>
								</div>
							</a>

							<button
								type="button"
								class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700 transition hover:border-red-300 hover:bg-red-100"
								aria-label={`Delete ${block.name}`}
								onclick={() => openDeleteBlockModal(block.id, block.name)}
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
	</section>
</main>

<ActionModal
	open={modalState !== null}
	title={modalState?.kind === 'deleteFolder' ? 'Delete folder' : modalState?.kind === 'deleteBlock' ? 'Delete content' : ''}
	description={
		modalState?.kind === 'deleteFolder'
			? `Delete “${modalState.name}” only if it has no child folders and no content items.`
			: modalState?.kind === 'deleteBlock'
				? `Deleting “${modalState.name}” will remove its live references from the following pages:`
				: null
	}
	onClose={closeModal}
>
	{#if modalState?.kind === 'deleteFolder'}
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
					resetFeedback();

					return async ({ result, update }) => {
						deletePending = false;

						if (result.type === 'success' && result.data) {
							feedback = {
								tone: 'success',
								text: 'Folder deleted.'
							};
							syncLibraryState(result.data as Record<string, unknown>);
							closeModal();
						} else if (result.type === 'failure') {
							feedback = {
								tone: 'error',
								text: `Failed to delete folder: ${result.data?.error ?? 'Unknown error'}`
							};
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
					{deletePending ? 'Deleting...' : 'Delete folder'}
				</button>
			</form>
		</div>
	{:else if modalState?.kind === 'deleteBlock'}
		<div class="space-y-4">
			{#if modalState.references.length > 0}
				<ul class="max-h-56 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
					{#each modalState.references as page (page.id)}
						<li class="rounded-xl bg-white px-3 py-2 shadow-sm">{page.title} <span class="text-slate-500">({page.slug})</span></li>
					{/each}
				</ul>
			{:else}
				<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
					No draft pages currently reference this content item.
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
						resetFeedback();

						return async ({ result, update }) => {
							deletePending = false;

							if (result.type === 'success' && result.data) {
								feedback = {
									tone: 'success',
									text: 'Content deleted.'
								};
								syncLibraryState(result.data as Record<string, unknown>);
								closeModal();
							} else if (result.type === 'failure') {
								feedback = {
									tone: 'error',
									text: `Failed to delete content: ${result.data?.error ?? 'Unknown error'}`
								};
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
						{deletePending ? 'Deleting...' : 'Delete content'}
					</button>
				</form>
			</div>
		</div>
	{/if}
</ActionModal>
