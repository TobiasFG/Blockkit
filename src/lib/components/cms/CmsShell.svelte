<script lang="ts">
	import { applyAction } from '$app/forms';
	import type { BlockFolder, Page, ReferencingPage, ReusableBlock } from '$lib/types';
	import { goto } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { User } from '@supabase/supabase-js';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import Sidebar from './Sidebar.svelte';

	let { pages, blockFolders, reusableBlocks, reusableBlockPageReferences, user, children } = $props<{
		pages: Page[];
		blockFolders: BlockFolder[];
		reusableBlocks: ReusableBlock[];
		reusableBlockPageReferences: Record<string, ReferencingPage[]>;
		user: User;
		children: Snippet;
	}>();
	let mobileOpen = $state(false);
	let entered = $state(false);
	let exiting = $state(false);
	let prefersReducedMotion = $state(false);
	let pendingNavigation = $state<string | null>(null);

	const closeMobile = () => {
		mobileOpen = false;
	};

	$effect(() => {
		prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	});

	onMount(() => {
		if (prefersReducedMotion) {
			entered = true;
			return;
		}

		const frame = window.requestAnimationFrame(() => {
			entered = true;
		});

		return () => window.cancelAnimationFrame(frame);
	});

	const easeOutQuint = (t: number) => 1 - (1 - t) ** 5;

	const sidebarOutro = (node: Element, { reducedMotion }: { reducedMotion: boolean }) => {
		const bounds = node.getBoundingClientRect();
		const distance = reducedMotion ? 8 : bounds.right + 40;

		return {
			duration: reducedMotion ? 110 : 520,
			easing: easeOutQuint,
			css: (t: number, u: number) =>
				`transform: translate3d(${-distance * u}px, 0, 0); opacity: ${reducedMotion ? 0.96 - u * 0.08 : 1 - u * 0.76};`
		};
	};

	const contentOutro = (node: Element, { reducedMotion }: { reducedMotion: boolean }) => {
		const bounds = node.getBoundingClientRect();
		const distance = reducedMotion ? 10 : window.innerWidth - bounds.left + 48;

		return {
			duration: reducedMotion ? 110 : 580,
			easing: easeOutQuint,
			css: (t: number, u: number) =>
				`transform: translate3d(${distance * u}px, 0, 0); opacity: ${reducedMotion ? 0.96 - u * 0.08 : 1 - u * 0.7};`
		};
	};

	const logoutSubmit: SubmitFunction = () => {
		return async ({ result }) => {
			await applyAction(result);

			if (result.type === 'failure') {
				return;
			}

			if (result.type === 'success') {
				pendingNavigation = '/auth';
				exiting = true;
			}
		};
	};

	const handleContentOutroEnd = () => {
		if (!pendingNavigation) return;
		void goto(pendingNavigation, { invalidateAll: true });
	};
</script>

<div class="relative min-h-screen bg-slate-50">
	<div
		aria-hidden="true"
		class={[
			'pointer-events-none absolute inset-0 z-40 bg-slate-50 transition-opacity ease-[cubic-bezier(0.22,1,0.36,1)]',
			prefersReducedMotion ? 'duration-100' : 'duration-[440ms]',
			entered && !exiting ? 'opacity-0' : 'opacity-100'
		].join(' ')}
	></div>

	{#if !exiting}
		<div
			out:sidebarOutro={{ reducedMotion: prefersReducedMotion }}
			class={[
				'transition-opacity ease-[cubic-bezier(0.22,1,0.36,1)]',
				prefersReducedMotion ? 'duration-100' : 'duration-[320ms]',
				entered ? 'opacity-100' : 'opacity-0'
			].join(' ')}
		>
			<Sidebar
				pages={pages}
				blockFolders={blockFolders}
				reusableBlocks={reusableBlocks}
				reusableBlockPageReferences={reusableBlockPageReferences}
				user={user}
				mobileOpen={mobileOpen}
				onClose={closeMobile}
				logoutEnhanceSubmit={logoutSubmit}
			/>
		</div>
	{/if}

	{#if !exiting}
		<div
			out:contentOutro={{ reducedMotion: prefersReducedMotion }}
			onoutroend={handleContentOutroEnd}
			class={[
				'lg:pl-72 transition-opacity ease-[cubic-bezier(0.22,1,0.36,1)]',
				prefersReducedMotion ? 'duration-100 delay-0' : 'duration-[360ms] delay-[80ms]',
				entered ? 'opacity-100' : 'opacity-0'
			].join(' ')}
		>
			<header class="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:hidden">
				<button
					type="button"
					class="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100"
					aria-label="Open sidebar"
					aria-expanded={mobileOpen}
					onclick={() => (mobileOpen = true)}
				>
					<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
				<div class="text-sm font-semibold text-slate-900">Blockkit CMS</div>
			</header>

			<div class="p-4 lg:p-8">
				{@render children()}
			</div>
		</div>
	{/if}
</div>
