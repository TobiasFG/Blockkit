<script lang="ts">
    import { enhance } from "$app/forms";
    import { goto } from "$app/navigation";
    import type { SubmitFunction } from "@sveltejs/kit";
    import type { User } from "@supabase/supabase-js";
    import type { SidebarDesktopFocus } from "./types";
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { ChevronDown, EllipsisVertical, LogOut, Plus } from "$lib/icons";
    import { Settings2 } from "@lucide/svelte";

    let {
        user,
        variant = "expanded",
        logoutEnhanceSubmit,
        onDesktopRailSelect,
    }: {
        user: User;
        variant?: "expanded" | "collapsed";
        logoutEnhanceSubmit?: SubmitFunction;
        onDesktopRailSelect?: (focus: SidebarDesktopFocus) => void;
    } = $props();

    const displayName = $derived(
        user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Editor",
    );
    const initials = $derived(displayName.slice(0, 2).toUpperCase());
</script>

<div class="border-t py-2 px-4 flex">
    {#if variant === "collapsed"}
        <Avatar.Root>
            <Avatar.Image src="" alt="@shadcn" />
            <Avatar.Fallback>{initials}</Avatar.Fallback>
        </Avatar.Root>
        <ButtonGroup.Root>
            <Button variant="ghost" size="icon" aria-label="Submit">
                <Settings2 />
            </Button>
            <form
                method="POST"
                action="/auth?/signOut"
                use:enhance={logoutEnhanceSubmit}
            >
                <Button type="submit" variant="ghost">
                    <LogOut />
                </Button>
            </form>
        </ButtonGroup.Root>
    {:else}
        <Avatar.Root>
            <Avatar.Image src="" alt="@shadcn" />
            <Avatar.Fallback>{initials}</Avatar.Fallback>
        </Avatar.Root>
        <div class="flex flex-col">
            <p>{displayName}</p>
            <p>{user.email}</p>
        </div>
        <ButtonGroup.Root>
            <Button variant="ghost" size="icon" aria-label="Submit">
                <Settings2 />
            </Button>
            <form
                method="POST"
                action="/auth?/signOut"
                use:enhance={logoutEnhanceSubmit}
            >
                <Button type="submit" variant="ghost">
                    <LogOut />
                    Logout
                </Button>
            </form>
        </ButtonGroup.Root>
    {/if}
</div>
