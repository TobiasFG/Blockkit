<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	type Props = {
		label: string;
		title?: string;
		type?: 'button' | 'submit' | 'reset';
		class?: string;
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		children: Snippet;
	};

	let {
		label,
		title = undefined,
		type = 'button',
		class: className = '',
		disabled = false,
		onclick = undefined,
		children
	}: Props = $props();
</script>

<Button
	{type}
	variant="outline"
	size="icon-sm"
	aria-label={label}
	{title}
	{disabled}
	class={className}
	{onclick}
>
	{@render children()}
</Button>
