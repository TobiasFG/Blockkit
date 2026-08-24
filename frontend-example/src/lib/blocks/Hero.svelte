<script lang="ts">
	import type { BlockInstance } from '$lib/content';

	let { block }: { block: BlockInstance } = $props();
	let heading = $derived(typeof block.fields.heading === 'string' ? block.fields.heading : '');
	let description = $derived(
		typeof block.fields.description === 'string' ? block.fields.description : ''
	);
	let publishedOn = $derived(
		typeof block.fields.publishedOn === 'string' ? block.fields.publishedOn : null
	);
</script>

<header>
	<h1>{heading}</h1>
	{#if description}
		<p>{description}</p>
	{/if}
	{#if publishedOn}
		<time datetime={publishedOn}>{new Date(publishedOn).toLocaleDateString()}</time>
	{/if}
</header>

<style>
	header {
		border-bottom: 1px solid #e5e7eb;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
	}

	h1 {
		font-size: 2rem;
		margin: 0;
	}

	p {
		color: #4b5563;
		margin: 0.5rem 0 0;
	}

	time {
		color: #6b7280;
		font-size: 0.875rem;
	}
</style>
