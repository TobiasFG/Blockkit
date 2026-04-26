<script lang="ts">
    import type { Snippet } from "svelte";
    import { setToastState } from "./ToastState.svelte";
    import ToastViewport from "./ToastViewport.svelte";

    let { children }: { children: Snippet } = $props();

    const toastState = setToastState();
</script>

{@render children()}
<ToastViewport state={toastState} />
