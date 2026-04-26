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
    }: WithElementRef<
        HTMLAttributes<HTMLParagraphElement>,
        HTMLParagraphElement
    > & {
        size?: TypographySize;
        muted?: boolean;
    } = $props();
</script>

<p
    bind:this={ref}
    class={cn(
        textSizeClasses[size],
        muted && "text-muted-foreground",
        className,
    )}
    {...restProps}
>
    {@render children?.()}
</p>
