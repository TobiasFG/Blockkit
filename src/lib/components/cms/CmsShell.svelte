<script lang="ts">
    import { applyAction } from "$app/forms";
    import { page } from "$app/stores";
    import type {
        BlockFolder,
        Page,
        ReferencingPage,
        ReusableBlock,
    } from "$lib/types";
    import { goto } from "$app/navigation";
    import type { SubmitFunction } from "@sveltejs/kit";
    import type { User } from "@supabase/supabase-js";
    import { onMount } from "svelte";
    import type { Snippet } from "svelte";
    import ToastProvider from "$lib/Toasts/ToastProvider.svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import ThemeToggle from "$lib/components/ThemeToggle.svelte";
    import { PanelLeft, PanelRight } from "$lib/icons";
    import Sidebar from "$lib/Sidebar/Sidebar.svelte";

    let {
        pages,
        blockFolders,
        reusableBlocks,
        reusableBlockPageReferences,
        user,
        children,
    } = $props<{
        pages: Page[];
        blockFolders: BlockFolder[];
        reusableBlocks: ReusableBlock[];
        reusableBlockPageReferences: Record<string, ReferencingPage[]>;
        user: User;
        children: Snippet;
    }>();
    type SidebarDesktopFocus =
        | { kind: "dashboard" }
        | { kind: "pages" }
        | { kind: "content" }
        | { kind: "content-folder"; id: string }
        | { kind: "content-block"; id: string }
        | { kind: "trash" };

    let mobileOpen = $state(false);
    let desktopSidebarCollapsed = $state(false);
    let desktopSidebarFocus = $state<SidebarDesktopFocus>({
        kind: "dashboard",
    });
    let entered = $state(false);
    let exiting = $state(false);
    let prefersReducedMotion = $state(false);
    let pendingNavigation = $state<string | null>(null);
    let lastPathname = $state("");

    const closeMobile = () => {
        mobileOpen = false;
    };

    const inferSidebarFocus = (pathname: string): SidebarDesktopFocus => {
        if (pathname.startsWith("/content")) return { kind: "content" };
        if (pathname.startsWith("/edit/")) return { kind: "pages" };
        if (pathname === "/trash") return { kind: "trash" };
        return { kind: "dashboard" };
    };

    const handleDesktopRailSelect = (focus: SidebarDesktopFocus) => {
        desktopSidebarFocus = focus;
        desktopSidebarCollapsed = false;
    };

    onMount(() => {
        const mediaQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        );
        const updateReducedMotion = () => {
            prefersReducedMotion = mediaQuery.matches;
        };

        updateReducedMotion();
        mediaQuery.addEventListener("change", updateReducedMotion);

        if (mediaQuery.matches) {
            entered = true;
        } else {
            const frame = window.requestAnimationFrame(() => {
                entered = true;
            });

            return () => {
                window.cancelAnimationFrame(frame);
                mediaQuery.removeEventListener("change", updateReducedMotion);
            };
        }

        return () => {
            mediaQuery.removeEventListener("change", updateReducedMotion);
        };
    });

    const easeOutQuint = (t: number) => 1 - (1 - t) ** 5;

    const sidebarOutro = (
        node: Element,
        { reducedMotion }: { reducedMotion: boolean },
    ) => {
        const bounds = node.getBoundingClientRect();
        const distance = reducedMotion ? 8 : bounds.right + 40;

        return {
            duration: reducedMotion ? 110 : 520,
            easing: easeOutQuint,
            css: (t: number, u: number) =>
                `transform: translate3d(${-distance * u}px, 0, 0); opacity: ${reducedMotion ? 0.96 - u * 0.08 : 1 - u * 0.76};`,
        };
    };

    const contentOutro = (
        node: Element,
        { reducedMotion }: { reducedMotion: boolean },
    ) => {
        const bounds = node.getBoundingClientRect();
        const distance = reducedMotion
            ? 10
            : window.innerWidth - bounds.left + 48;

        return {
            duration: reducedMotion ? 110 : 580,
            easing: easeOutQuint,
            css: (t: number, u: number) =>
                `transform: translate3d(${distance * u}px, 0, 0); opacity: ${reducedMotion ? 0.96 - u * 0.08 : 1 - u * 0.7};`,
        };
    };

    const logoutSubmit: SubmitFunction = () => {
        return async ({ result }) => {
            await applyAction(result);

            if (result.type === "failure") {
                return;
            }

            if (result.type === "success") {
                pendingNavigation = "/auth";
                exiting = true;
            }
        };
    };

    const handleContentOutroEnd = () => {
        if (!pendingNavigation) return;
        void goto(pendingNavigation, { invalidateAll: true });
    };

    $effect(() => {
        const pathname = $page.url.pathname;
        if (pathname === lastPathname) return;
        lastPathname = pathname;
        desktopSidebarFocus = inferSidebarFocus(pathname);
    });
</script>

<ToastProvider>
    <div class="relative min-h-screen bg-background">
        <div
            aria-hidden="true"
            class={[
                "pointer-events-none absolute inset-0 z-40 bg-background transition-opacity ease-[cubic-bezier(0.22,1,0.36,1)]",
                prefersReducedMotion ? "duration-100" : "duration-[440ms]",
                entered && !exiting ? "opacity-0" : "opacity-100",
            ].join(" ")}
        ></div>

        {#if !exiting}
            <div
                out:sidebarOutro={{ reducedMotion: prefersReducedMotion }}
                class={[
                    "transition-opacity ease-[cubic-bezier(0.22,1,0.36,1)]",
                    prefersReducedMotion ? "duration-100" : "duration-[320ms]",
                    entered ? "opacity-100" : "opacity-0",
                ].join(" ")}
            >
                <Sidebar
                    {pages}
                    {blockFolders}
                    {reusableBlocks}
                    {reusableBlockPageReferences}
                    {user}
                    desktopCollapsed={desktopSidebarCollapsed}
                    desktopFocus={desktopSidebarFocus}
                    {mobileOpen}
                    onClose={closeMobile}
                    onDesktopRailSelect={handleDesktopRailSelect}
                    logoutEnhanceSubmit={logoutSubmit}
                />
            </div>
        {/if}

        {#if !exiting}
            <div
                out:contentOutro={{ reducedMotion: prefersReducedMotion }}
                onoutroend={handleContentOutroEnd}
                class={[
                    desktopSidebarCollapsed ? "lg:pl-24" : "lg:pl-[33rem]",
                    "transition-[padding,opacity] ease-[cubic-bezier(0.22,1,0.36,1)]",
                    prefersReducedMotion
                        ? "duration-100 delay-0"
                        : "duration-[360ms] delay-[80ms]",
                    entered ? "opacity-100" : "opacity-0",
                ].join(" ")}
            >
                <button
                    type="button"
                    class={[
                        "hidden lg:inline-flex fixed top-24 z-40 size-10 items-center justify-center rounded-lg border border-border bg-background/95 text-muted-foreground shadow-sm backdrop-blur transition hover:border-border/90 hover:text-foreground",
                        desktopSidebarCollapsed
                            ? "left-[6.5rem]"
                            : "left-[33.75rem]",
                    ].join(" ")}
                    aria-label={desktopSidebarCollapsed
                        ? "Expand sidebar"
                        : "Collapse sidebar"}
                    title={desktopSidebarCollapsed
                        ? "Expand sidebar"
                        : "Collapse sidebar"}
                    onclick={() =>
                        (desktopSidebarCollapsed = !desktopSidebarCollapsed)}
                >
                    {#if desktopSidebarCollapsed}
                        <PanelRight class="h-4 w-4" />
                    {:else}
                        <PanelLeft class="h-4 w-4" />
                    {/if}
                </button>

                <header
                    class="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/70 bg-background/90 px-4 backdrop-blur lg:hidden"
                >
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Open sidebar"
                        aria-expanded={mobileOpen}
                        onclick={() => (mobileOpen = true)}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            class="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <path d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </Button>
                    <div class="text-sm font-semibold text-foreground">
                        Blockkit CMS
                    </div>
                    <div class="ml-auto">
                        <ThemeToggle />
                    </div>
                </header>

                <div class="p-4 lg:p-8 lg:pl-10">
                    {@render children()}
                </div>
            </div>
        {/if}
    </div>
</ToastProvider>
