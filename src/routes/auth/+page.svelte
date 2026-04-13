<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';

	type Mode = 'login' | 'signup';

	let { data, form }: PageProps = $props();

	let mode = $state<Mode>('login');
	let pending = $state(false);
	let feedback = $state<{ tone: 'error' | 'success'; text: string } | null>(null);
	let stage = $state<'idle' | 'success'>('idle');
	let prefersReducedMotion = $state(false);

	const actionForMode = $derived(mode === 'login' ? '?/login' : '?/signup');
	const submitLabel = $derived(mode === 'login' ? 'Log in' : 'Create account');
	const switchLabel = $derived(mode === 'login' ? 'Need account?' : 'Already have account?');
	const switchActionLabel = $derived(mode === 'login' ? 'Sign up' : 'Log in');
	const transitionDelay = $derived(prefersReducedMotion ? 80 : 620);
	const redirectTo = $derived(data.redirectTo || '/');

	const setMode = (nextMode: Mode) => {
		mode = nextMode;
		feedback = null;
		stage = 'idle';
	};

	$effect(() => {
		if (form?.mode) {
			mode = form.mode === 'signup' ? 'signup' : 'login';
		}
	});

	$effect(() => {
		prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	});
</script>

<svelte:head>
	<title>Blockkit login</title>
</svelte:head>

<div class="min-h-screen overflow-hidden bg-[linear-gradient(140deg,#f5f1e8_0%,#fbfaf7_38%,#e8efe6_100%)] text-slate-900">
	<div class="relative min-h-screen">
		<div class="pointer-events-none absolute inset-0 overflow-hidden">
			<div class="absolute -left-16 top-12 h-56 w-56 rounded-full bg-amber-300/35 blur-3xl"></div>
			<div class="absolute right-0 top-0 h-72 w-72 rounded-full bg-emerald-200/45 blur-3xl"></div>
			<div class="absolute bottom-0 right-12 h-64 w-64 rounded-full bg-sky-200/30 blur-3xl"></div>
		</div>

		<div class="relative grid min-h-screen lg:grid-cols-[27rem_minmax(0,1fr)]">
			<section
				class={[
					'relative z-10 flex min-h-screen flex-col border-r border-black/5 bg-white/72 p-6 shadow-[18px_0_60px_-38px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-all duration-700 sm:p-8 lg:p-10',
					stage === 'success' ? 'lg:w-[18rem]' : 'lg:w-full'
				].join(' ')}
			>
				<div class="flex items-center gap-3">
					<div class="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-sm font-semibold tracking-[0.22em] text-white">
						BK
					</div>
					<div>
						<p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">Blockkit</p>
						<h1 class="font-serif text-2xl tracking-tight">Editorial CMS</h1>
					</div>
				</div>

				<div class="mt-10 space-y-4">
					<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Access</p>
					<h2 class="max-w-sm font-serif text-4xl leading-tight tracking-tight">
						Open workspace. Shape pages. Keep shared content tight.
					</h2>
					<p class="max-w-md text-sm leading-6 text-slate-600">
						Log in first. Sign up stays one switch away when you need a new editor account.
					</p>
				</div>

				<div class="mt-8 rounded-[1.75rem] border border-slate-200/80 bg-white/88 p-5 shadow-[0_22px_48px_-38px_rgba(15,23,42,0.45)]">
					<div class="flex rounded-2xl bg-slate-100 p-1">
						<button
							type="button"
							class={[
								'flex-1 rounded-xl px-3 py-2 text-sm font-medium transition',
								mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
							].join(' ')}
							onclick={() => setMode('login')}
						>
							Log in
						</button>
						<button
							type="button"
							class={[
								'flex-1 rounded-xl px-3 py-2 text-sm font-medium transition',
								mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
							].join(' ')}
							onclick={() => setMode('signup')}
						>
							Sign up
						</button>
					</div>

					{#if feedback}
						<div
							class={[
								'mt-4 rounded-2xl border px-4 py-3 text-sm',
								feedback.tone === 'error'
									? 'border-red-200 bg-red-50 text-red-800'
									: 'border-emerald-200 bg-emerald-50 text-emerald-800'
							].join(' ')}
						>
							{feedback.text}
						</div>
					{/if}

					<form
						method="POST"
						action={actionForMode}
						class="mt-4 space-y-4"
						use:enhance={() => {
							pending = true;
							feedback = null;
							stage = 'idle';

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
									stage = 'success';
									const nextTarget =
										result.data && 'redirectTo' in result.data
											? String(result.data.redirectTo || redirectTo)
											: redirectTo;

									window.setTimeout(() => {
										void goto(nextTarget, { invalidateAll: true });
									}, transitionDelay);
								}
							};
						}}
					>
						<input type="hidden" name="redirectTo" value={redirectTo} />

						<div class="space-y-1.5">
							<label for="email" class="text-sm font-medium text-slate-700">Email</label>
							<input
								id="email"
								name="email"
								type="email"
								required
								autocomplete="email"
								class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
								placeholder="editor@blockkit.local"
							/>
						</div>

						<div class="space-y-1.5">
							<label for="password" class="text-sm font-medium text-slate-700">Password</label>
							<input
								id="password"
								name="password"
								type="password"
								required
								minlength="6"
								autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
								class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
								placeholder="Minimum 6 characters"
							/>
						</div>

						<button
							type="submit"
							class="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
							disabled={pending}
						>
							{pending ? 'Working...' : submitLabel}
						</button>
					</form>

					<div class="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600">
						<span>{switchLabel}</span>
						<button
							type="button"
							class="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-900"
							onclick={() => setMode(mode === 'login' ? 'signup' : 'login')}
						>
							{switchActionLabel}
						</button>
					</div>
				</div>

				<div class="mt-auto pt-8 text-xs leading-6 text-slate-500">
					Local auth uses Supabase email/password. Any signed-in editor can access CMS in this pass.
				</div>
			</section>

			<section class="relative hidden min-h-screen overflow-hidden lg:flex">
				<div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_34%),linear-gradient(140deg,rgba(17,24,39,0.98)_0%,rgba(36,64,52,0.95)_52%,rgba(90,63,40,0.88)_100%)]"></div>
				<div class="absolute inset-0 opacity-70">
					<div class="absolute left-[14%] top-[12%] h-36 w-36 rounded-[2rem] border border-white/20 bg-white/10 backdrop-blur-sm"></div>
					<div class="absolute left-[28%] top-[32%] h-52 w-52 rounded-[2.5rem] border border-white/10 bg-emerald-100/10"></div>
					<div class="absolute right-[18%] top-[18%] h-44 w-44 rounded-[2rem] border border-white/10 bg-amber-100/10"></div>
					<div class="absolute right-[12%] bottom-[14%] h-72 w-72 rounded-[3rem] border border-white/10 bg-sky-100/10"></div>
				</div>

				<div class="relative z-10 flex w-full flex-col justify-between p-12 text-white">
					<div class="max-w-xl space-y-5">
						<p class="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Workspace preview</p>
						<h3 class="font-serif text-5xl leading-tight tracking-tight">
							Auth rail narrows. Editor shell steps forward.
						</h3>
						<p class="max-w-lg text-base leading-7 text-white/72">
							Block-driven pages on left. Shared content in library. Draft work centered, not buried.
						</p>
					</div>

					<div
						class={[
							'ml-auto grid w-full max-w-3xl grid-cols-[16rem_minmax(0,1fr)] gap-4 rounded-[2rem] border border-white/10 bg-white/8 p-4 shadow-[0_40px_120px_-48px_rgba(15,23,42,0.9)] backdrop-blur transition-all duration-700',
							stage === 'success' ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-90'
						].join(' ')}
					>
						<div
							class={[
								'rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 transition-all duration-700',
								stage === 'success' ? 'w-[13rem]' : 'w-full'
							].join(' ')}
						>
							<div class="flex items-center gap-2 text-white/80">
								<div class="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-xs font-semibold">BK</div>
								<div>
									<div class="text-sm font-semibold">Blockkit</div>
									<div class="text-[11px] text-white/50">Sidebar</div>
								</div>
							</div>
							<div class="mt-5 space-y-2">
								<div class="h-10 rounded-xl bg-white/8"></div>
								<div class="h-10 rounded-xl bg-white/8"></div>
								<div class="h-10 rounded-xl bg-white/8"></div>
								<div class="h-24 rounded-2xl border border-white/10 bg-white/6"></div>
							</div>
						</div>

						<div
							class={[
								'rounded-[1.5rem] border border-white/10 bg-white/92 p-5 text-slate-900 transition-all duration-700',
								stage === 'success' ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-80'
							].join(' ')}
						>
							<div class="flex items-center justify-between">
								<div>
									<div class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Editor</div>
									<div class="mt-1 text-2xl font-semibold tracking-tight">Pages first</div>
								</div>
								<div class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
									{stage === 'success' ? 'Live' : 'Ready'}
								</div>
							</div>
							<div class="mt-5 grid gap-3">
								<div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
									<div class="h-3 w-24 rounded-full bg-slate-200"></div>
									<div class="mt-4 h-14 rounded-2xl bg-white shadow-sm"></div>
								</div>
								<div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
									<div class="h-3 w-16 rounded-full bg-slate-200"></div>
									<div class="mt-4 grid gap-3">
										<div class="h-24 rounded-2xl bg-white shadow-sm"></div>
										<div class="h-24 rounded-2xl bg-white shadow-sm"></div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	</div>
</div>
