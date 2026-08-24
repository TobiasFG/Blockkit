<script lang="ts">
	import type { BlockInstance } from '$lib/content';
	import Block from './Block.svelte';

	let { block }: { block: BlockInstance } = $props();
	let title = $derived(typeof block.fields.title === 'string' ? block.fields.title : '');
	let items = $derived(Array.isArray(block.fields.items) ? block.fields.items : []);
</script>

<section>
	{#if title}
		<h2>{title}</h2>
	{/if}
	{#each items as item (item.id)}
		<Block block={item} />
	{/each}
</section>

<style>
	section {
		margin: 0 0 2rem;
	}

	h2 {
		font-size: 1.25rem;
		margin: 0 0 0.75rem;
	}
</style>
