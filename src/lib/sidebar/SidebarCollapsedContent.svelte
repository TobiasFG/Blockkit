<script lang="ts">
    import { goto } from "$app/navigation";
    import type { SubmitFunction } from "@sveltejs/kit";
    import type { Component } from "svelte";
    import { FileText, Folder, Home, Trash2 } from "$lib/icons";
    import type { User } from "@supabase/supabase-js";
    import SidebarUserFooter from "./SidebarUserFooter.svelte";
    import type { SidebarDesktopFocus } from "./Types";
    import Logo from "$lib/General/Logo.svelte";

    let {
        user,
        hasContent,
        logoutEnhanceSubmit,
        railItemIsActive,
        onDesktopRailSelect,
    }: {
        user: User;
        hasContent: boolean;
        logoutEnhanceSubmit?: SubmitFunction;
        railItemIsActive: (focus: SidebarDesktopFocus) => boolean;
        onDesktopRailSelect: (focus: SidebarDesktopFocus) => void;
    } = $props();

    const collapsedRailItems = $derived<
        {
            key: string;
            label: string;
            icon: Component;
            dotClass: string | null;
            focus: SidebarDesktopFocus;
        }[]
    >([
        {
            key: "dashboard",
            label: "Dashboard",
            icon: Home,
            dotClass: null,
            focus: { kind: "dashboard" },
        },
        {
            key: "pages",
            label: "Pages",
            icon: FileText,
            dotClass: "bg-blue-500",
            focus: { kind: "pages" },
        },
        {
            key: "content-root",
            label: "Content",
            icon: Folder,
            dotClass: hasContent ? "bg-emerald-500" : null,
            focus: { kind: "content" },
        },
        {
            key: "trash",
            label: "Trash",
            icon: Trash2,
            dotClass: null,
            focus: { kind: "trash" },
        },
    ]);

    const handleRailClick = (focus: SidebarDesktopFocus) => {
        if (focus.kind === "dashboard") {
            void goto("/");
            return;
        }

        if (focus.kind === "trash") {
            void goto("/trash");
            return;
        }

        onDesktopRailSelect(focus);
    };
</script>

<div class="flex h-full flex-col bg-background">
    <div
        class="sticky top-0 z-10 border-b border-border bg-background/95 py-4 backdrop-blur"
    >
        <div class="flex justify-center">
            <Logo></Logo>
        </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto py-5">
        <div class="space-y-4">
            {#each collapsedRailItems as item (item.key)}
                <button
                    type="button"
                    class={[
                        "relative flex h-11 w-full items-center justify-center rounded-md text-muted-foreground transition",
                        railItemIsActive(item.focus)
                            ? "bg-muted text-foreground"
                            : "hover:bg-muted/70 hover:text-foreground",
                    ].join(" ")}
                    title={item.label}
                    aria-label={item.label}
                    onclick={() => handleRailClick(item.focus)}
                >
                    <item.icon class="h-5 w-5" />
                    {#if item.dotClass}
                        <span
                            class={`absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${item.dotClass}`}
                        ></span>
                    {/if}
                </button>
            {/each}
        </div>
    </div>

    <SidebarUserFooter {user} variant="collapsed" {logoutEnhanceSubmit} />
</div>
