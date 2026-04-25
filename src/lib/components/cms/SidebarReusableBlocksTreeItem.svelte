<script lang="ts">
	import { ContextMenu } from 'bits-ui';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { ChevronRight, EllipsisVertical, FileText, Folder, Quote } from '$lib/icons';
	import { getReusableBlockPublishState } from '$lib/reusableBlockStatus';
	import { setReusableBlockDragData } from './reusableBlockInsertion';
	import SidebarReusableBlocksTreeItem from './SidebarReusableBlocksTreeItem.svelte';
	import type { ReusableBlocksTreeNode } from './reusableBlocksTree';

	type Props = {
		node: ReusableBlocksTreeNode;
		depth: number;
		activeBlockId: string | null;
		closedNodes: Record<string, boolean>;
		collapsed?: boolean;
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
		collapsed = false,
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
				return { dotClass: 'bg-amber-500' };
			case 'published':
				return { dotClass: 'bg-emerald-500' };
			default:
				return { dotClass: 'bg-slate-400' };
		}
	};
</script>

{#if node.folder}
	<div class="space-y-1">
		<div class="flex items-center gap-1">
			{#if !collapsed}
				<button
					type="button"
					class={[
						'inline-flex h-8 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30',
						hasChildren ? 'hover:bg-muted hover:text-foreground' : 'cursor-default opacity-40'
					].join(' ')}
					aria-label={isOpen ? `Collapse ${node.folder.name}` : `Expand ${node.folder.name}`}
					aria-expanded={hasChildren ? isOpen : undefined}
					disabled={!hasChildren}
					onclick={() => hasChildren && onToggle(node.folder!.id)}
				>
					{#if hasChildren}
						<ChevronRight
							class={['h-4 w-4 transition-transform', isOpen ? 'rotate-90' : ''].join(' ')}
						/>
					{:else}
						<span class="h-1.5 w-1.5 rounded-full bg-border"></span>
					{/if}
				</button>
			{/if}
			<ContextMenu.Root>
				<ContextMenu.Trigger
					class={[
						'group flex min-w-0 flex-1 items-center gap-3 rounded-md py-1.5 pr-2 text-sm text-slate-700 transition hover:bg-muted hover:text-foreground dark:text-muted-foreground',
						collapsed ? 'justify-center px-0' : ''
					].join(' ')}
					style={!collapsed ? `padding-left: ${depth * 1 + 0.25}rem` : undefined}
					title={collapsed ? node.folder.name : undefined}
				>
					<span class="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border/70 bg-background text-muted-foreground transition group-hover:text-foreground">
						<Folder class="h-4 w-4" />
					</span>
					{#if !collapsed}
						<span class="min-w-[4rem] truncate font-medium">{node.folder.name}</span>
						<span class="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
							Folder
						</span>
					{/if}
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
			{#if !collapsed}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class={`${buttonVariants({ variant: 'ghost', size: 'icon-sm' })} h-8 w-8 rounded-md text-muted-foreground`}
					>
						<EllipsisVertical class="h-4 w-4" />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="min-w-44 rounded-xl p-1.5">
						<DropdownMenu.Item
							class="rounded-lg px-2 py-2 text-sm"
							onSelect={() => onCreateSubfolder(node.folder!.id, node.folder!.name)}
						>
							Create subfolder
						</DropdownMenu.Item>
						<DropdownMenu.Item
							variant="destructive"
							class="rounded-lg px-2 py-2 text-sm"
							onSelect={() => onDeleteFolder(node.folder!.id, node.folder!.name)}
						>
							Delete folder
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{/if}
		</div>

		{#if isOpen}
			<div class={collapsed ? 'hidden' : 'ml-4 space-y-1 border-l border-border/60 pl-2'}>
				{#each node.folders as child (child.folder?.id)}
					<SidebarReusableBlocksTreeItem
						node={child}
						depth={depth + 1}
						{activeBlockId}
						{closedNodes}
						{collapsed}
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
							'flex min-w-0 items-center justify-between gap-2 rounded-md py-1.5 pr-2 text-sm transition',
							activeBlockId === block.id
								? 'bg-muted text-foreground'
								: 'text-slate-700 hover:bg-muted hover:text-foreground dark:text-muted-foreground'
						].join(' ')}
						style={`padding-left: ${(depth + 1) * 1 + 0.25}rem`}
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
									<div class="flex min-w-0 flex-1 items-center gap-3">
										<span class="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border/70 bg-background text-muted-foreground">
											{#if block.block_type.toLowerCase().includes('quote') || block.block_type.toLowerCase().includes('testimonial')}
												<Quote class="h-4 w-4" />
											{:else}
												<FileText class="h-4 w-4" />
											{/if}
										</span>
										<span class="min-w-[4rem] flex-1 truncate font-medium">{block.name}</span>
									</div>
									<div class="flex shrink-0 items-center gap-1.5">
										<span class="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
											{block.block_type}
										</span>
										<span class={`h-2.5 w-2.5 rounded-full ${stateMeta.dotClass}`}></span>
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
							<DropdownMenu.Trigger
								class={`${buttonVariants({ variant: 'ghost', size: 'icon-sm' })} h-8 w-8 shrink-0 rounded-md text-muted-foreground`}
							>
								<EllipsisVertical class="h-4 w-4" />
							</DropdownMenu.Trigger>
							<DropdownMenu.Content class="min-w-44 rounded-xl p-1.5">
								{#if canInsertIntoPage}
									<DropdownMenu.Item
										class="rounded-lg px-2 py-2 text-sm"
										onSelect={() => onInsertBlockIntoPage(block.id)}
									>
										Insert into page
									</DropdownMenu.Item>
								{/if}
								<DropdownMenu.Item
									variant="destructive"
									class="rounded-lg px-2 py-2 text-sm"
									onSelect={() => onDeleteBlock(block.id, block.name)}
								>
										Delete content
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
