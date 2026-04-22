<script lang="ts">
	import type { Snippet } from 'svelte';
	import ToastViewport from './ToastViewport.svelte';
	import { setToastState } from './toastState.svelte';

	let { children }: { children: Snippet } = $props();

	const toastState = setToastState();
</script>

{@render children()}
<ToastViewport state={toastState} />
