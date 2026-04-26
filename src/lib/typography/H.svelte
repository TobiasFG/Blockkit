<script lang="ts">
    import type { HTMLAttributes } from "svelte/elements";
    import { cn, type WithElementRef } from "$lib/utils.js";
    import {
        headingSizeClasses,
        type TypographySize,
    } from "./SizeClasses";

    const sizeTags: Record<TypographySize, "h1" | "h2" | "h3"> = {
        small: "h3",
        medium: "h2",
        large: "h1",
    };

    let {
        ref = $bindable(null),
        size = "medium",
        muted = false,
        class: className,
        children,
        ...restProps
    }: WithElementRef<
        HTMLAttributes<HTMLHeadingElement>,
        HTMLHeadingElement
    > & {
        size?: TypographySize;
        muted?: boolean;
    } = $props();

    const tag = $derived(sizeTags[size]);
</script>

<svelte:element
    this={tag}
    bind:this={ref}
    class={cn(
        "scroll-m-20 font-semibold tracking-tight text-foreground",
        headingSizeClasses[size],
        muted && "text-muted-foreground",
        className,
    )}
    {...restProps}
>
    {@render children?.()}
</svelte:element>
