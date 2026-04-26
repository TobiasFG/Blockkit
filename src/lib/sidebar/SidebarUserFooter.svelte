<script lang="ts">
    import { enhance } from "$app/forms";
    import type { SubmitFunction } from "@sveltejs/kit";
    import type { User } from "@supabase/supabase-js";
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { LogOut, Settings } from "$lib/icons";
    import P from "$lib/Typography/P.svelte";

    let {
        user,
        variant = "expanded",
        logoutEnhanceSubmit,
    }: {
        user: User;
        variant?: "expanded" | "collapsed";
        logoutEnhanceSubmit?: SubmitFunction;
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
        <div class="flex flex-col justify-center items-center gap-1">
            <Avatar.Root>
                <Avatar.Image src="" alt="@shadcn" />
                <Avatar.Fallback>{initials}</Avatar.Fallback>
            </Avatar.Root>
            <Button variant="ghost" size="icon" aria-label="Submit">
                <Settings />
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
        </div>
    {:else}
        <div class="flex justify-between w-full">
            <div class="flex gap-2">
                <Avatar.Root>
                    <Avatar.Image src="" alt="@shadcn" />
                    <Avatar.Fallback>{initials}</Avatar.Fallback>
                </Avatar.Root>
                <div class="flex flex-col justify-center">
                    <P size="small">{displayName}</P>
                    <P size="small">{user.email}</P>
                </div>
            </div>
            <ButtonGroup.Root>
                <Button variant="ghost" size="icon" aria-label="Submit">
                    <Settings />
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
        </div>
    {/if}
</div>
