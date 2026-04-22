<script lang="ts">
    import type { Snippet } from "svelte";
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";

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

<AlertDialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
    <AlertDialog.Content aria-label={labelledBy ? undefined : title} aria-labelledby={labelledBy}>
        <AlertDialog.Header>
            <AlertDialog.Title id={labelledBy}>{title}</AlertDialog.Title>
            {#if description}
                <AlertDialog.Description>{description}</AlertDialog.Description>
            {/if}
        </AlertDialog.Header>
        <div class="space-y-3">
            {@render children?.()}
        </div>
    </AlertDialog.Content>
</AlertDialog.Root>
