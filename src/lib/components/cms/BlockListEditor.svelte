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
	import {
		isReusableBlockReference,
		type BlockInstance,
		type BlockValue,
		type PageBlockNode
	} from '$lib/pageContent';
	import type { ReusableBlock } from '$lib/types';
	import { parseReusableBlockDragData } from './reusableBlockInsertion';

	type Props = {
		blocks: PageBlockNode[];
		location: BlockListLocation;
		allowedTypes?: string[] | null;
		pathPrefix?: BlockPath;
		title: string;
		description?: string;
		errors: PageContentValidationErrors;
		draggingPath: string | null;
		canDragBlocks?: boolean;
		onAddBlock: (location: BlockListLocation, type: string) => void;
		onInsertReusableBlockReference?: (reusableBlockId: string, index: number) => void;
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
		canDragBlocks = false,
		onAddBlock,
		onInsertReusableBlockReference,
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
	const getPathKey = (path: BlockPath) => path.join('.');

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

	const isRootList = $derived(location.parentPath === null && location.fieldKey === null);
	const canInsertReusableBlocks = $derived(isRootList && reusableBlocks.length > 0);
	let openReusableMenuPath = $state<string | null>(null);
	let openActionMenuPath = $state<string | null>(null);
	let hoveredDropTarget = $state<string | null>(null);

	const fieldClass =
		'w-full rounded-2xl border border-stone-300/80 bg-white px-4 py-3 text-sm text-stone-900 shadow-[0_1px_0_rgba(41,37,36,0.04)] outline-none transition focus:border-stone-500 focus:ring-4 focus:ring-stone-200/70';

	const tertiaryButtonClass =
		'rounded-full border border-stone-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700 transition hover:border-stone-400 hover:bg-stone-50';

	const captionClass = 'text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500';

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

	const getReusableBlock = (id: string) => reusableBlocks.find((block) => block.id === id) ?? null;

	const insertReusableBlockReference = (reusableBlockId: string, index: number) => {
		if (onInsertReusableBlockReference) {
			onInsertReusableBlockReference(reusableBlockId, index);
		} else {
			onAddReusableBlockReference?.(reusableBlockId);
		}

		openReusableMenuPath = null;
	};

	const handleDrop = (event: DragEvent, targetIndex: number) => {
		event.preventDefault();
		hoveredDropTarget = null;

		const reusablePayload = parseReusableBlockDragData(event);
		if (reusablePayload) {
			if (!isRootList) return;
			insertReusableBlockReference(reusablePayload.reusableBlockId, targetIndex);
			onEndDrag();
			return;
		}

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

	const handleBlockDragStart = (event: DragEvent, path: BlockPath) => {
		event.dataTransfer?.setData('text/plain', path.join('.'));
		event.dataTransfer?.setDragImage(event.currentTarget as Element, 24, 24);
		onStartDrag(path);
	};

	const openReusableMenu = (pathKey: string) => {
		openReusableMenuPath = openReusableMenuPath === pathKey ? null : pathKey;
		openActionMenuPath = null;
	};

	const openActionMenu = (pathKey: string) => {
		openActionMenuPath = openActionMenuPath === pathKey ? null : pathKey;
		openReusableMenuPath = null;
	};

	const closeMenus = () => {
		openReusableMenuPath = null;
		openActionMenuPath = null;
	};
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div class="space-y-1">
			<h3 class="text-lg font-black tracking-[-0.02em] text-stone-950">{title}</h3>
			{#if description}
				<p class="max-w-2xl text-sm leading-6 text-stone-600">{description}</p>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			<select
				class={`${fieldClass} min-w-[11rem] py-2.5 pr-10 text-sm`}
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
		</div>
	</div>

	{#if canInsertReusableBlocks}
		<div class="rounded-[1.5rem] border border-stone-300/80 bg-[oklch(0.97_0.01_85)] p-4 shadow-[0_18px_40px_-30px_rgba(41,37,36,0.24)]">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div class="space-y-1">
					<p class={captionClass}>Reusable blocks</p>
					<p class="max-w-xl text-sm leading-6 text-stone-600">
						Insert shared content that should stay linked across pages. Drop targets appear only while dragging.
					</p>
				</div>
				<select
					class={`${fieldClass} min-w-[14rem] py-2.5 pr-10 text-sm`}
					onchange={(event) => {
						const select = event.currentTarget as HTMLSelectElement;
						if (!select.value) return;
						insertReusableBlockReference(select.value, blocks.length);
						select.value = '';
					}}
				>
					<option value="">Insert reusable block…</option>
					{#each reusableBlocks as reusableBlock}
						<option value={reusableBlock.id}>{reusableBlock.name}</option>
					{/each}
				</select>
			</div>
		</div>
	{/if}

	{#if blocks.length === 0}
		<button
			type="button"
			class={[
				'rounded-[1.5rem] border border-dashed px-5 py-6 text-left text-sm',
				canDragBlocks
					? 'border-stone-400 bg-stone-100/70 text-stone-600'
					: 'border-stone-300 bg-stone-100/60 text-stone-600'
			].join(' ')}
			aria-label="Drop block before the empty list"
			ondragover={(event) => canDragBlocks && event.preventDefault()}
			ondrop={(event) => canDragBlocks && handleDrop(event, 0)}
		>
			<div class="font-semibold text-stone-900">No blocks yet.</div>
			{#if canDragBlocks}
				<span class="mt-1 block text-stone-500">Drop here to insert at the start.</span>
			{:else}
				<span class="mt-1 block text-stone-500">Start with a block type, then build the page from there.</span>
			{/if}
		</button>
	{:else}
		<div class="space-y-4">
			{#if canDragBlocks && draggingPath}
				<button
					type="button"
					class={[
						'rounded-full border border-dashed px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.22em] transition',
						hoveredDropTarget === `${pathPrefix.join('.')}:0`
							? 'border-stone-900 bg-stone-900 text-stone-50'
							: 'border-stone-300 bg-stone-100/70 text-stone-500 hover:border-stone-400 hover:bg-stone-200/70'
					].join(' ')}
					aria-label="Drop block before the first block"
					ondragover={(event) => {
						event.preventDefault();
						hoveredDropTarget = `${pathPrefix.join('.')}:0`;
					}}
					ondragenter={(event) => {
						event.preventDefault();
						hoveredDropTarget = `${pathPrefix.join('.')}:0`;
					}}
					ondrop={(event) => handleDrop(event, 0)}
				>
					Drop before the first block
				</button>
			{/if}

			{#each blocks as block, index (block.id)}
				{@const path = [...pathPrefix, index]}
				{@const pathKey = getPathKey(path)}
				{@const definition = isReusableBlockReference(block) ? null : getBlockDefinition(block.type)}
				{@const reusableBlock = isReusableBlockReference(block) ? getReusableBlock(block.reusableBlockId) : null}

				{#if canDragBlocks && draggingPath}
					<button
						type="button"
						class={[
							'rounded-full border border-dashed px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.22em] transition',
							hoveredDropTarget === `${pathPrefix.join('.')}:${index + 1}`
								? 'border-stone-900 bg-stone-900 text-stone-50'
								: 'border-stone-300 bg-stone-100/70 text-stone-500 hover:border-stone-400 hover:bg-stone-200/70'
						].join(' ')}
						aria-label={`Drop block after ${index + 1}`}
						ondragover={(event) => {
							event.preventDefault();
							hoveredDropTarget = `${pathPrefix.join('.')}:${index + 1}`;
						}}
						ondragenter={(event) => {
							event.preventDefault();
							hoveredDropTarget = `${pathPrefix.join('.')}:${index + 1}`;
						}}
						ondrop={(event) => handleDrop(event, index + 1)}
					>
						Drop after this block
					</button>
				{/if}

				<div
					class={[
						'rounded-[1.5rem] border border-stone-300/80 bg-white p-4 shadow-[0_18px_45px_-34px_rgba(41,37,36,0.22)]',
						draggingPath === pathKey ? 'border-amber-400 ring-4 ring-amber-100/80' : ''
					].join(' ')}
					role="listitem"
					draggable={canDragBlocks}
					ondragstart={canDragBlocks ? (event) => handleBlockDragStart(event, path) : undefined}
					ondragend={() => {
						hoveredDropTarget = null;
						onEndDrag();
					}}
				>
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="space-y-1">
							<div class="flex flex-wrap items-center gap-2">
								<h4 class="text-base font-black tracking-[-0.02em] text-stone-950">
									{#if isReusableBlockReference(block)}
										{reusableBlock?.name ?? 'Missing reusable block'}
									{:else}
										{definition?.label ?? block.type}
									{/if}
								</h4>
								<span class="rounded-full bg-stone-100 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-600">
									{#if isReusableBlockReference(block)}
										reusable
									{:else}
										{block.type}
									{/if}
								</span>
								{#if isReusableBlockReference(block) && reusableBlock}
									<span class="rounded-full bg-stone-200/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-700">
										{reusableBlock.block_type}
									</span>
								{/if}
								{#if canDragBlocks && draggingPath === pathKey}
									<span class="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-800">
										Dragging
									</span>
								{/if}
							</div>
							<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
								<span>{index + 1} of {blocks.length}</span>
								<span class="font-mono" title={block.id}>ID {block.id.slice(0, 8)}</span>
							</div>
						</div>

						<div class="flex flex-wrap items-center gap-2">
							<div class="relative">
								<button
									type="button"
									class={tertiaryButtonClass}
									aria-expanded={openActionMenuPath === pathKey}
									onclick={() => openActionMenu(pathKey)}
								>
									Actions
								</button>
								{#if openActionMenuPath === pathKey}
									<div
										class="absolute right-0 top-full z-20 mt-2 w-56 rounded-[1.25rem] border border-stone-300 bg-white p-2 shadow-[0_24px_60px_-34px_rgba(41,37,36,0.28)]"
									>
										<div class="space-y-1">
											<button
												type="button"
												class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-stone-700 transition hover:bg-stone-100 disabled:text-stone-300"
												onclick={() => {
													onMoveBlock(path, index - 1);
													closeMenus();
												}}
												disabled={index === 0}
											>
												<span>Move up</span>
											</button>
											<button
												type="button"
												class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-stone-700 transition hover:bg-stone-100 disabled:text-stone-300"
												onclick={() => {
													onMoveBlock(path, index + 1);
													closeMenus();
												}}
												disabled={index === blocks.length - 1}
											>
												<span>Move down</span>
											</button>
											{#if canInsertReusableBlocks}
												<button
													type="button"
													class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-stone-700 transition hover:bg-stone-100"
													onclick={() => openReusableMenu(pathKey)}
												>
													<span>Insert reusable before</span>
												</button>
											{/if}
										</div>
									</div>
								{/if}
							</div>
							{#if canInsertReusableBlocks}
								<div class="relative">
									<button
										type="button"
										class={tertiaryButtonClass}
										aria-expanded={openReusableMenuPath === pathKey}
										onclick={() => openReusableMenu(pathKey)}
									>
										Insert reusable
									</button>
									{#if openReusableMenuPath === pathKey}
										<div
											class="absolute right-0 top-full z-20 mt-2 w-64 rounded-[1.25rem] border border-stone-300 bg-white p-2 shadow-[0_24px_60px_-34px_rgba(41,37,36,0.28)]"
										>
											<p class={`${captionClass} px-3 py-1`}>Insert before this row</p>
											<div class="max-h-56 space-y-1 overflow-y-auto">
												{#each reusableBlocks as reusableBlock}
													<button
														type="button"
														class="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm text-stone-700 transition hover:bg-stone-100"
														onclick={() => insertReusableBlockReference(reusableBlock.id, index)}
													>
														<span class="min-w-0 flex-1 truncate font-medium">{reusableBlock.name}</span>
														<span class="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-stone-500">
															{reusableBlock.block_type}
														</span>
													</button>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{/if}
							<button
								type="button"
								class="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-700 transition hover:bg-red-100"
								onclick={() => {
									onRemoveBlock(path);
									closeMenus();
								}}
							>
								Remove
							</button>
						</div>
					</div>

					{#if getBlockError(path)}
						<div class="mt-4 rounded-2xl border border-red-300/70 bg-red-50 px-4 py-3 text-sm text-red-800">
							{getBlockError(path)}
						</div>
					{/if}

					{#if isReusableBlockReference(block)}
						<div class="mt-4 rounded-[1.25rem] border border-stone-300/80 bg-stone-50 px-4 py-4 text-sm text-stone-700">
							<p>
								Live reusable block reference.
								{#if reusableBlock}
									<a href={`/blocks/${reusableBlock.id}`} class="ml-1 font-semibold text-stone-950 underline">
										Edit reusable block
									</a>
								{/if}
							</p>
							{#if reusableBlock}
								<p class="mt-1 text-stone-500">
									Uses the reusable block named “{reusableBlock.name}”.
								</p>
							{:else}
								<p class="mt-1 text-red-700">
									This reusable block no longer exists. Remove or replace the reference before saving.
								</p>
							{/if}
						</div>
					{:else if definition}
						<div class="mt-4 space-y-4">
							{#each definition.fields as field (field.key)}
								{@const nestedBlocks = getNestedBlocks(block.fields[field.key])}
								<div class="space-y-2">
									<label class="text-sm font-semibold text-stone-800" for={`${block.id}-${field.key}`}>
										{field.label}
									</label>
									{#if field.type === 'string' && isTextareaField(field)}
										<textarea
											id={`${block.id}-${field.key}`}
											rows="4"
											value={String(block.fields[field.key] ?? '')}
											class={fieldClass}
											oninput={(event) =>
												onUpdateField(
													path,
													field.key,
													parseStringValue((event.currentTarget as HTMLTextAreaElement).value, field)
												)}
										></textarea>
									{:else if field.type === 'string' || field.type === 'date' || field.type === 'number'}
										<input
											id={`${block.id}-${field.key}`}
											type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
											value={String(block.fields[field.key] ?? '')}
											class={fieldClass}
											oninput={(event) =>
												onUpdateField(
													path,
													field.key,
													parseStringValue((event.currentTarget as HTMLInputElement).value, field)
												)}
										/>
									{:else if field.type === 'boolean'}
										<label
											for={`${block.id}-${field.key}`}
											class="flex items-start gap-3 rounded-2xl border border-stone-300/80 bg-stone-50 px-4 py-3 text-sm text-stone-700"
										>
											<input
												id={`${block.id}-${field.key}`}
												type="checkbox"
												checked={Boolean(block.fields[field.key])}
												class="mt-0.5 h-4 w-4 rounded border-stone-400 text-stone-950 focus:ring-stone-300"
												onchange={(event) =>
													onUpdateField(path, field.key, (event.currentTarget as HTMLInputElement).checked)}
											/>
											<span class="block font-medium text-stone-950">{field.label}</span>
										</label>
									{:else if field.type === 'blocks'}
										<div class="rounded-[1.25rem] bg-stone-100/80 p-4 ring-1 ring-inset ring-stone-200">
											<Self
												blocks={nestedBlocks}
												location={{ parentPath: path, fieldKey: field.key }}
												allowedTypes={field.blocks?.allowedTypes ?? null}
												pathPrefix={path}
												title={field.label}
												description="Nested content stays inside this parent block."
												{errors}
												{draggingPath}
												{canDragBlocks}
												{onAddBlock}
												onInsertReusableBlockReference={onInsertReusableBlockReference}
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
										<p class="text-sm text-red-700">{getFieldError(path, field.key)}</p>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<div class="mt-4 rounded-2xl border border-red-300/70 bg-red-50 px-4 py-3 text-sm text-red-800">
							Unknown block type.
						</div>
					{/if}
				</div>
			{/each}

			{#if canDragBlocks && draggingPath}
				<button
					type="button"
					class={[
						'rounded-full border border-dashed px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.22em] transition',
						hoveredDropTarget === `${pathPrefix.join('.')}:${blocks.length}`
							? 'border-stone-900 bg-stone-900 text-stone-50'
							: 'border-stone-300 bg-stone-100/70 text-stone-500 hover:border-stone-400 hover:bg-stone-200/70'
					].join(' ')}
					aria-label="Drop block after the last block"
					ondragover={(event) => {
						event.preventDefault();
						hoveredDropTarget = `${pathPrefix.join('.')}:${blocks.length}`;
					}}
					ondragenter={(event) => {
						event.preventDefault();
						hoveredDropTarget = `${pathPrefix.join('.')}:${blocks.length}`;
					}}
					ondrop={(event) => handleDrop(event, blocks.length)}
				>
					Drop after the last block
				</button>
			{/if}
		</div>
	{/if}
</div>
