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
    import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import * as UiSidebar from "$lib/components/ui/sidebar/index.js";
    import ThemeToggle from "$lib/Theme/ThemeToggle.svelte";
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

        <UiSidebar.Provider
            open={!desktopSidebarCollapsed}
            onOpenChange={(open) => (desktopSidebarCollapsed = !open)}
        >
            {#if !exiting}
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
            {/if}

            {#if !exiting}
                <UiSidebar.Inset>
                    <div
                        out:contentOutro={{
                            reducedMotion: prefersReducedMotion,
                        }}
                        onoutroend={handleContentOutroEnd}
                        class={[
                            "min-h-screen transition-[opacity] ease-[cubic-bezier(0.22,1,0.36,1)]",
                            prefersReducedMotion
                                ? "duration-100 delay-0"
                                : "duration-[360ms] delay-[80ms]",
                            entered ? "opacity-100" : "opacity-0",
                        ].join(" ")}
                    >
                        <header
                            class="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 bg-background/90 px-4 backdrop-blur"
                        >
                            <UiSidebar.Trigger
                                class="-ms-1"
                                aria-label={desktopSidebarCollapsed
                                    ? "Expand sidebar"
                                    : "Collapse sidebar"}
                                aria-expanded={mobileOpen}
                                title={desktopSidebarCollapsed
                                    ? "Expand sidebar"
                                    : "Collapse sidebar"}
                            />
                            <Separator
                                orientation="vertical"
                                class="data-[orientation=vertical]:h-4"
                            />
                            <ThemeToggle />
                            <Separator
                                orientation="vertical"
                                class="me-2 data-[orientation=vertical]:h-4"
                            />
                            <Breadcrumb.Root>
                                <Breadcrumb.List>
                                    <Breadcrumb.Item class="hidden md:block">
                                        <Breadcrumb.Link href="/">
                                            Build Your Application
                                        </Breadcrumb.Link>
                                    </Breadcrumb.Item>
                                    <Breadcrumb.Separator
                                        class="hidden md:block"
                                    />
                                    <Breadcrumb.Item>
                                        <Breadcrumb.Page>
                                            {#if $page.url.pathname.startsWith("/content")}
                                                Content
                                            {:else if $page.url.pathname.startsWith("/edit/")}
                                                Page editor
                                            {:else if $page.url.pathname === "/trash"}
                                                Trash
                                            {:else}
                                                Dashboard
                                            {/if}
                                        </Breadcrumb.Page>
                                    </Breadcrumb.Item>
                                </Breadcrumb.List>
                            </Breadcrumb.Root>
                        </header>

                        <div class="p-4 lg:p-8">
                            {@render children()}
                        </div>
                    </div>
                </UiSidebar.Inset>
            {/if}
        </UiSidebar.Provider>
    </div>
</ToastProvider>
