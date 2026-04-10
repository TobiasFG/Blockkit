<script lang="ts">
	import Self from '$lib/components/cms/BlockListEditor.svelte';
	import {
		getBlockDefinition,
		listBlockDefinitions,
		type BlockFieldDefinition
	} from '$lib/blocks/registry';
	import type {
		BlockListLocation,
		BlockPath,
		PageContentValidationErrors
	} from '$lib/pageContentEditor';
	import { isReusableBlockReference, type BlockInstance, type BlockValue, type PageBlockNode } from '$lib/pageContent';
	import type { ReusableBlock } from '$lib/types';

	type Props = {
		blocks: PageBlockNode[];
		location: BlockListLocation;
		allowedTypes?: string[] | null;
		pathPrefix?: BlockPath;
		title: string;
		description?: string;
		errors: PageContentValidationErrors;
		draggingPath: string | null;
		onAddBlock: (location: BlockListLocation, type: string) => void;
		onAddReusableBlockReference?: (reusableBlockId: string) => void;
		onRemoveBlock: (path: BlockPath) => void;
		onMoveBlock: (path: BlockPath, toIndex: number) => void;
		onUpdateField: (path: BlockPath, fieldKey: string, value: BlockValue | undefined) => void;
		onStartDrag: (path: BlockPath) => void;
		onEndDrag: () => void;
		reusableBlocks?: ReusableBlock[];
	};

	let {
		blocks,
		location,
		allowedTypes = null,
		pathPrefix = [],
		title,
		description,
		errors,
		draggingPath,
		onAddBlock,
		onAddReusableBlockReference,
		onRemoveBlock,
		onMoveBlock,
		onUpdateField,
		onStartDrag,
		onEndDrag,
		reusableBlocks = []
	}: Props = $props();

	const getFieldError = (path: BlockPath, fieldKey: string) => errors[`${path.join('.')}:${fieldKey}`] ?? '';
	const getBlockError = (path: BlockPath) => errors[path.join('.')] ?? '';

	const isTextareaField = (field: BlockFieldDefinition) =>
		field.type === 'string' && field.key.toLowerCase().includes('body');

	const allowedDefinitions = $derived.by(() => {
		if (!allowedTypes?.length) {
			return listBlockDefinitions();
		}

		return allowedTypes
			.map((type) => getBlockDefinition(type))
			.filter((definition): definition is NonNullable<typeof definition> => Boolean(definition));
	});

	const handleDrop = (event: DragEvent, targetIndex: number) => {
		event.preventDefault();
		const raw = event.dataTransfer?.getData('text/plain') ?? draggingPath;
		if (!raw) return;
		const fromPath = raw
			.split('.')
			.filter(Boolean)
			.map((segment) => Number(segment));

		if (fromPath.length !== pathPrefix.length + 1) return;
		if (fromPath.slice(0, -1).join('.') !== pathPrefix.join('.')) return;

		onMoveBlock(fromPath, targetIndex);
		onEndDrag();
	};

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

	const getNestedBlocks = (value: BlockValue | undefined): BlockInstance[] =>
		Array.isArray(value) ? value : [];

	const isRootList = $derived(location.parentPath === null && location.fieldKey === null);
	const getReusableBlock = (id: string) => reusableBlocks.find((block) => block.id === id) ?? null;
</script>

<div class="space-y-3">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div class="space-y-1">
			<h3 class="text-base font-semibold text-slate-900">{title}</h3>
			{#if description}
				<p class="text-sm text-slate-600">{description}</p>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			<select
				class="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
				onchange={(event) => {
					const select = event.currentTarget as HTMLSelectElement;
					if (!select.value) return;
					onAddBlock(location, select.value);
					select.value = '';
				}}
			>
				<option value="">Add block…</option>
				{#each allowedDefinitions as definition}
					<option value={definition.type}>{definition.label}</option>
				{/each}
			</select>
			{#if isRootList && reusableBlocks.length > 0 && onAddReusableBlockReference}
				<select
					class="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
					onchange={(event) => {
						const select = event.currentTarget as HTMLSelectElement;
						if (!select.value) return;
						onAddReusableBlockReference(select.value);
						select.value = '';
					}}
				>
					<option value="">Add reusable block…</option>
					{#each reusableBlocks as reusableBlock}
						<option value={reusableBlock.id}>{reusableBlock.name}</option>
					{/each}
				</select>
			{/if}
		</div>
	</div>

	{#if blocks.length === 0}
		<div class="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
			No blocks yet.
		</div>
	{:else}
		<div class="space-y-3">
			{#each blocks as block, index (block.id)}
				{@const path = [...pathPrefix, index]}
				{@const definition = isReusableBlockReference(block) ? null : getBlockDefinition(block.type)}
				{@const reusableBlock = isReusableBlockReference(block) ? getReusableBlock(block.reusableBlockId) : null}
				<div
					class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
					role="listitem"
					draggable="true"
					ondragstart={(event) => {
						event.dataTransfer?.setData('text/plain', path.join('.'));
						event.dataTransfer?.setDragImage(event.currentTarget as Element, 24, 24);
						onStartDrag(path);
					}}
					ondragend={() => onEndDrag()}
					ondragover={(event) => event.preventDefault()}
					ondrop={(event) => handleDrop(event, index)}
				>
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="space-y-1">
							<div class="flex flex-wrap items-center gap-2">
								<h4 class="text-sm font-semibold text-slate-900">
									{#if isReusableBlockReference(block)}
										{reusableBlock?.name ?? 'Missing reusable block'}
									{:else}
										{definition?.label ?? block.type}
									{/if}
								</h4>
								<span class="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
									{#if isReusableBlockReference(block)}
										reusable
									{:else}
										{block.type}
									{/if}
								</span>
								{#if isReusableBlockReference(block) && reusableBlock}
									<span class="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
										{reusableBlock.block_type}
									</span>
								{/if}
								{#if draggingPath === path.join('.')}
									<span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
										Dragging
									</span>
								{/if}
							</div>
							<p class="font-mono text-xs text-slate-500">{block.id}</p>
						</div>

						<div class="flex items-center gap-2">
							<button
								type="button"
								class="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
								onclick={() => onMoveBlock(path, index - 1)}
								disabled={index === 0}
							>
								Up
							</button>
							<button
								type="button"
								class="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
								onclick={() => onMoveBlock(path, index + 1)}
								disabled={index === blocks.length - 1}
							>
								Down
							</button>
							<button
								type="button"
								class="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
								onclick={() => onRemoveBlock(path)}
							>
								Remove
							</button>
						</div>
					</div>

					{#if getBlockError(path)}
						<div class="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
							{getBlockError(path)}
						</div>
					{/if}

					{#if isReusableBlockReference(block)}
						<div class="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
							<p>
								Live reusable block reference.
								{#if reusableBlock}
									<a href={`/blocks/${reusableBlock.id}`} class="ml-1 font-medium text-slate-900 underline">
										Edit reusable block
									</a>
								{/if}
							</p>
							{#if reusableBlock}
								<p class="mt-1 text-slate-500">
									Uses the reusable block named “{reusableBlock.name}”.
								</p>
							{:else}
								<p class="mt-1 text-red-600">
									This reusable block no longer exists. Remove or replace the reference before saving.
								</p>
							{/if}
						</div>
					{:else if definition}
						<div class="mt-4 space-y-4">
							{#each definition.fields as field (field.key)}
								{@const nestedBlocks = getNestedBlocks(block.fields[field.key])}
								<div class="space-y-1">
									<label class="text-sm font-medium text-slate-700" for={`${block.id}-${field.key}`}>
										{field.label}
									</label>
									{#if field.type === 'string' && isTextareaField(field)}
										<textarea
											id={`${block.id}-${field.key}`}
											rows="4"
											value={String(block.fields[field.key] ?? '')}
											class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
											oninput={(event) =>
												onUpdateField(path, field.key, parseStringValue((event.currentTarget as HTMLTextAreaElement).value, field))}
										></textarea>
									{:else if field.type === 'string' || field.type === 'date' || field.type === 'number'}
										<input
											id={`${block.id}-${field.key}`}
											type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
											value={String(block.fields[field.key] ?? '')}
											class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
											oninput={(event) =>
												onUpdateField(path, field.key, parseStringValue((event.currentTarget as HTMLInputElement).value, field))}
										/>
									{:else if field.type === 'boolean'}
										<label
											for={`${block.id}-${field.key}`}
											class="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700"
										>
											<input
												id={`${block.id}-${field.key}`}
												type="checkbox"
												checked={Boolean(block.fields[field.key])}
												class="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
												onchange={(event) =>
													onUpdateField(path, field.key, (event.currentTarget as HTMLInputElement).checked)}
											/>
											<span class="block text-slate-900">{field.label}</span>
										</label>
									{:else if field.type === 'blocks'}
										<div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
											<Self
												blocks={nestedBlocks}
												location={{ parentPath: path, fieldKey: field.key }}
												allowedTypes={field.blocks?.allowedTypes ?? null}
												pathPrefix={path}
												title={field.label}
											description="Nested blocks"
												{errors}
												{draggingPath}
												{onAddBlock}
												{onAddReusableBlockReference}
												{onRemoveBlock}
												{onMoveBlock}
												{onUpdateField}
												{onStartDrag}
												{onEndDrag}
												{reusableBlocks}
											/>
										</div>
									{/if}
									{#if getFieldError(path, field.key)}
										<p class="text-sm text-red-600">{getFieldError(path, field.key)}</p>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<div class="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
							Unknown block type.
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
