<script lang="ts">
	import { pageHasDraftChanges } from '$lib/pageStatus';
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
	const showDraftBadge = $derived(pageHasDraftChanges(node.page));
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
				{#if showDraftBadge}
					<span class="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
						Draft
					</span>
				{/if}
			</div>
			<span class="shrink-0 font-mono text-xs text-slate-500">{displaySlug(node.page.slug)}</span>
		</a>

		{#if hasChildren}
			<button
				type="button"
				class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
				aria-label={isOpen ? `Collapse ${node.page.title}` : `Expand ${node.page.title}`}
				aria-expanded={isOpen}
				onclick={() => onToggle(node.page.slug)}
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
