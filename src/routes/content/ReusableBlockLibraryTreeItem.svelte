<script lang="ts">
	import Self from './ReusableBlockLibraryTreeItem.svelte';
	import type { ReusableBlocksTreeNode } from '$lib/components/cms/reusableBlocksTree';

	type Props = {
		node: ReusableBlocksTreeNode;
		depth: number;
		closedNodes: Record<string, boolean>;
		onToggle: (id: string) => void;
		onDeleteFolder: (id: string, name: string) => void;
		onDeleteBlock: (id: string, name: string) => void;
	};

	let {
		node,
		depth,
		closedNodes,
		onToggle,
		onDeleteFolder,
		onDeleteBlock
	}: Props = $props();

	const hasChildren = $derived(node.folders.length > 0 || node.blocks.length > 0);
	const nodeId = $derived(node.folder?.id ?? '');
	const isOpen = $derived(node.folder ? !closedNodes[nodeId] : true);
</script>

{#if node.folder}
	<div class="space-y-3">
		<div
			class="flex items-center gap-3 rounded-2xl border border-slate-900/10 bg-slate-50 px-4 py-3 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.55)]"
			style={`margin-left: ${depth * 1.1}rem`}
		>
			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-2">
					<span class="truncate font-semibold text-slate-900">{node.folder.name}</span>
					<span class="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
						Folder
					</span>
				</div>
				<p class="mt-1 text-xs text-slate-500">
					{node.folders.length} subfolder{node.folders.length === 1 ? '' : 's'} and
					{node.blocks.length} shared content item{node.blocks.length === 1 ? '' : 's'}
				</p>
			</div>
			<div class="flex items-center gap-1">
				<button
					type="button"
					class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
					aria-label={`Delete ${node.folder.name}`}
					onclick={() => onDeleteFolder(node.folder!.id, node.folder!.name)}
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
				{#if hasChildren}
					<button
						type="button"
						class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
						aria-label={isOpen ? `Collapse ${node.folder.name}` : `Expand ${node.folder.name}`}
						aria-expanded={isOpen}
						onclick={() => onToggle(node.folder!.id)}
					>
						<svg
							viewBox="0 0 24 24"
							class={['h-4 w-4 transition-transform', isOpen ? 'rotate-90' : ''].join(' ')}
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="m9 6 6 6-6 6" />
						</svg>
					</button>
				{/if}
			</div>
		</div>

		{#if isOpen}
			<div class="space-y-3">
				{#each node.folders as child (child.folder?.id)}
					<Self
						node={child}
						depth={depth + 1}
						{closedNodes}
						{onToggle}
						{onDeleteFolder}
						{onDeleteBlock}
					/>
				{/each}

				{#each node.blocks as block (block.id)}
					<div
						class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_12px_36px_-28px_rgba(15,23,42,0.45)]"
						style={`margin-left: ${(depth + 1) * 1.1}rem`}
					>
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
								<span>Open to edit the draft and publish state.</span>
							</div>
						</a>

						<button
							type="button"
							class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700 transition hover:border-red-300 hover:bg-red-100"
							aria-label={`Delete ${block.name}`}
							onclick={() => onDeleteBlock(block.id, block.name)}
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
{/if}
