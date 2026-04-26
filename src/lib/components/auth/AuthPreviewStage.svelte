<script lang="ts">
    import { fade } from "svelte/transition";

    type Props = {
        reducedMotion?: boolean;
        onOutroEnd?: () => void;
    };

    const stageOutro = (
        node: Element,
        { reducedMotion }: { reducedMotion: boolean },
    ) => {
        const bounds = node.getBoundingClientRect();
        const distance = reducedMotion
            ? 10
            : window.innerWidth - bounds.left + 48;

        return {
            duration: reducedMotion ? 110 : 620,
            easing: (t: number) => 1 - (1 - t) ** 5,
            css: (t: number, u: number) =>
                `transform: translate3d(${distance * u}px, 0, 0); opacity: ${0.3 + t * 0.7};`,
        };
    };

    let { reducedMotion = false, onOutroEnd }: Props = $props();
</script>

<section
    out:stageOutro={{ reducedMotion }}
    onoutroend={onOutroEnd}
    class="relative min-h-screen overflow-hidden lg:pl-[27rem]"
>
    <div
        class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_34%),linear-gradient(140deg,rgba(17,24,39,0.98)_0%,rgba(36,64,52,0.95)_52%,rgba(90,63,40,0.88)_100%)]"
    ></div>
    <div class="absolute inset-0 opacity-70">
        <div
            class="absolute left-[14%] top-[12%] h-36 w-36 rounded-[2rem] border border-white/20 bg-white/10"
        ></div>
        <div
            class="absolute left-[28%] top-[32%] h-52 w-52 rounded-[2.5rem] border border-white/10 bg-emerald-100/10"
        ></div>
        <div
            class="absolute right-[18%] top-[18%] h-44 w-44 rounded-[2rem] border border-white/10 bg-amber-100/10"
        ></div>
        <div
            class="absolute right-[12%] bottom-[14%] h-72 w-72 rounded-[3rem] border border-white/10 bg-sky-100/10"
        ></div>
    </div>

    <div
        class="relative z-10 flex min-h-screen w-full flex-col justify-between p-8 text-white sm:p-10 lg:p-12"
    >
        <div class="max-w-xl space-y-5">
            <p
                class="text-xs font-semibold uppercase tracking-[0.35em] text-white/60"
            >
                Workspace preview
            </p>
        </div>
    </div>
</section>
