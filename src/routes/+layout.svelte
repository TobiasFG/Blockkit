<script lang="ts">
    import "../app.css";
    import { browser } from "$app/environment";
    import CmsShell from "$lib/components/cms/CmsShell.svelte";
    import { pagesStore } from "$lib/client/pagesStore";
    import { blockFoldersStore, reusableBlocksStore } from "$lib/client/reusableBlocksStore";
    import type { LayoutProps } from "./$types";

    let { data, children }: LayoutProps = $props();

    $effect(() => {
        if (browser && !data.isAuthRoute) {
            pagesStore.set(data.pages ?? []);
            blockFoldersStore.set(data.blockFolders ?? []);
            reusableBlocksStore.set(data.reusableBlocks ?? []);
        }
    });
</script>

{#if data.isAuthRoute}
    {@render children()}
{:else}
    <CmsShell
        pages={data.pages ?? []}
        blockFolders={data.blockFolders ?? []}
        reusableBlocks={data.reusableBlocks ?? []}
        reusableBlockPageReferences={data.reusableBlockPageReferences ?? {}}
        user={data.user!}
    >
        {@render children()}
    </CmsShell>
{/if}
