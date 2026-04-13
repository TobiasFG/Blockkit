<script lang="ts">
	import { ContextMenu, DropdownMenu } from 'bits-ui';
	import SidebarReusableBlocksTreeItem from './SidebarReusableBlocksTreeItem.svelte';
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
</script>

{#if node.folder}
	<div class="space-y-1">
		<div class="flex items-center gap-1">
			<ContextMenu.Root>
				<ContextMenu.Trigger
					class="flex min-w-0 flex-1 items-center gap-2 rounded-md py-2 pr-3 text-sm text-slate-700"
					style={`padding-left: ${depth * 1.25 + 0.75}rem`}
				>
					<span class="truncate font-medium">{node.folder.name}</span>
					<span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
						Folder
					</span>
				</ContextMenu.Trigger>
				<ContextMenu.Content class="z-50 min-w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
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
				<DropdownMenu.Trigger class="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900">
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
						{canInsertIntoPage}
						{canDragIntoPage}
						{onCreateSubfolder}
						{onDeleteFolder}
						{onDeleteBlock}
						{onInsertBlockIntoPage}
					/>
				{/each}

				{#each node.blocks as block (block.id)}
					<div
						class={[
							'flex min-w-0 items-center justify-between gap-2 rounded-md py-2 pr-3 text-sm transition',
							activeBlockId === block.id
								? 'bg-slate-100 text-slate-900'
								: 'text-slate-700 hover:bg-slate-100'
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
							</ContextMenu.Trigger>
							<ContextMenu.Content class="z-50 min-w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
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
							<DropdownMenu.Trigger class="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900">
								Actions
							</DropdownMenu.Trigger>
							<DropdownMenu.Content class="z-50 min-w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
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
							<button
								type="button"
								class="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
								onclick={() => onInsertBlockIntoPage(block.id)}
							>
								Add
							</button>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
