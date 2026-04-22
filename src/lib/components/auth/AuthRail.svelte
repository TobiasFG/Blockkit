<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

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
	class="relative z-20 flex min-h-screen flex-col border-r border-border/60 bg-card/85 p-6 shadow-[18px_0_60px_-38px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-8 lg:absolute lg:inset-y-0 lg:left-0 lg:w-[27rem] lg:p-10"
>
	<div class="flex items-center gap-3">
		<div class="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-sm font-semibold tracking-[0.22em] text-primary-foreground">
			BK
		</div>
		<div>
			<p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">Blockkit</p>
			<h1 class="font-serif text-2xl tracking-tight">Editorial CMS</h1>
		</div>
	</div>

	<div class="mt-10 space-y-4">
		<p class="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Access</p>
		<h2 class="max-w-sm font-serif text-4xl leading-tight tracking-tight">
			Open workspace. Shape pages. Keep shared content tight.
		</h2>
		<p class="max-w-md text-sm leading-6 text-muted-foreground">
			Log in first. Sign up stays one switch away when you need a new editor account.
		</p>
	</div>

	<div class="mt-8 rounded-[1.75rem] border border-border/80 bg-card/92 p-5 shadow-[0_22px_48px_-38px_rgba(15,23,42,0.45)]">
		<div class="flex rounded-2xl bg-muted p-1">
			<Button
				type="button"
				variant={mode === 'login' ? 'secondary' : 'ghost'}
				class="h-10 flex-1 rounded-xl"
				onclick={() => onSetMode('login')}
			>
				Log in
			</Button>
			<Button
				type="button"
				variant={mode === 'signup' ? 'secondary' : 'ghost'}
				class="h-10 flex-1 rounded-xl"
				onclick={() => onSetMode('signup')}
			>
				Sign up
			</Button>
		</div>

		{#if feedback}
			<Alert.Root
				class="mt-4"
				variant={feedback.tone === 'error' ? 'destructive' : 'default'}
			>
				<Alert.Description>{feedback.text}</Alert.Description>
			</Alert.Root>
		{/if}

		<form method="POST" action={actionForMode} class="mt-4 space-y-4" use:enhance={enhanceSubmit}>
			<input type="hidden" name="redirectTo" value={redirectTo} />

			<div class="space-y-1.5">
				<Label for="email">Email</Label>
				<Input
					id="email"
					name="email"
					type="email"
					required
					autocomplete="email"
					value={emailValue}
					class="h-11 rounded-2xl"
					placeholder="editor@blockkit.local"
				/>
			</div>

			<div class="space-y-1.5">
				<Label for="password">Password</Label>
				<Input
					id="password"
					name="password"
					type="password"
					required
					minlength={6}
					autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
					class="h-11 rounded-2xl"
					placeholder="Minimum 6 characters"
				/>
			</div>

			<Button
				type="submit"
				class="h-11 w-full rounded-2xl"
				disabled={pending}
			>
				{pending ? 'Working...' : submitLabel}
			</Button>
		</form>

		<div class="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4 text-sm text-muted-foreground">
			<span>{switchLabel}</span>
			<Button
				type="button"
				variant="link"
				class="h-auto p-0 font-semibold"
				onclick={onToggleMode}
			>
				{switchActionLabel}
			</Button>
		</div>
	</div>

	<div class="mt-auto pt-8 text-xs leading-6 text-muted-foreground">
		Local auth uses Supabase email/password. Any signed-in editor can access CMS in this pass.
	</div>
</section>
