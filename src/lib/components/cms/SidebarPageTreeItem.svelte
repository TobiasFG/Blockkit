<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { ChevronRight, EllipsisVertical, FileText, FolderOpen } from '$lib/icons';
	import { getPagePublishState } from '$lib/pageStatus';
	import SidebarPageTreeItem from './SidebarPageTreeItem.svelte';
	import type { SidebarTreeNode } from './sidebarTree';

	type Props = {
		node: SidebarTreeNode;
		depth: number;
		activePageId: string | null;
		closedNodes: Record<string, boolean>;
		collapsed?: boolean;
		onToggle: (pageId: string) => void;
		onClose: () => void;
		editHref: (pageId: string) => string;
		displayPath: (path: string) => string;
	};

	let {
		node,
		depth,
		activePageId,
		closedNodes,
		collapsed = false,
		onToggle,
		onClose,
		editHref,
		displayPath
	}: Props = $props();

	const hasChildren = $derived(node.children.length > 0);
	const isOpen = $derived(hasChildren ? !closedNodes[node.page.id] : false);
	const isActive = $derived(activePageId === node.page.id);
	const publishState = $derived(getPagePublishState(node.page));
	const publishStateClass = $derived(
		publishState === 'draft-changes'
			? 'bg-amber-500'
			: publishState === 'published'
				? 'bg-emerald-500'
				: 'bg-slate-400'
	);
</script>

<div class="space-y-1">
	<div class="flex items-center gap-1">
		{#if !collapsed}
			<button
				type="button"
				class={[
					'inline-flex h-8 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30',
					hasChildren ? 'hover:bg-muted hover:text-foreground' : 'cursor-default opacity-40'
				].join(' ')}
				aria-label={
					hasChildren
						? isOpen
							? `Collapse ${node.page.title}`
							: `Expand ${node.page.title}`
						: `${node.page.title} has no child pages`
				}
				aria-expanded={hasChildren ? isOpen : undefined}
				disabled={!hasChildren}
				onclick={() => hasChildren && onToggle(node.page.id)}
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

		<a
			href={editHref(node.page.id)}
			class={[
				'group flex min-w-0 flex-1 items-center gap-3 rounded-md py-1.5 pr-2 text-sm transition',
				collapsed ? 'justify-center px-0' : '',
				isActive
					? 'bg-muted text-foreground'
					: 'text-slate-700 hover:bg-muted hover:text-foreground dark:text-muted-foreground'
			].join(' ')}
			style={!collapsed && depth > 0 ? `padding-left: ${depth * 1 + 0.25}rem` : undefined}
			title={collapsed ? `${node.page.title} (${displayPath(node.page.path)})` : undefined}
			onclick={onClose}
		>
			<span
				class={[
					'grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border/70 bg-background text-muted-foreground transition group-hover:text-foreground',
					isActive ? 'border-border bg-background text-foreground' : ''
				].join(' ')}
			>
				{#if depth === 0 && hasChildren}
					<FolderOpen class="h-4 w-4" />
				{:else}
					<FileText class="h-4 w-4" />
				{/if}
			</span>

			{#if !collapsed}
				<div class="min-w-[4rem] flex-1">
					<div class="truncate font-medium leading-5">{node.page.title}</div>
				</div>
				{#if depth === 0 && publishState === 'published'}
					<span class="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
						Published
					</span>
				{:else if hasChildren}
					<span class="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
						{node.children.length}
					</span>
				{:else}
					<span class={`h-2.5 w-2.5 shrink-0 rounded-full ${publishStateClass}`}></span>
				{/if}
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					class="h-8 w-8 shrink-0 rounded-md text-muted-foreground opacity-70 hover:opacity-100"
					aria-label={`Actions for ${node.page.title}`}
				>
					<EllipsisVertical class="h-4 w-4" />
				</Button>
			{/if}
		</a>
	</div>

	{#if hasChildren && isOpen}
		<div class={collapsed ? 'hidden' : 'ml-4 space-y-1 border-l border-border/60 pl-2'}>
			{#each node.children as child (child.page.id)}
				<SidebarPageTreeItem
					node={child}
					depth={depth + 1}
					{activePageId}
					{closedNodes}
					{collapsed}
					{onToggle}
					{onClose}
					{editHref}
					{displayPath}
				/>
			{/each}
		</div>
	{/if}
</div>
