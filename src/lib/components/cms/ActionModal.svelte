<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        open,
        title,
        description = null,
        onClose,
        labelledBy,
        children,
    }: {
        open: boolean;
        title: string;
        description?: string | null;
        onClose: () => void;
        labelledBy?: string;
        children?: Snippet;
    } = $props();
</script>

{#if open}
    <div class="fixed inset-0 z-40 bg-black/30" aria-hidden="true" onclick={onClose}></div>
    <div
        class="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : title}
        aria-labelledby={labelledBy}
    >
        <div class="space-y-3">
            <div class="space-y-2">
                <h2 id={labelledBy} class="text-lg font-semibold text-slate-900">{title}</h2>
                {#if description}
                    <p class="text-sm text-slate-600">{description}</p>
                {/if}
            </div>
            {@render children?.()}
        </div>
    </div>
{/if}
