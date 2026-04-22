<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { Progress } from '$lib/components/ui/progress';
	import type { ToastRecord, ToastState } from './toastState.svelte';
	import { getToastState } from './toastState.svelte';

	let { state: toastState = getToastState() }: { state?: ToastState } = $props();

	let now = $state(Date.now());

	const toneTheme = {
		success: {
			iconWrap: 'bg-emerald-50 text-emerald-600',
			progressTrack: 'bg-emerald-100',
			progressFill: 'bg-emerald-300',
			secondaryAction: 'text-teal-700 hover:text-teal-800 focus-visible:ring-teal-200',
			primaryAction:
				'border-teal-600 text-teal-700 hover:bg-teal-50 focus-visible:ring-teal-200'
		},
		info: {
			iconWrap: 'bg-sky-50 text-sky-600',
			progressTrack: 'bg-sky-100',
			progressFill: 'bg-sky-300',
			secondaryAction: 'text-teal-700 hover:text-teal-800 focus-visible:ring-teal-200',
			primaryAction:
				'border-teal-600 text-teal-700 hover:bg-teal-50 focus-visible:ring-teal-200'
		},
		warning: {
			iconWrap: 'bg-amber-50 text-amber-600',
			progressTrack: 'bg-amber-50',
			progressFill: 'bg-amber-200',
			secondaryAction: 'text-teal-700 hover:text-teal-800 focus-visible:ring-teal-200',
			primaryAction:
				'border-teal-600 text-teal-700 hover:bg-teal-50 focus-visible:ring-teal-200'
		},
		error: {
			iconWrap: 'bg-rose-50 text-rose-600',
			progressTrack: 'bg-rose-100',
			progressFill: 'bg-rose-500',
			secondaryAction: 'text-rose-500 hover:text-rose-600 focus-visible:ring-rose-200',
			primaryAction:
				'border-rose-500 bg-rose-500 text-white hover:bg-rose-600 focus-visible:ring-rose-200'
		}
	} as const;

	const iconPathByTone = {
		success: ['M7.4 12.5l2.8 2.8L16.7 8.8'],
		info: ['M12 10.1v4.6', 'M12 7.2h.01'],
		warning: ['M12 9.3v3.8', 'M12 16h.01', 'M12 4.7L20 18.4H4z'],
		error: ['M8.7 8.7l6.6 6.6', 'M15.3 8.7l-6.6 6.6']
	} as const;

	const compactActionClass =
		'inline-flex min-h-11 items-center justify-center rounded-[8px] border px-5 text-[18px] font-medium leading-none transition focus-visible:outline-none focus-visible:ring-4';
	const regularActionClass =
		'inline-flex min-h-11 items-center justify-center rounded-[8px] border px-5 text-[17px] font-medium leading-none transition focus-visible:outline-none focus-visible:ring-4';

	const getProgressValue = (toast: ToastRecord) => {
		if (toast.durationMs === null || toast.durationMs <= 0) return 0;

		const elapsed = Math.max(0, now - toast.createdAt);
		return Math.min(100, (elapsed / toast.durationMs) * 100);
	};

	$effect(() => {
		const hasTimedToast = toastState.toasts.some((toast) => toast.durationMs !== null);

		if (!hasTimedToast) return;

		now = Date.now();
		const interval = window.setInterval(() => {
			now = Date.now();
		}, 40);

		return () => {
			window.clearInterval(interval);
		};
	});
</script>

<div class="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4 sm:justify-end sm:px-6 lg:bottom-6 lg:px-8">
	<div class="flex w-full max-w-[42rem] flex-col gap-4">
		{#each toastState.toasts as toast (toast.id)}
			{@const theme = toneTheme[toast.tone]}
			{@const isCompact = !toast.description}

			<section
				in:fly={{ y: 16, duration: 180, easing: cubicOut }}
				out:fly={{ y: 8, duration: 140 }}
				role={toast.tone === 'error' ? 'alert' : 'status'}
				aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
				aria-atomic="true"
				class="pointer-events-auto overflow-hidden rounded-[8px] border border-stone-200 bg-white shadow-[0_4px_14px_rgba(15,23,42,0.08),0_10px_28px_rgba(15,23,42,0.05)]"
			>
				{#if isCompact}
					<div class="flex items-center gap-4 px-6 py-7">
						<div
							class={[
								'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
								theme.iconWrap
							].join(' ')}
						>
							<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								{#if toast.tone === 'warning'}
									<path d={iconPathByTone.warning[2]} />
									<path d={iconPathByTone.warning[0]} />
									<path d={iconPathByTone.warning[1]} />
								{:else}
									<path d="M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18Z" />
									{#each iconPathByTone[toast.tone] as path}
										<path d={path} />
									{/each}
								{/if}
							</svg>
						</div>

						<h2 class="min-w-0 flex-1 text-[1.15rem] font-semibold leading-none tracking-[-0.02em] text-stone-950 sm:text-[1.2rem]">
							{toast.title}
						</h2>

						{#if toast.actions.length > 0}
							<div class="flex shrink-0 flex-wrap items-center justify-end gap-3">
								{#each toast.actions as action, index (action.id ?? `${toast.id}-action-${index}`)}
									<button
										type="button"
										class={[
											compactActionClass,
											action.variant === 'primary'
												? theme.primaryAction
												: `border-transparent ${theme.secondaryAction}`
										].join(' ')}
										onclick={async () => {
											await action.onClick?.();

											if (action.dismissOnClick ?? true) {
												toastState.remove(toast.id);
											}
										}}
									>
										{action.label}
									</button>
								{/each}
							</div>
						{/if}

						{#if toast.dismissible}
							<button
								type="button"
								class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-stone-300 transition hover:text-stone-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-200"
								aria-label="Dismiss notification"
								onclick={() => toastState.remove(toast.id)}
							>
								<svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
									<path d="M6 6l12 12M18 6L6 18" />
								</svg>
							</button>
						{/if}
					</div>
				{:else}
					<div class="px-6 pb-6 pt-5">
						<div class="flex items-start gap-4">
							<div
								class={[
									'mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
									theme.iconWrap
								].join(' ')}
							>
								<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									{#if toast.tone === 'warning'}
										<path d={iconPathByTone.warning[2]} />
										<path d={iconPathByTone.warning[0]} />
										<path d={iconPathByTone.warning[1]} />
									{:else}
										<path d="M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18Z" />
										{#each iconPathByTone[toast.tone] as path}
											<path d={path} />
										{/each}
									{/if}
								</svg>
							</div>

							<div class="min-w-0 flex-1">
								<div class="flex items-start justify-between gap-3">
									<h2 class="pr-3 text-[1.25rem] font-semibold leading-[1.2] tracking-[-0.02em] text-stone-950">
										{toast.title}
									</h2>

									{#if toast.dismissible}
										<button
											type="button"
											class="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-stone-300 transition hover:text-stone-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-200"
											aria-label="Dismiss notification"
											onclick={() => toastState.remove(toast.id)}
										>
											<svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
												<path d="M6 6l12 12M18 6L6 18" />
											</svg>
										</button>
									{/if}
								</div>

								<p class="mt-5 max-w-[42ch] text-[1rem] leading-[1.35] text-stone-800 sm:text-[1.05rem]">
									{toast.description}
								</p>

								{#if toast.actions.length > 0}
									<div class="mt-7 flex flex-wrap items-center justify-end gap-3">
										{#each toast.actions as action, index (action.id ?? `${toast.id}-action-${index}`)}
											<button
												type="button"
												class={[
													regularActionClass,
													action.variant === 'primary'
														? theme.primaryAction
														: `border-transparent ${theme.secondaryAction}`
												].join(' ')}
												onclick={async () => {
													await action.onClick?.();

													if (action.dismissOnClick ?? true) {
														toastState.remove(toast.id);
													}
												}}
											>
												{action.label}
											</button>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/if}

				{#if toast.durationMs !== null}
					<Progress
						value={getProgressValue(toast)}
						max={100}
						aria-hidden="true"
						class={[
							'h-2.5 w-full rounded-none border-0 shadow-none',
							theme.progressTrack,
							`[&_[data-slot=progress-indicator]]:rounded-none [&_[data-slot=progress-indicator]]:${theme.progressFill}`
						].join(' ')}
					/>
				{/if}
			</section>
		{/each}
	</div>
</div>
