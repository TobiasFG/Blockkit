<script lang="ts">
	import { fly } from 'svelte/transition';
	import { browser } from '$app/environment';
	import { applyAction, enhance } from '$app/forms';
	import { getToastState } from '$lib/Toasts/toastState.svelte';
	import { type BlockDefinition, type BlockFieldDefinition } from '$lib/blocks/registry';
	import { blockFoldersStore, reusableBlocksStore } from '$lib/client/reusableBlocksStore';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import BlockListEditor from '$lib/components/cms/BlockListEditor.svelte';
	import type { BlockListLocation, BlockPath } from '$lib/pageContentEditor';
	import type { BlockInstance, BlockValue } from '$lib/pageContent';
	import { getReusableBlockPublishState, reusableBlockHasDraftChanges } from '$lib/reusableBlockStatus';
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

	type LoadedSnapshot = {
		name: string;
		folderId: string;
		content: BlockInstance;
		revertTargetLabel: 'draft' | 'published';
	};

	type PrimaryActionState = 'validation-error' | 'save-draft' | 'publish' | 'all-saved';

	let { data }: PageProps = $props();

	let block = $state<ReusableBlock>({} as ReusableBlock);
	let name = $state('');
	let folderId = $state('');
	let blockFolders = $state<BlockFolder[]>([]);
	let definitions = $state<BlockDefinition[]>([]);
	let contentDraft = $state(createDefaultBlockInstance('text', 'placeholder-reusable-block'));
	let validationErrors = $state<Record<string, string>>({});
	let draggingPath = $state<string | null>(null);
	let saving = $state(false);
	let publishing = $state(false);
	let prefersReducedMotion = $state(false);
	let loadedSnapshot = $state<LoadedSnapshot | null>(null);

	const toastState = getToastState();
	const inputClass =
		'h-11 rounded-2xl';
	const captionClass = 'text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground';

	const getRevertTargetLabel = (currentBlock: ReusableBlock) =>
		getReusableBlockPublishState(currentBlock) === 'published' ? 'published' : 'draft';
	const publishState = $derived(getReusableBlockPublishState(block));
	const getPublishStateLabel = (state: 'unpublished' | 'published' | 'draft-changes') => {
		switch (state) {
			case 'draft-changes':
				return 'Saved draft';
			case 'published':
				return 'Published';
			default:
				return 'Unpublished';
		}
	};
	const getPublishStateClass = (state: 'unpublished' | 'published' | 'draft-changes') => {
		switch (state) {
			case 'draft-changes':
				return 'bg-sky-100 text-sky-800';
			case 'published':
				return 'bg-emerald-100 text-emerald-800';
			default:
				return 'bg-amber-100 text-amber-800';
		}
	};
	const getDraftStateLabel = () => {
		if (hasUnsavedChanges) return 'Unsaved changes';
		if (reusableBlockHasDraftChanges(block)) return 'Saved draft changes';
		return 'Up to date';
	};

	const currentDefinition = $derived(
		definitions.find((entry) => entry.type === block.block_type) ?? null
	);
	const hasValidationErrors = $derived(Object.keys(validationErrors).length > 0);
	const hasUnsavedChanges = $derived.by(() => {
		if (!loadedSnapshot) return false;

		return (
			name !== loadedSnapshot.name ||
			folderId !== loadedSnapshot.folderId ||
			JSON.stringify(contentDraft) !== JSON.stringify(loadedSnapshot.content)
		);
	});
	const primaryActionState = $derived<PrimaryActionState>(
		hasValidationErrors
			? 'validation-error'
			: hasUnsavedChanges
				? 'save-draft'
				: reusableBlockHasDraftChanges(block)
					? 'publish'
					: 'all-saved'
	);
	const primaryActionDisabled = $derived(
		saving || publishing || primaryActionState === 'validation-error' || primaryActionState === 'all-saved'
	);
	const primaryActionIntent = $derived(primaryActionState === 'publish' ? 'publish' : 'save');
	const primaryActionFormAction = $derived(
		primaryActionState === 'publish' ? '?/publishReusableBlock' : '?/updateReusableBlock'
	);
	const primaryActionLabel = $derived.by(() => {
		if (publishing) return 'Publishing...';
		if (saving) return 'Saving draft...';

		switch (primaryActionState) {
			case 'validation-error':
				return 'Validation error';
			case 'publish':
				return 'Publish';
			case 'all-saved':
				return 'All changes saved';
			default:
				return 'Save draft';
		}
	});
	const primaryActionClass = $derived(
		primaryActionState === 'publish'
			? 'border border-emerald-300/70 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 focus-visible:ring-emerald-200/70'
			: primaryActionState === 'validation-error'
				? 'bg-red-900 text-red-50 hover:bg-red-900 focus-visible:ring-red-200/70'
				: 'bg-stone-950 text-stone-50 hover:bg-stone-800 focus-visible:ring-stone-300/70'
	);
	const showPrimaryAction = $derived(primaryActionState !== 'all-saved');
	const showRevertAction = $derived(hasUnsavedChanges);
	const actionMotion = $derived({
		y: prefersReducedMotion ? -4 : -10,
		duration: prefersReducedMotion ? 0 : 180
	});

	$effect(() => {
		block = data.block;
		name = data.block.name;
		folderId = data.block.folder_id ?? '';
		blockFolders = data.blockFolders;
		definitions = data.blockDefinitions;
		contentDraft = createEditableReusableBlockContent(data.block.content);
		loadedSnapshot = {
			name: data.block.name,
			folderId: data.block.folder_id ?? '',
			content: createEditableReusableBlockContent(data.block.content),
			revertTargetLabel: getRevertTargetLabel(data.block)
		};
		validationErrors = {};
		draggingPath = null;
	});
	$effect(() => {
		if (!browser) return;

		const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		const updateReducedMotion = () => {
			prefersReducedMotion = reducedMotionQuery.matches;
		};

		updateReducedMotion();
		reducedMotionQuery.addEventListener('change', updateReducedMotion);

		return () => {
			reducedMotionQuery.removeEventListener('change', updateReducedMotion);
		};
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

	const resetDraft = () => {
		if (!loadedSnapshot) return;

		name = loadedSnapshot.name;
		folderId = loadedSnapshot.folderId;
		contentDraft = createEditableReusableBlockContent(loadedSnapshot.content);
		validationErrors = {};
		draggingPath = null;
	};
</script>

<main class="mx-auto max-w-[96rem] px-4 pb-10 pt-6 sm:px-6 lg:px-8">
	<header class="border-b border-border/70 pb-8">
		<div class="flex flex-wrap items-start justify-between gap-6">
			<div class="max-w-3xl space-y-3">
				<p class={captionClass}>Content editor</p>
				<h1 class="text-[2.6rem] font-semibold tracking-[-0.045em] text-foreground sm:text-5xl">
					{name || block.name}
				</h1>
				<p class="max-w-[62ch] text-base leading-7 text-muted-foreground">
					Update content name, folder, and fields for this <span class="font-semibold text-stone-900">{block.block_type}</span> content item.
				</p>
			</div>
			<Button
				href="/content"
				variant="outline"
				class="rounded-full"
			>
				Back to Content
			</Button>
		</div>
	</header>

	<form
		id="update-reusable-block-form"
		method="POST"
		action="?/updateReusableBlock"
		class="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start"
		use:enhance={({ formElement, cancel, submitter }) => {
				const intent =
					submitter instanceof HTMLButtonElement ? submitter.dataset.intent ?? 'save' : 'save';

				validationErrors = validateReusableBlockEditorState(contentDraft);
				if (Object.keys(validationErrors).length > 0) {
					cancel();
					toastState.error(
						intent === 'publish'
							? 'Fix highlighted block fields before publishing.'
							: 'Fix the highlighted block fields before saving.'
					);
					formElement.reportValidity();
					return;
				}

				if (intent === 'publish') {
					if (hasUnsavedChanges) {
						toastState.error('Save draft before publishing current content changes.');
						cancel();
						return;
					}

					publishing = true;
				} else {
					saving = true;
				}

				return async ({ result, update }) => {
					saving = false;
					publishing = false;

					if (result.type === 'success' && result.data) {
						toastState.success(intent === 'publish' ? 'Content published.' : 'Content draft saved.');
						if ('block' in result.data) {
							block = result.data.block as ReusableBlock;
							name = block.name;
							folderId = block.folder_id ?? '';
							contentDraft = createEditableReusableBlockContent(block.content);
							loadedSnapshot = {
								name,
								folderId,
								content: createEditableReusableBlockContent(block.content),
								revertTargetLabel: getRevertTargetLabel(block)
							};
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
						toastState.error(
							intent === 'publish'
								? `Failed to publish content: ${result.data?.error ?? 'Unknown error'}`
								: `Failed to update content: ${result.data?.error ?? 'Unknown error'}`
						);
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
						<h2 class="text-[1.65rem] font-semibold tracking-[-0.035em] text-foreground">Name and location</h2>
						<p class="max-w-[62ch] text-base leading-7 text-muted-foreground">
							Keep content name recognizable in sidebar and page insertion flows.
						</p>
					</div>

					<div class="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
						<div class="space-y-2">
							<Label for="name">Name</Label>
							<Input id="name" type="text" name="name" required bind:value={name} class={inputClass} />
						</div>
						<div class="space-y-2">
							<Label for="folderId">Folder</Label>
							<select id="folderId" name="folderId" bind:value={folderId} class="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-11 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus-visible:ring-3">
								<option value="">Root</option>
								{#each blockFolders as folder}
									<option value={folder.id}>{folder.name}</option>
								{/each}
							</select>
						</div>
					</div>
				</section>

				<section class="space-y-5">
					<div class="space-y-2">
						<p class={captionClass}>Fields</p>
						<h2 class="text-[1.65rem] font-semibold tracking-[-0.035em] text-foreground">Content fields</h2>
						<p class="max-w-[62ch] text-base leading-7 text-muted-foreground">
							Edit primitive fields inline and build nested block content where this content type allows it.
						</p>
					</div>

					<div class="space-y-4 border-t border-border pt-5">
						{#if currentDefinition}
							{#each currentDefinition.fields as field (field.key)}
								<div class="space-y-2">
									<Label for={`field-${field.key}`}>{field.label}</Label>
									{#if field.type === 'string' && isTextareaField(field)}
										<Textarea
											id={`field-${field.key}`}
											rows={4}
											value={String(contentDraft.fields[field.key] ?? '')}
											required={field.required}
											class="min-h-28 rounded-2xl"
											oninput={(event) =>
												handleRootFieldUpdate(field.key, parseStringValue((event.currentTarget as HTMLTextAreaElement).value, field))}
										/>
									{:else if field.type === 'string'}
										<Input
											id={`field-${field.key}`}
											type="text"
											value={String(contentDraft.fields[field.key] ?? '')}
											required={field.required}
											class={inputClass}
											oninput={(event) =>
												handleRootFieldUpdate(field.key, parseStringValue((event.currentTarget as HTMLInputElement).value, field))}
										/>
									{:else if field.type === 'date'}
										<Input
											id={`field-${field.key}`}
											type="date"
											value={String(contentDraft.fields[field.key] ?? '')}
											class={inputClass}
											oninput={(event) =>
												handleRootFieldUpdate(field.key, parseStringValue((event.currentTarget as HTMLInputElement).value, field))}
										/>
									{:else if field.type === 'number'}
										<Input
											id={`field-${field.key}`}
											type="number"
											value={contentDraft.fields[field.key] ?? ''}
											class={inputClass}
											oninput={(event) =>
												handleRootFieldUpdate(field.key, parseStringValue((event.currentTarget as HTMLInputElement).value, field))}
										/>
									{:else if field.type === 'boolean'}
										<label for={`field-${field.key}`} class="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
											<input
												id={`field-${field.key}`}
												type="checkbox"
												checked={Boolean(contentDraft.fields[field.key])}
												class="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-ring"
												onchange={(event) =>
													handleRootFieldUpdate(field.key, (event.currentTarget as HTMLInputElement).checked)}
											/>
											<span class="block text-foreground">{field.label}</span>
										</label>
									{:else}
										<div class="border-t border-border pt-4">
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
												onStartDrag={(path: number[]) => (draggingPath = path.join('.'))}
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
			<aside class="space-y-4">
				<div class="space-y-4 xl:sticky xl:top-6">
					<section class="rounded-[1.75rem] border border-border/80 bg-card/92 p-5 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.2)]">
						<div class="space-y-2">
							<p class={captionClass}>Draft state</p>
							<h2 class="text-[1.25rem] font-semibold tracking-[-0.03em] text-foreground">{getDraftStateLabel()}</h2>
							<p class="text-sm leading-6 text-muted-foreground">
								{#if hasUnsavedChanges}
									Current form changes live only in browser until you save draft.
								{:else if reusableBlockHasDraftChanges(block)}
									Draft differs from published content.
								{:else}
									Draft matches published content.
								{/if}
							</p>
						</div>

						<div class="mt-4 flex flex-col gap-2">
								{#if showPrimaryAction}
									<Button
										type="submit"
										form="update-reusable-block-form"
										formaction={primaryActionFormAction}
										data-intent={primaryActionIntent}
										variant={primaryActionState === 'validation-error' ? 'destructive' : primaryActionState === 'publish' ? 'secondary' : 'default'}
										class="h-11 w-full rounded-full"
									disabled={primaryActionDisabled}
								>
									{primaryActionLabel}
									</Button>
							{/if}
							{#if showRevertAction}
								<Button
									type="button"
									variant="outline"
									class="h-11 w-full rounded-full"
									onclick={resetDraft}
								>
									Revert changes to {loadedSnapshot?.revertTargetLabel ?? 'draft'}
								</Button>
							{/if}
						</div>
					</section>

					<section class="rounded-[1.75rem] border border-border/80 bg-card/92 p-5 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.2)]">
						<div class="space-y-2">
							<p class={captionClass}>Publish state</p>
							<div class="flex items-center gap-2">
								<Badge class={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getPublishStateClass(publishState)}`}>
									{getPublishStateLabel(publishState)}
								</Badge>
								<Badge variant="secondary" class="text-[10px] font-semibold uppercase tracking-[0.16em]">
									{block.block_type}
								</Badge>
							</div>
							<p class="text-sm leading-6 text-muted-foreground">Publish uses current saved draft content and naming.</p>
						</div>

						<div class="mt-4 space-y-3 border-t border-border pt-4 text-sm text-foreground">
							<div class="flex items-center justify-between gap-3">
								<span class="text-muted-foreground">Folder</span>
								<span class="text-right text-foreground">
									{blockFolders.find((folder) => folder.id === folderId)?.name ?? 'Root'}
								</span>
							</div>
							<div class="flex items-center justify-between gap-3">
								<span class="text-muted-foreground">Last published</span>
								<span class="text-right tabular-nums text-foreground">{formatTimestamp(block.last_published_at)}</span>
							</div>
							<div class="flex items-center justify-between gap-3">
								<span class="text-muted-foreground">Created</span>
								<span class="text-right tabular-nums text-foreground">{formatTimestamp(block.created_at)}</span>
							</div>
							<div class="flex items-center justify-between gap-3">
								<span class="text-muted-foreground">Updated</span>
								<span class="text-right tabular-nums text-foreground">{formatTimestamp(block.updated_at)}</span>
							</div>
						</div>
						</section>
				</div>
			</aside>
		</form>
	</main>
