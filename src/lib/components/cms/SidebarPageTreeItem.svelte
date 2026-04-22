<script lang="ts">
	import { ChevronRight } from '$lib/icons';
	import { getPagePublishState } from '$lib/pageStatus';
	import SidebarPageTreeItem from './SidebarPageTreeItem.svelte';
	import type { SidebarTreeNode } from './sidebarTree';

	type Props = {
		node: SidebarTreeNode;
		depth: number;
		activePageId: string | null;
		closedNodes: Record<string, boolean>;
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
		onToggle,
		onClose,
		editHref,
		displayPath
	}: Props = $props();

	const hasChildren = $derived(node.children.length > 0);
	const isOpen = $derived(hasChildren ? !closedNodes[node.page.id] : false);
	const isActive = $derived(activePageId === node.page.id);
	const publishState = $derived(getPagePublishState(node.page));
	const publishStateLabel = $derived(
		publishState === 'draft-changes'
			? 'Draft changes'
			: publishState === 'published'
				? 'Published'
				: 'Unpublished'
	);
	const publishStateClass = $derived(
		publishState === 'draft-changes'
			? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
			: publishState === 'published'
				? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
				: 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
	);
</script>

<div class="space-y-1">
	<div class="flex items-center gap-1">
		<a
			href={editHref(node.page.id)}
			class={[
				'flex min-w-0 flex-1 items-center justify-between gap-3 rounded-md py-2 pr-3 text-sm transition',
				depth === 0 ? 'pl-3' : '',
				isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
			].join(' ')}
			style={depth > 0 ? `padding-left: ${depth * 1.25 + 0.75}rem` : undefined}
			onclick={onClose}
		>
			<div class="flex min-w-0 flex-1 items-center gap-2">
				<span class="min-w-0 flex-1 truncate font-medium">{node.page.title}</span>
				<span class={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${publishStateClass}`}>
					{publishStateLabel}
				</span>
			</div>
			<span class="shrink-0 font-mono text-xs text-muted-foreground">{displayPath(node.page.path)}</span>
		</a>

		{#if hasChildren}
			<button
				type="button"
				class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
				aria-label={isOpen ? `Collapse ${node.page.title}` : `Expand ${node.page.title}`}
				aria-expanded={isOpen}
				onclick={() => onToggle(node.page.id)}
			>
				<ChevronRight
					class={['h-4 w-4 transition-transform', isOpen ? 'rotate-90' : ''].join(' ')}
				/>
			</button>
		{/if}
	</div>

	{#if hasChildren && isOpen}
		<div class="space-y-1">
			{#each node.children as child (child.page.id)}
				<SidebarPageTreeItem
					node={child}
					depth={depth + 1}
					{activePageId}
					{closedNodes}
					{onToggle}
					{onClose}
					{editHref}
					{displayPath}
				/>
			{/each}
		</div>
	{/if}
</div>
