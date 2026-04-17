<script lang="ts">
	import { applyAction } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import AuthPreviewStage from '$lib/components/auth/AuthPreviewStage.svelte';
	import AuthRail from '$lib/components/auth/AuthRail.svelte';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';

	type Mode = 'login' | 'signup';

	let { data, form }: PageProps = $props();

	let mode = $state<Mode>('login');
	let pending = $state(false);
	let feedback = $state<{ tone: 'error' | 'success'; text: string } | null>(null);
	let entered = $state(false);
	let exiting = $state(false);
	let prefersReducedMotion = $state(false);
	let pendingNavigation = $state<string | null>(null);

	const actionForMode = $derived(mode === 'login' ? '?/login' : '?/signup');
	const submitLabel = $derived(mode === 'login' ? 'Log in' : 'Create account');
	const switchLabel = $derived(mode === 'login' ? 'Need account?' : 'Already have account?');
	const switchActionLabel = $derived(mode === 'login' ? 'Sign up' : 'Log in');
	const redirectTo = $derived(data.redirectTo || '/');
	const emailValue = $derived(
		typeof (form as Record<string, unknown> | null | undefined)?.email === 'string'
			? String((form as Record<string, unknown>).email)
			: ''
	);

	const setMode = (nextMode: Mode) => {
		mode = nextMode;
		feedback = null;
		exiting = false;
	};

	$effect(() => {
		if (form?.mode) {
			mode = form.mode === 'signup' ? 'signup' : 'login';
		}
	});

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

	const enhanceSubmit: SubmitFunction = () => {
		pending = true;
		feedback = null;
		exiting = false;
		pendingNavigation = null;

		return async ({ result }) => {
			pending = false;
			await applyAction(result);

			if (result.type === 'failure') {
				feedback = {
					tone: 'error',
					text:
						typeof result.data?.error === 'string'
							? result.data.error
							: 'Authentication failed.'
				};
				mode = result.data?.mode === 'signup' ? 'signup' : 'login';
				return;
			}

			if (result.type === 'success') {
				feedback = {
					tone: 'success',
					text:
						mode === 'login'
							? 'Welcome back. Opening editor...'
							: 'Account ready. Opening editor...'
				};
				pendingNavigation =
					result.data && 'redirectTo' in result.data
						? String(result.data.redirectTo || redirectTo)
						: redirectTo;
				exiting = true;
			}
		};
	};

	const handlePreviewOutroEnd = () => {
		if (!pendingNavigation) return;
		void goto(pendingNavigation, { invalidateAll: true });
	};
</script>

<svelte:head>
	<title>Blockkit login</title>
</svelte:head>

<div class="min-h-screen overflow-hidden bg-[linear-gradient(140deg,#f5f1e8_0%,#fbfaf7_38%,#e8efe6_100%)] text-slate-900">
	<div class="relative min-h-screen">
		<div
			aria-hidden="true"
			class={[
				'pointer-events-none absolute inset-0 z-40 bg-[linear-gradient(140deg,#f5f1e8_0%,#fbfaf7_38%,#e8efe6_100%)] transition-opacity ease-[cubic-bezier(0.22,1,0.36,1)]',
				prefersReducedMotion ? 'duration-100' : 'duration-[440ms]',
				entered && !exiting ? 'opacity-0' : 'opacity-100'
			].join(' ')}
		></div>

		<div class="pointer-events-none absolute inset-0 overflow-hidden">
			<div class="absolute -left-16 top-12 h-56 w-56 rounded-full bg-amber-300/35 blur-3xl"></div>
			<div class="absolute right-0 top-0 h-72 w-72 rounded-full bg-emerald-200/45 blur-3xl"></div>
			<div class="absolute bottom-0 right-12 h-64 w-64 rounded-full bg-sky-200/30 blur-3xl"></div>
		</div>

		<div class="relative min-h-screen">
			{#if !exiting}
				<div
					class={[
						'transition-opacity ease-[cubic-bezier(0.22,1,0.36,1)]',
						prefersReducedMotion ? 'duration-100 delay-0' : 'duration-[360ms] delay-[80ms]',
						entered ? 'opacity-100' : 'opacity-0'
					].join(' ')}
				>
					<AuthPreviewStage
						reducedMotion={prefersReducedMotion}
						onOutroEnd={handlePreviewOutroEnd}
					/>
				</div>
			{/if}

			{#if !exiting}
				<div
					class={[
						'transition-opacity ease-[cubic-bezier(0.22,1,0.36,1)]',
						prefersReducedMotion ? 'duration-100' : 'duration-[320ms]',
						entered ? 'opacity-100' : 'opacity-0'
					].join(' ')}
				>
					<AuthRail
						{mode}
						{pending}
						{feedback}
						{submitLabel}
						{switchLabel}
						{switchActionLabel}
						{actionForMode}
						{redirectTo}
						{emailValue}
						reducedMotion={prefersReducedMotion}
						{enhanceSubmit}
						onSetMode={setMode}
						onToggleMode={() => setMode(mode === 'login' ? 'signup' : 'login')}
					/>
				</div>
			{/if}
		</div>
	</div>
</div>
