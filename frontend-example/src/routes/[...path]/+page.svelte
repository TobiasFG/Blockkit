<script lang="ts">
	import Block from '$lib/blocks/Block.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.page.title}</title>
</svelte:head>

<nav>
	{#each data.navigation as item (item.path)}
		<a href={item.path} aria-current={item.path === data.page.path ? 'page' : undefined}>
			{item.title}
		</a>
	{/each}
</nav>

{#each data.page.blocks as block (block.id)}
	<Block {block} />
{/each}

{#if data.page.blocks.length === 0}
	<p class="empty">This page has no published blocks yet.</p>
{/if}

<style>
	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	nav a {
		color: #4b5563;
		font-size: 0.875rem;
		text-decoration: none;
	}

	nav a[aria-current='page'] {
		color: #111827;
		font-weight: 600;
	}

	.empty {
		color: #6b7280;
	}
</style>
