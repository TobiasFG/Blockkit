<script lang="ts">
    import type { HTMLBlockquoteAttributes } from "svelte/elements";
    import { cn, type WithElementRef } from "$lib/utils.js";
    import { textSizeClasses, type TypographySize } from "./SizeClasses";

    let {
        ref = $bindable(null),
        size = "medium",
        muted = false,
        class: className,
        children,
        ...restProps
    }: WithElementRef<HTMLBlockquoteAttributes, HTMLQuoteElement> & {
        size?: TypographySize;
        muted?: boolean;
    } = $props();
</script>

<blockquote
    bind:this={ref}
    class={cn(
        "mt-6 border-s-2 border-s-primary ps-6 italic",
        textSizeClasses[size],
        muted && "text-muted-foreground",
        className,
    )}
    {...restProps}
>
    {@render children?.()}
</blockquote>
