<script lang="ts">
	import type { Component as SvelteComponentType } from 'svelte';
	import ToastProvider from './ToastProvider.svelte';

	let {
		RenderedComponent,
		componentProps = {}
	}: { RenderedComponent: SvelteComponentType<any>; componentProps?: Record<string, unknown> } = $props();
</script>

<ToastProvider>
	<RenderedComponent {...componentProps}></RenderedComponent>
</ToastProvider>
