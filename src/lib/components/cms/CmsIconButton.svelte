<script lang="ts">
	import type { Snippet } from 'svelte';

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

<button
	{type}
	aria-label={label}
	{title}
	{disabled}
	class={[
		'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200/70 disabled:cursor-not-allowed disabled:opacity-60',
		className
	].join(' ')}
	{onclick}
>
	{@render children()}
</button>
