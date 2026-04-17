<script lang="ts">
	import { fade } from 'svelte/transition';

	type Props = {
		reducedMotion?: boolean;
		onOutroEnd?: () => void;
	};

	const stageOutro = (
		node: Element,
		{ reducedMotion }: { reducedMotion: boolean }
	) => {
		const bounds = node.getBoundingClientRect();
		const distance = reducedMotion ? 10 : window.innerWidth - bounds.left + 48;

		return {
			duration: reducedMotion ? 110 : 620,
			easing: (t: number) => 1 - (1 - t) ** 5,
			css: (t: number, u: number) =>
				`transform: translate3d(${distance * u}px, 0, 0); opacity: ${0.3 + t * 0.7};`
		};
	};

	let { reducedMotion = false, onOutroEnd }: Props = $props();
</script>

<section
	out:stageOutro={{ reducedMotion }}
	onoutroend={onOutroEnd}
	class="relative min-h-screen overflow-hidden lg:pl-[27rem]"
>
	<div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_34%),linear-gradient(140deg,rgba(17,24,39,0.98)_0%,rgba(36,64,52,0.95)_52%,rgba(90,63,40,0.88)_100%)]"></div>
	<div class="absolute inset-0 opacity-70">
		<div class="absolute left-[14%] top-[12%] h-36 w-36 rounded-[2rem] border border-white/20 bg-white/10"></div>
		<div class="absolute left-[28%] top-[32%] h-52 w-52 rounded-[2.5rem] border border-white/10 bg-emerald-100/10"></div>
		<div class="absolute right-[18%] top-[18%] h-44 w-44 rounded-[2rem] border border-white/10 bg-amber-100/10"></div>
		<div class="absolute right-[12%] bottom-[14%] h-72 w-72 rounded-[3rem] border border-white/10 bg-sky-100/10"></div>
	</div>

	<div class="relative z-10 flex min-h-screen w-full flex-col justify-between p-8 text-white sm:p-10 lg:p-12">
		<div class="max-w-xl space-y-5">
			<p class="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Workspace preview</p>
			<h3 class="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
				Auth rail slides clear. Editor shell waits beneath.
			</h3>
			<p class="max-w-lg text-base leading-7 text-white/72">
				Block-driven pages on left. Shared content in library. Draft work centered, not buried.
			</p>
		</div>

		<div
			in:fade={{ duration: reducedMotion ? 0 : 240 }}
			class="ml-auto grid w-full max-w-3xl grid-cols-[16rem_minmax(0,1fr)] gap-4 rounded-[2rem] border border-white/10 bg-white/8 p-4 shadow-[0_40px_120px_-48px_rgba(15,23,42,0.9)]"
		>
			<div class="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
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

			<div class="rounded-[1.5rem] border border-white/10 bg-white/92 p-5 text-slate-900">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Editor</div>
						<div class="mt-1 text-2xl font-semibold tracking-tight">Pages first</div>
					</div>
					<div class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
						Ready
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
