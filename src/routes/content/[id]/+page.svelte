<script lang="ts">
	import { browser } from '$app/environment';
	import { applyAction, enhance } from '$app/forms';
	import { type BlockDefinition, type BlockFieldDefinition } from '$lib/blocks/registry';
	import { blockFoldersStore, reusableBlocksStore } from '$lib/client/reusableBlocksStore';
	import BlockListEditor from '$lib/components/cms/BlockListEditor.svelte';
	import type { BlockListLocation, BlockPath } from '$lib/pageContentEditor';
	import type { BlockInstance, BlockValue } from '$lib/pageContent';
	import { createDefaultBlockInstance } from '$lib/reusableBlocks';
	import {
		addNestedReusableBlockAtPath,
		createEditableReusableBlockContent,
		moveNestedReusableBlock,
		removeNestedReusableBlockAtPath,
		updateReusableBlockFieldValue,
		validateReusableBlockEditorState
	} from '$lib/reusableBlockEditor';
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

	const inputClass =
		'w-full rounded-2xl border border-stone-300/80 bg-white px-4 py-3 text-sm text-stone-900 shadow-[0_1px_0_rgba(41,37,36,0.04)] outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-4 focus:ring-stone-200/70';
	const captionClass = 'text-[10px] font-medium uppercase tracking-[0.24em] text-stone-500';

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
	const formatTimestamp = (value?: string | null) => (value ? new Date(value).toLocaleString() : '—');

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

<main class="mx-auto max-w-[96rem] px-4 pb-10 pt-6 sm:px-6 lg:px-8">
	<header class="border-b border-stone-300/70 pb-8">
		<div class="flex flex-wrap items-start justify-between gap-6">
			<div class="max-w-3xl space-y-3">
				<p class={captionClass}>Content editor</p>
				<h1 class="text-[2.6rem] font-semibold tracking-[-0.045em] text-stone-950 sm:text-5xl">
					{block.name}
				</h1>
				<p class="max-w-[62ch] text-base leading-7 text-stone-600">
					Update content name, folder, and fields for this <span class="font-semibold text-stone-900">{block.block_type}</span> content item.
				</p>
			</div>
			<a
				href="/content"
				class="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-200/70"
			>
				Back to Content
			</a>
		</div>
	</header>

	<div class="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
		<form
			id="update-reusable-block-form"
			method="POST"
			action="?/updateReusableBlock"
			class="space-y-8"
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
						successMessage = 'Content updated successfully!';
						if ('block' in result.data) {
							block = result.data.block as ReusableBlock;
							contentDraft = createEditableReusableBlockContent(block.content);
							validationErrors = {};
							draggingPath = null;
							if (browser) {
								reusableBlocksStore.update((current) =>
									current ? current.map((entry) => (entry.id === block.id ? block : entry)) : current
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
						errorMessage = `Failed to update content: ${result.data?.error ?? 'Unknown error'}`;
					}

					await applyAction(result);
					await update({ reset: false, invalidateAll: false });
					formElement.reportValidity();
				};
			}}
		>
			<input type="hidden" name="content" value={JSON.stringify(contentDraft)} />

			<div class="space-y-8">
				<section class="space-y-5">
					<div class="space-y-2">
						<p class={captionClass}>Identity</p>
						<h2 class="text-[1.65rem] font-semibold tracking-[-0.035em] text-stone-950">Name and location</h2>
						<p class="max-w-[62ch] text-base leading-7 text-stone-600">
							Keep content name recognizable in sidebar and page insertion flows.
						</p>
					</div>

					<div class="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
						<div class="space-y-2">
							<label for="name" class="text-sm font-medium text-stone-800">Name</label>
							<input id="name" type="text" name="name" required value={block.name} class={inputClass} />
						</div>
						<div class="space-y-2">
							<label for="folderId" class="text-sm font-medium text-stone-800">Folder</label>
							<select id="folderId" name="folderId" class={inputClass}>
								<option value="">Root</option>
								{#each blockFolders as folder}
									<option value={folder.id} selected={folder.id === block.folder_id}>{folder.name}</option>
								{/each}
							</select>
						</div>
					</div>
				</section>

				<section class="space-y-5">
					<div class="space-y-2">
						<p class={captionClass}>Fields</p>
						<h2 class="text-[1.65rem] font-semibold tracking-[-0.035em] text-stone-950">Content fields</h2>
						<p class="max-w-[62ch] text-base leading-7 text-stone-600">
							Edit primitive fields inline and build nested block content where this content type allows it.
						</p>
					</div>

					<div class="space-y-4 border-t border-stone-200 pt-5">
						{#if currentDefinition}
							{#each currentDefinition.fields as field (field.key)}
								<div class="space-y-2">
									<label for={`field-${field.key}`} class="text-sm font-medium text-stone-800">
										{field.label}
									</label>
									{#if field.type === 'string' && isTextareaField(field)}
										<textarea
											id={`field-${field.key}`}
											rows="4"
											value={String(contentDraft.fields[field.key] ?? '')}
											required={field.required}
											class={inputClass}
											oninput={(event) =>
												handleRootFieldUpdate(field.key, parseStringValue((event.currentTarget as HTMLTextAreaElement).value, field))}
										></textarea>
									{:else if field.type === 'string'}
										<input
											id={`field-${field.key}`}
											type="text"
											value={String(contentDraft.fields[field.key] ?? '')}
											required={field.required}
											class={inputClass}
											oninput={(event) =>
												handleRootFieldUpdate(field.key, parseStringValue((event.currentTarget as HTMLInputElement).value, field))}
										/>
									{:else if field.type === 'date'}
										<input
											id={`field-${field.key}`}
											type="date"
											value={String(contentDraft.fields[field.key] ?? '')}
											class={inputClass}
											oninput={(event) =>
												handleRootFieldUpdate(field.key, parseStringValue((event.currentTarget as HTMLInputElement).value, field))}
										/>
									{:else if field.type === 'number'}
										<input
											id={`field-${field.key}`}
											type="number"
											value={contentDraft.fields[field.key] ?? ''}
											class={inputClass}
											oninput={(event) =>
												handleRootFieldUpdate(field.key, parseStringValue((event.currentTarget as HTMLInputElement).value, field))}
										/>
									{:else if field.type === 'boolean'}
										<label
											for={`field-${field.key}`}
											class="flex items-start gap-3 rounded-2xl border border-stone-300/80 bg-stone-50 px-4 py-3 text-sm text-stone-700"
										>
											<input
												id={`field-${field.key}`}
												type="checkbox"
												checked={Boolean(contentDraft.fields[field.key])}
												class="mt-0.5 h-4 w-4 rounded border-stone-400 text-stone-950 focus:ring-stone-300"
												onchange={(event) =>
													handleRootFieldUpdate(field.key, (event.currentTarget as HTMLInputElement).checked)}
											/>
											<span class="block text-stone-900">{field.label}</span>
										</label>
									{:else}
										<div class="border-t border-stone-200 pt-4">
											<BlockListEditor
												blocks={getNestedBlocks(contentDraft.fields[field.key])}
												location={{ parentPath: [], fieldKey: field.key }}
												allowedTypes={field.blocks?.allowedTypes ?? null}
												pathPrefix={[]}
												title={field.label}
												description="Nested content stays inside this content item."
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
										<p class="text-sm text-red-700">{getRootFieldError(field.key)}</p>
									{/if}
								</div>
							{/each}
						{/if}
					</div>
				</section>
			</div>
		</form>

		<aside class="border-t border-stone-300/70 pt-8 xl:sticky xl:top-6 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0">
			<div class="space-y-8">
					<section class="space-y-4 border-b border-stone-200 pb-8">
						<div class="space-y-2">
							<p class={captionClass}>Draft panel</p>
							<h2 class="text-[1.35rem] font-semibold tracking-[-0.03em] text-stone-950">Save and publish</h2>
						</div>

						<div class="space-y-3">
							<div class="flex flex-wrap gap-2">
								<span class="rounded-full bg-stone-950 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-50">
									{block.block_type}
								</span>
								{#if block.is_published}
									<span class="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-800">
										Published
									</span>
								{:else}
									<span class="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-800">
										Unpublished
									</span>
								{/if}
								{#if block.has_unpublished_changes}
									<span class="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-800">
										Draft changes
									</span>
								{/if}
							</div>

							<div class="space-y-3">
								<div class="flex items-center justify-between gap-3">
									<span class="text-sm text-stone-600">Draft state</span>
									<span class="text-sm font-medium text-stone-950">
										{block.has_unpublished_changes ? 'Unsaved draft work' : 'Up to date'}
									</span>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span class="text-sm text-stone-600">Validation</span>
									<span
										class={`text-sm font-medium ${Object.keys(validationErrors).length > 0 ? 'text-red-900' : 'text-emerald-900'}`}
									>
										{Object.keys(validationErrors).length > 0 ? 'Needs attention' : 'Ready to save'}
									</span>
								</div>
							</div>
						</div>

						<div class="space-y-3">
							<button
								type="submit"
								form="update-reusable-block-form"
								class="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-300/70 disabled:cursor-not-allowed disabled:opacity-70"
								disabled={saving || publishing}
							>
								{saving ? 'Saving draft...' : 'Save draft'}
							</button>

							<form
								method="POST"
								action="?/publishReusableBlock"
								use:enhance={() => {
									resetMessages();
									publishing = true;

									return async ({ result, update }) => {
										publishing = false;

										if (result.type === 'success' && result.data) {
											successMessage = 'Content published successfully!';
											if ('block' in result.data) {
												block = result.data.block as ReusableBlock;
												contentDraft = createEditableReusableBlockContent(block.content);
												validationErrors = {};
												draggingPath = null;
												if (browser) {
													reusableBlocksStore.update((current) =>
														current ? current.map((entry) => (entry.id === block.id ? block : entry)) : current
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
											errorMessage = `Failed to publish content: ${result.data?.error ?? 'Unknown error'}`;
										}

										await applyAction(result);
										await update({ reset: false, invalidateAll: false });
									};
								}}
							>
								<button
									type="submit"
									class="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-emerald-300/70 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200/70 disabled:cursor-not-allowed disabled:opacity-70"
									disabled={publishing || saving || !block.has_unpublished_changes}
								>
									{publishing ? 'Publishing...' : 'Publish'}
								</button>
							</form>
						</div>

						{#if successMessage}
							<div class="rounded-2xl border border-emerald-300/70 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
								{successMessage}
							</div>
						{/if}

						{#if errorMessage}
							<div class="rounded-2xl border border-red-300/70 bg-red-50 px-4 py-3 text-sm text-red-950">
								{errorMessage}
							</div>
						{/if}
					</section>

					<section class="space-y-3">
						<p class={captionClass}>Content record</p>
						<div class="space-y-3 text-sm text-stone-700">
							<div class="flex items-center justify-between gap-3">
								<span class="text-stone-500">Folder</span>
								<span class="text-right text-stone-950">
									{blockFolders.find((folder) => folder.id === block.folder_id)?.name ?? 'Root'}
								</span>
							</div>
							<div class="flex items-center justify-between gap-3">
								<span class="text-stone-500">Last published</span>
								<span class="text-right tabular-nums text-stone-950">{formatTimestamp(block.last_published_at)}</span>
							</div>
							<div class="flex items-center justify-between gap-3">
								<span class="text-stone-500">Created</span>
								<span class="text-right tabular-nums text-stone-950">{formatTimestamp(block.created_at)}</span>
							</div>
							<div class="flex items-center justify-between gap-3">
								<span class="text-stone-500">Updated</span>
								<span class="text-right tabular-nums text-stone-950">{formatTimestamp(block.updated_at)}</span>
							</div>
						</div>
					</section>
			</div>
		</aside>
	</div>
</main>
