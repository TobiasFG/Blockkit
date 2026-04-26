<script lang="ts">
    import type { HTMLAttributes } from "svelte/elements";
    import { cn, type WithElementRef } from "$lib/utils.js";
    import { textSizeClasses, type TypographySize } from "./SizeClasses";

    type ListStyle = "ordered" | "unordered" | "none";

    type ListProps = WithElementRef<
        HTMLAttributes<HTMLUListElement | HTMLOListElement>
    > & {
        size?: TypographySize;
        muted?: boolean;
        style?: ListStyle;
    };

    let {
        ref = $bindable(null),
        size = "medium",
        muted = false,
        style = "unordered",
        class: className,
        children,
        ...restProps
    }: ListProps = $props();

    const tag = $derived(style === "ordered" ? "ol" : "ul");
    const listClass = $derived(
        style === "ordered"
            ? "list-decimal"
            : style === "none"
              ? "list-none"
              : "list-disc",
    );
</script>

<svelte:element
    this={tag}
    bind:this={ref}
    style={undefined}
    class={cn(
        "my-6 ms-6 [&>li]:mt-2",
        listClass,
        textSizeClasses[size],
        muted && "text-muted-foreground",
        className,
    )}
    {...restProps}
>
    {@render children?.()}
</svelte:element>
