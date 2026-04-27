<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";

    type Props = {
        eyebrow?: string;
        title: string;
        description: string;
        actionHref?: string;
        actionLabel?: string;
    };

    let {
        eyebrow,
        title,
        description,
        actionHref,
        actionLabel,
    }: Props = $props();
</script>

<div
    class="rounded-[1.5rem] border border-dashed border-border bg-muted/35 px-6 py-10 text-center"
>
    {#if eyebrow}
        <p
            class="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground"
        >
            {eyebrow}
        </p>
    {/if}
    <h3 class="mt-2 text-xl font-semibold tracking-tight text-foreground">
        {title}
    </h3>
    <p class="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        {description}
    </p>
    {#if actionHref && actionLabel}
        <Button href={actionHref} class="mt-5 rounded-full">
            {actionLabel}
        </Button>
    {/if}
</div>
