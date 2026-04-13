<script lang="ts">
	import { browser } from '$app/environment';
	import { applyAction, enhance } from '$app/forms';
	import { blockFoldersStore, reusableBlocksStore } from '$lib/client/reusableBlocksStore';
	import { type BlockDefinition, type BlockFieldDefinition } from '$lib/blocks/registry';
	import BlockListEditor from '$lib/components/cms/BlockListEditor.svelte';
	import type { BlockListLocation, BlockPath } from '$lib/pageContentEditor';
	import { createDefaultBlockInstance } from '$lib/reusableBlocks';
	import {
		addNestedReusableBlockAtPath,
		createEditableReusableBlockContent,
		moveNestedReusableBlock,
		updateReusableBlockFieldValue,
		removeNestedReusableBlockAtPath,
		validateReusableBlockEditorState
	} from '$lib/reusableBlockEditor';
	import type { BlockValue } from '$lib/pageContent';
	import type { BlockInstance } from '$lib/pageContent';
	import type { BlockFolder, ReusableBlock } from '$lib/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let block = $state<ReusableBlock>({} as ReusableBlock);
	let blockFolders = $state<BlockFolder[]>([]);
	let definitions = $state<BlockDefinition[]>([]);
	let contentDraft = $state(createDefaultBlockInstance('text', 'placeholder-reusable-block'));
	let validationErrors = $state<Record<string, string>>({});
	let draggingPath = $state<string | null>(null);
	let successMessage = $state('');
	let errorMessage = $state('');
	let saving = $state(false);
	let publishing = $state(false);

	const resetMessages = () => {
		successMessage = '';
		errorMessage = '';
	};

	const currentDefinition = $derived(
		definitions.find((entry) => entry.type === block.block_type) ?? null
	);

	$effect(() => {
		block = data.block;
		blockFolders = data.blockFolders;
		definitions = data.blockDefinitions;
		contentDraft = createEditableReusableBlockContent(data.block.content);
		validationErrors = {};
		draggingPath = null;
	});

	const isTextareaField = (field: BlockFieldDefinition) =>
		field.type === 'string' && field.key.toLowerCase().includes('body');

	const getRootFieldError = (fieldKey: string) => validationErrors[`root:${fieldKey}`] ?? '';
	const getNestedBlocks = (value: BlockValue | undefined): BlockInstance[] =>
		Array.isArray(value) ? value : [];

	const parseStringValue = (value: string, field: BlockFieldDefinition): BlockValue | undefined => {
		if (field.type === 'number') {
			const trimmed = value.trim();
			if (!trimmed) return undefined;
			const parsed = Number(trimmed);
			return Number.isFinite(parsed) ? parsed : value;
		}

		if (field.type === 'date') {
			return value;
		}

		return value;
	};

	const syncValidation = (next: typeof contentDraft) => {
		validationErrors = validateReusableBlockEditorState(next);
		return next;
	};

	const handleRootFieldUpdate = (fieldKey: string, value: BlockValue | undefined) => {
		contentDraft = syncValidation(updateReusableBlockFieldValue(contentDraft, [], fieldKey, value));
	};

	const handleAddBlock = (location: BlockListLocation, type: string) => {
		if (location.parentPath === null || location.fieldKey === null) return;
		contentDraft = syncValidation(
			addNestedReusableBlockAtPath(contentDraft, location, type, crypto.randomUUID())
		);
	};

	const insertReusableReference = () => {
		// Reusable block editors do not allow nested reusable references.
	};

	const handleRemoveBlock = (path: BlockPath) => {
		contentDraft = syncValidation(removeNestedReusableBlockAtPath(contentDraft, path));
	};

	const handleMoveBlock = (path: BlockPath, toIndex: number) => {
		contentDraft = syncValidation(moveNestedReusableBlock(contentDraft, path, toIndex));
	};

	const handleNestedFieldUpdate = (path: BlockPath, fieldKey: string, value: BlockValue | undefined) => {
		contentDraft = syncValidation(updateReusableBlockFieldValue(contentDraft, path, fieldKey, value));
	};
</script>

<main class="mx-auto max-w-4xl space-y-6">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="space-y-2">
			<h1 class="text-3xl font-bold text-slate-900">Editing reusable block</h1>
			<p class="text-slate-700">
				Update the block name, folder, and fields for this reusable <span class="font-semibold">{block.block_type}</span> block.
			</p>
		</div>
		<a
			href="/blocks"
			class="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
		>
			Back to library
		</a>
	</div>

	{#if successMessage}
		<div class="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
			{successMessage}
		</div>
	{/if}

	{#if errorMessage}
		<div class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
			{errorMessage}
		</div>
	{/if}

	<section class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
		<div class="mb-5 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
			<div class="space-y-1">
				<div class="flex flex-wrap items-center gap-2">
					<span class="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
						{block.block_type}
					</span>
					{#if block.is_published}
						<span class="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
							Published
						</span>
					{:else}
						<span class="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
							Unpublished
						</span>
					{/if}
					{#if block.has_unpublished_changes}
						<span class="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-800">
							Draft changes
						</span>
					{/if}
				</div>
				<p class="text-sm text-slate-600">
					{#if block.last_published_at}
						Last published {new Date(block.last_published_at).toLocaleString()}.
					{:else}
						Not published yet.
					{/if}
				</p>
			</div>
			<form
				method="POST"
				action="?/publishReusableBlock"
				use:enhance={() => {
					resetMessages();
					publishing = true;

					return async ({ result, update }) => {
						publishing = false;

						if (result.type === 'success' && result.data) {
							successMessage = 'Reusable block published successfully!';
							if ('block' in result.data) {
								block = result.data.block as ReusableBlock;
								contentDraft = createEditableReusableBlockContent(block.content);
								validationErrors = {};
								draggingPath = null;
								if (browser) {
									reusableBlocksStore.update((current) =>
										current
											? current.map((entry) => (entry.id === block.id ? block : entry))
											: current
									);
								}
							}
							if ('blockFolders' in result.data) {
								blockFolders = result.data.blockFolders as BlockFolder[];
								if (browser) {
									blockFoldersStore.set(blockFolders);
								}
							}
						} else if (result.type === 'failure') {
							errorMessage = `Failed to publish reusable block: ${result.data?.error ?? 'Unknown error'}`;
						}

						await applyAction(result);
						await update({ reset: false, invalidateAll: false });
					};
				}}
			>
				<button
					type="submit"
					class="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
					disabled={publishing || saving || !block.has_unpublished_changes}
				>
					{publishing ? 'Publishing...' : 'Publish'}
				</button>
			</form>
		</div>

		<form
			method="POST"
			action="?/updateReusableBlock"
			class="space-y-5"
			use:enhance={({ formElement, cancel }) => {
				resetMessages();
				validationErrors = validateReusableBlockEditorState(contentDraft);
				if (Object.keys(validationErrors).length > 0) {
					cancel();
					errorMessage = 'Fix the highlighted block fields before saving.';
					formElement.reportValidity();
					return;
				}
				saving = true;

				return async ({ result, update }) => {
					saving = false;

					if (result.type === 'success' && result.data) {
						successMessage = 'Reusable block updated successfully!';
						if ('block' in result.data) {
							block = result.data.block as ReusableBlock;
							contentDraft = createEditableReusableBlockContent(block.content);
							validationErrors = {};
							draggingPath = null;
							if (browser) {
								reusableBlocksStore.update((current) =>
									current
										? current.map((entry) => (entry.id === block.id ? block : entry))
										: current
								);
							}
						}
						if ('blockFolders' in result.data) {
							blockFolders = result.data.blockFolders as BlockFolder[];
							if (browser) {
								blockFoldersStore.set(blockFolders);
							}
						}
					} else if (result.type === 'failure') {
						errorMessage = `Failed to update reusable block: ${result.data?.error ?? 'Unknown error'}`;
					}

					await applyAction(result);
					await update({ reset: false, invalidateAll: false });
					formElement.reportValidity();
				};
			}}
		>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-1">
					<label for="name" class="text-sm font-medium text-slate-700">Name</label>
					<input
						id="name"
						type="text"
						name="name"
						required
						value={block.name}
						class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
					/>
				</div>
				<div class="space-y-1">
					<label for="folderId" class="text-sm font-medium text-slate-700">Folder</label>
					<select
						id="folderId"
						name="folderId"
						class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
					>
						<option value="">Root</option>
						{#each blockFolders as folder}
							<option value={folder.id} selected={folder.id === block.folder_id}>{folder.name}</option>
						{/each}
					</select>
				</div>
			</div>

			<input type="hidden" name="content" value={JSON.stringify(contentDraft)} />

			<div class="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
				<div class="space-y-2">
					<h2 class="text-base font-semibold text-slate-900">Fields</h2>
					<p class="text-sm text-slate-600">
						Edit primitive fields inline and build nested block content for container-style reusable blocks.
					</p>
				</div>

				<div class="mt-4 grid gap-4">
					{#if currentDefinition}
						{#each currentDefinition.fields as field (field.key)}
							<div class="space-y-1">
								<label for={`field-${field.key}`} class="text-sm font-medium text-slate-700">
									{field.label}
								</label>
								{#if field.type === 'string' && isTextareaField(field)}
									<textarea
										id={`field-${field.key}`}
										rows="4"
										value={String(contentDraft.fields[field.key] ?? '')}
										required={field.required}
										class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
										oninput={(event) =>
											handleRootFieldUpdate(field.key, parseStringValue((event.currentTarget as HTMLTextAreaElement).value, field))}
									></textarea>
								{:else if field.type === 'string'}
									<input
										id={`field-${field.key}`}
										type="text"
										value={String(contentDraft.fields[field.key] ?? '')}
										required={field.required}
										class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
										oninput={(event) =>
											handleRootFieldUpdate(field.key, parseStringValue((event.currentTarget as HTMLInputElement).value, field))}
									/>
								{:else if field.type === 'date'}
									<input
										id={`field-${field.key}`}
										type="date"
										value={String(contentDraft.fields[field.key] ?? '')}
										class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
										oninput={(event) =>
											handleRootFieldUpdate(field.key, parseStringValue((event.currentTarget as HTMLInputElement).value, field))}
									/>
								{:else if field.type === 'number'}
									<input
										id={`field-${field.key}`}
										type="number"
										value={contentDraft.fields[field.key] ?? ''}
										class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
										oninput={(event) =>
											handleRootFieldUpdate(field.key, parseStringValue((event.currentTarget as HTMLInputElement).value, field))}
									/>
								{:else if field.type === 'boolean'}
									<label
										for={`field-${field.key}`}
										class="flex items-start gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700"
									>
										<input
											id={`field-${field.key}`}
											type="checkbox"
											checked={Boolean(contentDraft.fields[field.key])}
											class="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
											onchange={(event) =>
												handleRootFieldUpdate(field.key, (event.currentTarget as HTMLInputElement).checked)}
										/>
										<span class="block text-slate-900">{field.label}</span>
									</label>
								{:else}
									<div class="rounded-xl border border-slate-200 bg-white p-4">
										<BlockListEditor
											blocks={getNestedBlocks(contentDraft.fields[field.key])}
											location={{ parentPath: [], fieldKey: field.key }}
											allowedTypes={field.blocks?.allowedTypes ?? null}
											pathPrefix={[]}
											title={field.label}
											description="Nested blocks"
											errors={validationErrors}
											{draggingPath}
											onInsertReusableBlockReference={insertReusableReference}
											onAddBlock={handleAddBlock}
											onRemoveBlock={handleRemoveBlock}
											onMoveBlock={handleMoveBlock}
											onUpdateField={handleNestedFieldUpdate}
											onStartDrag={(path) => (draggingPath = path.join('.'))}
											onEndDrag={() => (draggingPath = null)}
										/>
									</div>
								{/if}
								{#if getRootFieldError(field.key)}
									<p class="text-sm text-red-600">{getRootFieldError(field.key)}</p>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<div class="flex items-center justify-end">
				<button
					type="submit"
					class="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
					disabled={saving || publishing}
				>
					{saving ? 'Saving draft...' : 'Save draft'}
				</button>
			</div>
		</form>
	</section>
</main>
