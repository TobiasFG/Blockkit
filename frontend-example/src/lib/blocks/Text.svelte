<script lang="ts">
	import type { BlockInstance } from '$lib/content';

	let { block }: { block: BlockInstance } = $props();
	let body = $derived(typeof block.fields.body === 'string' ? block.fields.body : '');
</script>

<p>{body}</p>

<style>
	p {
		line-height: 1.6;
		margin: 0 0 1rem;
	}
</style>
