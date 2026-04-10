<script lang="ts">
	import SidebarReusableBlocksTreeItem from './SidebarReusableBlocksTreeItem.svelte';
	import type { ReusableBlocksTreeNode } from './reusableBlocksTree';

	type Props = {
		node: ReusableBlocksTreeNode;
		depth: number;
		activeBlockId: string | null;
		closedNodes: Record<string, boolean>;
		onToggle: (id: string) => void;
		onClose: () => void;
		onOpenFolderContextMenu: (event: MouseEvent, folderId: string, folderName: string) => void;
		onOpenBlockContextMenu: (event: MouseEvent, blockId: string, blockName: string) => void;
	};

	let {
		node,
		depth,
		activeBlockId,
		closedNodes,
		onToggle,
		onClose,
		onOpenFolderContextMenu,
		onOpenBlockContextMenu
	}: Props = $props();

	const hasChildren = $derived(node.folders.length > 0 || node.blocks.length > 0);
	const nodeId = $derived(node.folder?.id ?? '');
	const isOpen = $derived(node.folder ? !closedNodes[nodeId] : true);
</script>

{#if node.folder}
	<div class="space-y-1">
		<div class="flex items-center gap-1">
			<button
				type="button"
				class="flex min-w-0 flex-1 items-center gap-2 rounded-md py-2 pr-3 text-sm text-slate-700"
				style={`padding-left: ${depth * 1.25 + 0.75}rem`}
				oncontextmenu={(event) => onOpenFolderContextMenu(event, node.folder!.id, node.folder!.name)}
			>
				<span class="truncate font-medium">{node.folder.name}</span>
				<span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
					Folder
				</span>
			</button>

			{#if hasChildren}
				<button
					type="button"
					class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
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

		{#if isOpen}
			<div class="space-y-1">
				{#each node.folders as child (child.folder?.id)}
					<SidebarReusableBlocksTreeItem
						node={child}
						depth={depth + 1}
						{activeBlockId}
						{closedNodes}
						{onToggle}
						{onClose}
						{onOpenFolderContextMenu}
						{onOpenBlockContextMenu}
					/>
				{/each}

				{#each node.blocks as block (block.id)}
					<a
						href={`/blocks/${block.id}`}
						class={[
							'flex min-w-0 items-center justify-between gap-3 rounded-md py-2 pr-3 text-sm transition',
							activeBlockId === block.id
								? 'bg-slate-100 text-slate-900'
								: 'text-slate-700 hover:bg-slate-100'
						].join(' ')}
						style={`padding-left: ${(depth + 1) * 1.25 + 0.75}rem`}
						onclick={onClose}
						oncontextmenu={(event) => onOpenBlockContextMenu(event, block.id, block.name)}
					>
						<span class="min-w-0 flex-1 truncate font-medium">{block.name}</span>
						<div class="flex shrink-0 items-center gap-1.5">
							{#if !block.is_published || block.has_unpublished_changes}
								<span class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
									Draft
								</span>
							{/if}
							<span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
								{block.block_type}
							</span>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
{/if}
