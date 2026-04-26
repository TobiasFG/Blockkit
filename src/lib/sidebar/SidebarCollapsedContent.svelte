<script lang="ts">
    import { goto } from "$app/navigation";
    import type { SubmitFunction } from "@sveltejs/kit";
    import type { User } from "@supabase/supabase-js";
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import CommandIcon from "@lucide/svelte/icons/command";
    import {
        FileText,
        Folder,
        Home,
        Search,
        Trash2,
    } from "$lib/icons";
    import type { SidebarDesktopFocus } from "./Types";

    let {
        user,
        hasContent,
        railItemIsActive,
        onDesktopRailSelect,
    }: {
        user: User;
        hasContent: boolean;
        logoutEnhanceSubmit?: SubmitFunction;
        railItemIsActive: (focus: SidebarDesktopFocus) => boolean;
        onDesktopRailSelect: (focus: SidebarDesktopFocus) => void;
    } = $props();

    const displayName = $derived(
        user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Editor",
    );
    const initials = $derived(displayName.slice(0, 2).toUpperCase());
    const collapsedItems = $derived([
        {
            key: "dashboard",
            label: "Dashboard",
            icon: Home,
            focus: { kind: "dashboard" } satisfies SidebarDesktopFocus,
            dotClass: null,
        },
        {
            key: "pages",
            label: "Pages",
            icon: FileText,
            focus: { kind: "pages" } satisfies SidebarDesktopFocus,
            dotClass: "bg-blue-500",
        },
        {
            key: "content",
            label: "Content",
            icon: Folder,
            focus: { kind: "content" } satisfies SidebarDesktopFocus,
            dotClass: hasContent ? "bg-emerald-500" : null,
        },
        {
            key: "search",
            label: "Search",
            icon: Search,
            focus: { kind: "pages" } satisfies SidebarDesktopFocus,
            dotClass: null,
        },
        {
            key: "trash",
            label: "Trash",
            icon: Trash2,
            focus: { kind: "trash" } satisfies SidebarDesktopFocus,
            dotClass: null,
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

<Sidebar.Header>
    <Sidebar.Menu>
        <Sidebar.MenuItem>
            <Sidebar.MenuButton size="lg" tooltipContent="Blockkit CMS">
                <CommandIcon class="size-4" />
            </Sidebar.MenuButton>
        </Sidebar.MenuItem>
    </Sidebar.Menu>
</Sidebar.Header>

<Sidebar.Content>
    <Sidebar.Group>
        <Sidebar.Menu>
            {#each collapsedItems as item (item.key)}
                <Sidebar.MenuItem>
                    <Sidebar.MenuButton
                        tooltipContent={item.label}
                        isActive={railItemIsActive(item.focus)}
                        onclick={() => handleRailClick(item.focus)}
                    >
                        <item.icon class="size-4" />
                        {#if item.dotClass}
                            <span
                                class={`absolute right-2 top-1/2 size-2 -translate-y-1/2 rounded-full ${item.dotClass}`}
                            ></span>
                        {/if}
                    </Sidebar.MenuButton>
                </Sidebar.MenuItem>
            {/each}
        </Sidebar.Menu>
    </Sidebar.Group>
</Sidebar.Content>

<Sidebar.Footer>
    <Sidebar.Menu>
        <Sidebar.MenuItem>
            <Sidebar.MenuButton size="lg" tooltipContent={displayName}>
                <Avatar.Root class="size-8 rounded-lg">
                    <Avatar.Image src="" alt="" />
                    <Avatar.Fallback class="rounded-lg">{initials}</Avatar.Fallback>
                </Avatar.Root>
            </Sidebar.MenuButton>
        </Sidebar.MenuItem>
    </Sidebar.Menu>
</Sidebar.Footer>
