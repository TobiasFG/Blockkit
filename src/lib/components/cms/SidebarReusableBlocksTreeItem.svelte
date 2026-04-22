<script lang="ts">
	import { ContextMenu, DropdownMenu } from 'bits-ui';
	import CmsIconButton from './CmsIconButton.svelte';
	import SidebarReusableBlocksTreeItem from './SidebarReusableBlocksTreeItem.svelte';
	import { ChevronRight, Plus } from '$lib/icons';
	import { getReusableBlockPublishState } from '$lib/reusableBlockStatus';
	import { setReusableBlockDragData } from './reusableBlockInsertion';
	import type { ReusableBlocksTreeNode } from './reusableBlocksTree';

	type Props = {
		node: ReusableBlocksTreeNode;
		depth: number;
		activeBlockId: string | null;
		closedNodes: Record<string, boolean>;
		onToggle: (id: string) => void;
		onClose: () => void;
		canInsertIntoPage: boolean;
		canDragIntoPage: boolean;
		onCreateSubfolder: (folderId: string, folderName: string) => void;
		onDeleteFolder: (folderId: string, folderName: string) => void;
		onDeleteBlock: (blockId: string, blockName: string) => void;
		onInsertBlockIntoPage: (blockId: string) => void;
	};

	let {
		node,
		depth,
		activeBlockId,
		closedNodes,
		onToggle,
		onClose,
		canInsertIntoPage,
		canDragIntoPage,
		onCreateSubfolder,
		onDeleteFolder,
		onDeleteBlock,
		onInsertBlockIntoPage
	}: Props = $props();

	const hasChildren = $derived(node.folders.length > 0 || node.blocks.length > 0);
	const nodeId = $derived(node.folder?.id ?? '');
	const isOpen = $derived(node.folder ? !closedNodes[nodeId] : true);
	const getStateMeta = (state: 'unpublished' | 'published' | 'draft-changes') => {
		switch (state) {
			case 'draft-changes':
				return { label: 'Saved draft', className: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' };
			case 'published':
				return { label: 'Published', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' };
			default:
				return { label: 'Unpublished', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' };
		}
	};
</script>

{#if node.folder}
	<div class="space-y-1">
		<div class="flex items-center gap-1">
			<ContextMenu.Root>
				<ContextMenu.Trigger
					class="flex min-w-0 flex-1 items-center gap-2 rounded-md py-2 pr-3 text-sm text-muted-foreground"
					style={`padding-left: ${depth * 1.25 + 0.75}rem`}
				>
					<span class="truncate font-medium">{node.folder.name}</span>
					<span class="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
						Folder
					</span>
				</ContextMenu.Trigger>
				<ContextMenu.Content class="z-50 min-w-44 rounded-xl border border-border bg-popover p-1.5 shadow-lg">
					<ContextMenu.Item
						class="rounded-lg px-2 py-2 text-sm text-slate-700 outline-none transition focus:bg-slate-100"
						onSelect={() => onCreateSubfolder(node.folder!.id, node.folder!.name)}
					>
						Create subfolder
					</ContextMenu.Item>
					<ContextMenu.Item
						class="rounded-lg px-2 py-2 text-sm text-red-700 outline-none transition focus:bg-red-50"
						onSelect={() => onDeleteFolder(node.folder!.id, node.folder!.name)}
					>
						Delete folder
					</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger class="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground transition hover:bg-muted hover:text-foreground">
					Actions
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="z-50 min-w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
					<DropdownMenu.Item
						class="rounded-lg px-2 py-2 text-sm text-slate-700 outline-none transition focus:bg-slate-100"
						onSelect={() => onCreateSubfolder(node.folder!.id, node.folder!.name)}
					>
						Create subfolder
					</DropdownMenu.Item>
					<DropdownMenu.Item
						class="rounded-lg px-2 py-2 text-sm text-red-700 outline-none transition focus:bg-red-50"
						onSelect={() => onDeleteFolder(node.folder!.id, node.folder!.name)}
					>
						Delete folder
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			{#if hasChildren}
				<button
					type="button"
				class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
					aria-label={isOpen ? `Collapse ${node.folder.name}` : `Expand ${node.folder.name}`}
					aria-expanded={isOpen}
					onclick={() => onToggle(node.folder!.id)}
				>
					<ChevronRight
						class={['h-4 w-4 transition-transform', isOpen ? 'rotate-90' : ''].join(' ')}
					/>
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
						{canInsertIntoPage}
						{canDragIntoPage}
						{onCreateSubfolder}
						{onDeleteFolder}
						{onDeleteBlock}
						{onInsertBlockIntoPage}
					/>
				{/each}

				{#each node.blocks as block (block.id)}
					{@const stateMeta = getStateMeta(getReusableBlockPublishState(block))}
					<div
						class={[
							'flex min-w-0 items-center justify-between gap-2 rounded-md py-2 pr-3 text-sm transition',
							activeBlockId === block.id
								? 'bg-muted text-foreground'
								: 'text-muted-foreground hover:bg-muted hover:text-foreground'
						].join(' ')}
						style={`padding-left: ${(depth + 1) * 1.25 + 0.75}rem`}
					>
						<ContextMenu.Root>
							<ContextMenu.Trigger class="flex min-w-0 flex-1">
								<a
									href={`/content/${block.id}`}
									class="flex min-w-0 flex-1 items-center justify-between gap-3"
									draggable={canInsertIntoPage && canDragIntoPage}
									onclick={onClose}
									ondragstart={(event) => setReusableBlockDragData(event, block.id)}
								>
									<span class="min-w-0 flex-1 truncate font-medium">{block.name}</span>
									<div class="flex shrink-0 items-center gap-1.5">
										<span class={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${stateMeta.className}`}>
											{stateMeta.label}
										</span>
										<span class="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
											{block.block_type}
										</span>
									</div>
								</a>
							</ContextMenu.Trigger>
							<ContextMenu.Content class="z-50 min-w-44 rounded-xl border border-border bg-popover p-1.5 shadow-lg">
								{#if canInsertIntoPage}
									<ContextMenu.Item
										class="rounded-lg px-2 py-2 text-sm text-slate-700 outline-none transition focus:bg-slate-100"
										onSelect={() => onInsertBlockIntoPage(block.id)}
									>
										Insert into page
									</ContextMenu.Item>
								{/if}
								<ContextMenu.Item
									class="rounded-lg px-2 py-2 text-sm text-red-700 outline-none transition focus:bg-red-50"
									onSelect={() => onDeleteBlock(block.id, block.name)}
								>
										Delete content
								</ContextMenu.Item>
							</ContextMenu.Content>
						</ContextMenu.Root>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger class="shrink-0 rounded-md border border-border bg-background px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground transition hover:bg-muted hover:text-foreground">
								Actions
							</DropdownMenu.Trigger>
							<DropdownMenu.Content class="z-50 min-w-44 rounded-xl border border-border bg-popover p-1.5 shadow-lg">
								{#if canInsertIntoPage}
									<DropdownMenu.Item
										class="rounded-lg px-2 py-2 text-sm text-slate-700 outline-none transition focus:bg-slate-100"
										onSelect={() => onInsertBlockIntoPage(block.id)}
									>
										Insert into page
									</DropdownMenu.Item>
								{/if}
								<DropdownMenu.Item
									class="rounded-lg px-2 py-2 text-sm text-red-700 outline-none transition focus:bg-red-50"
									onSelect={() => onDeleteBlock(block.id, block.name)}
								>
										Delete content
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
						{#if canInsertIntoPage}
							<CmsIconButton
								label={`Add ${block.name} to current page`}
								title="Add to current page"
								onclick={() => onInsertBlockIntoPage(block.id)}
							>
								{#snippet children()}
									<Plus class="h-4 w-4" />
								{/snippet}
							</CmsIconButton>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
