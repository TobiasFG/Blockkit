<script lang="ts">
	import type { BlockInstance } from '$lib/content';
	import Hero from './Hero.svelte';
	import Section from './Section.svelte';
	import Text from './Text.svelte';

	let { block }: { block: BlockInstance } = $props();
</script>

{#if block.type === 'text'}
	<Text {block} />
{:else if block.type === 'hero'}
	<Hero {block} />
{:else if block.type === 'section'}
	<Section {block} />
{:else}
	<p class="unknown">Unknown block type: {block.type}</p>
{/if}

<style>
	.unknown {
		color: #b91c1c;
		font-family: monospace;
	}
</style>
