<script lang="ts">
	import { ChevronRight } from '$lib/icons';
	import { getPagePublishState } from '$lib/pageStatus';
	import SidebarPageTreeItem from './SidebarPageTreeItem.svelte';
	import type { SidebarTreeNode } from './sidebarTree';

	type Props = {
		node: SidebarTreeNode;
		depth: number;
		activeSlug: string | null;
		closedNodes: Record<string, boolean>;
		onToggle: (slug: string) => void;
		onClose: () => void;
		editHref: (slug: string) => string;
		displaySlug: (slug: string) => string;
	};

	let {
		node,
		depth,
		activeSlug,
		closedNodes,
		onToggle,
		onClose,
		editHref,
		displaySlug
	}: Props = $props();

	const hasChildren = $derived(node.children.length > 0);
	const isOpen = $derived(hasChildren ? !closedNodes[node.page.slug] : false);
	const isActive = $derived(activeSlug === node.page.slug);
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
			? 'bg-sky-100 text-sky-800'
			: publishState === 'published'
				? 'bg-emerald-100 text-emerald-800'
				: 'bg-amber-100 text-amber-800'
	);
</script>

<div class="space-y-1">
	<div class="flex items-center gap-1">
		<a
			href={editHref(node.page.slug)}
			class={[
				'flex min-w-0 flex-1 items-center justify-between gap-3 rounded-md py-2 pr-3 text-sm transition',
				depth === 0 ? 'pl-3' : '',
				isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-100'
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
			<span class="shrink-0 font-mono text-xs text-slate-500">{displaySlug(node.page.slug)}</span>
		</a>

		{#if hasChildren}
			<button
				type="button"
				class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200/70"
				aria-label={isOpen ? `Collapse ${node.page.title}` : `Expand ${node.page.title}`}
				aria-expanded={isOpen}
				onclick={() => onToggle(node.page.slug)}
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
					{activeSlug}
					{closedNodes}
					{onToggle}
					{onClose}
					{editHref}
					{displaySlug}
				/>
			{/each}
		</div>
	{/if}
</div>
