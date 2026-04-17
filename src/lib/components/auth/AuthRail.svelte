<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	type Feedback = { tone: 'error' | 'success'; text: string } | null;
	type Mode = 'login' | 'signup';

	type Props = {
		mode: Mode;
		pending: boolean;
		feedback: Feedback;
		submitLabel: string;
		switchLabel: string;
		switchActionLabel: string;
		actionForMode: string;
		redirectTo: string;
		emailValue?: string;
		reducedMotion?: boolean;
		onSetMode: (mode: Mode) => void;
		onToggleMode: () => void;
		enhanceSubmit: SubmitFunction;
	};

	let {
		mode,
		pending,
		feedback,
		submitLabel,
		switchLabel,
		switchActionLabel,
		actionForMode,
		redirectTo,
		emailValue = '',
		reducedMotion = false,
		onSetMode,
		onToggleMode,
		enhanceSubmit
	}: Props = $props();

	const easeOutQuint = (t: number) => 1 - (1 - t) ** 5;

	const railOutro = (node: Element, { reducedMotion }: { reducedMotion: boolean }) => {
		const bounds = node.getBoundingClientRect();
		const distance = reducedMotion ? 8 : bounds.right + 48;

		return {
			duration: reducedMotion ? 110 : 560,
			easing: easeOutQuint,
			css: (t: number, u: number) =>
				`transform: translate3d(${-distance * u}px, 0, 0); opacity: ${reducedMotion ? 0.94 - u * 0.06 : 1 - u * 0.72};`
		};
	};
</script>

<section
	out:railOutro={{ reducedMotion }}
	class="relative z-20 flex min-h-screen flex-col border-r border-black/5 bg-white/80 p-6 shadow-[18px_0_60px_-38px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-8 lg:absolute lg:inset-y-0 lg:left-0 lg:w-[27rem] lg:p-10"
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
				onclick={() => onSetMode('login')}
			>
				Log in
			</button>
			<button
				type="button"
				class={[
					'flex-1 rounded-xl px-3 py-2 text-sm font-medium transition',
					mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
				].join(' ')}
				onclick={() => onSetMode('signup')}
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

		<form method="POST" action={actionForMode} class="mt-4 space-y-4" use:enhance={enhanceSubmit}>
			<input type="hidden" name="redirectTo" value={redirectTo} />

			<div class="space-y-1.5">
				<label for="email" class="text-sm font-medium text-slate-700">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					autocomplete="email"
					value={emailValue}
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
				onclick={onToggleMode}
			>
				{switchActionLabel}
			</button>
		</div>
	</div>

	<div class="mt-auto pt-8 text-xs leading-6 text-slate-500">
		Local auth uses Supabase email/password. Any signed-in editor can access CMS in this pass.
	</div>
</section>
