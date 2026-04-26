<script lang="ts">
    import type { HTMLAttributes } from "svelte/elements";
    import { cn, type WithElementRef } from "$lib/utils.js";
    import { textSizeClasses, type TypographySize } from "./SizeClasses";

    let {
        ref = $bindable(null),
        size = "medium",
        muted = false,
        class: className,
        children,
        ...restProps
    }: WithElementRef<HTMLAttributes<HTMLElement>, HTMLElement> & {
        size?: TypographySize;
        muted?: boolean;
    } = $props();
</script>

<span
    bind:this={ref}
    class={cn(
        "bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono font-semibold",
        textSizeClasses[size],
        muted && "text-muted-foreground",
        className,
    )}
    {...restProps}
>
    {@render children?.()}
</span>
