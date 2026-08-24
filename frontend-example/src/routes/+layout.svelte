<script lang="ts">
	let { children } = $props();
</script>

<main>
	{@render children()}
</main>

<style>
	:global(body) {
		background: #fff;
		color: #111827;
		font-family: system-ui, sans-serif;
		margin: 0;
	}

	main {
		margin: 0 auto;
		max-width: 42rem;
		padding: 3rem 1.5rem;
	}
</style>
