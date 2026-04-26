<script lang="ts">
    import type { Snippet } from "svelte";
    import * as Avatar from "$lib/components/ui/avatar/index.ts";
    import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.ts";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.ts";
    import * as Sidebar from "$lib/components/ui/sidebar/index.ts";
    import { Separator } from "$lib/components/ui/separator/index.ts";

    import CommandIcon from "@lucide/svelte/icons/command";
    import {
        BadgeCheckIcon,
        BellIcon,
        ChevronsUpDownIcon,
        CreditCardIcon,
        LogOutIcon,
        SparklesIcon,
    } from "@lucide/svelte";
    import ThemeToggle from "$lib/Theme/ThemeToggle.svelte";
    import DevSidebarPageItem, {
        type DevSidebarPage,
    } from "./DevSidebarPageItem.svelte";

    let { children }: { children: Snippet } = $props();

    const pages: DevSidebarPage[] = [
        {
            title: "Home",
            url: "#",
            isActive: true,
            items: [
                { title: "Edit page", url: "#" },
                { title: "Duplicate", url: "#" },
                { title: "Archive", url: "#" },
            ],
            children: [
                {
                    title: "About",
                    url: "#",
                    items: [
                        { title: "Edit page", url: "#" },
                        { title: "Duplicate", url: "#" },
                        { title: "Archive", url: "#" },
                    ],
                    children: [
                        {
                            title: "Team",
                            url: "#",
                            items: [
                                { title: "Edit page", url: "#" },
                                { title: "Duplicate", url: "#" },
                                { title: "Archive", url: "#" },
                            ],
                            children: [
                                {
                                    title: "Leadership",
                                    url: "#",
                                    items: [
                                        { title: "Edit page", url: "#" },
                                        { title: "Duplicate", url: "#" },
                                        { title: "Archive", url: "#" },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    title: "About",
                    url: "#",
                    items: [
                        { title: "Edit page", url: "#" },
                        { title: "Duplicate", url: "#" },
                        { title: "Archive", url: "#" },
                    ],
                    children: [
                        {
                            title: "Team",
                            url: "#",
                            items: [
                                { title: "Edit page", url: "#" },
                                { title: "Duplicate", url: "#" },
                                { title: "Archive", url: "#" },
                            ],
                            children: [
                                {
                                    title: "Leadership",
                                    url: "#",
                                    items: [
                                        { title: "Edit page", url: "#" },
                                        { title: "Duplicate", url: "#" },
                                        { title: "Archive", url: "#" },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ];
</script>

<Sidebar.Provider>
    <Sidebar.Root variant="inset" collapsible="icon">
        <Sidebar.Header>
            <Sidebar.Menu>
                <Sidebar.MenuItem>
                    <Sidebar.MenuButton size="lg">
                        {#snippet child({ props })}
                            <a href="##" {...props}>
                                <div
                                    class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
                                >
                                    <CommandIcon class="size-4" />
                                </div>
                                <div
                                    class="grid flex-1 text-start text-sm leading-tight"
                                >
                                    <span class="truncate font-medium"
                                        >Acme Inc</span
                                    >
                                    <span class="truncate text-xs"
                                        >Enterprise</span
                                    >
                                </div>
                            </a>
                        {/snippet}
                    </Sidebar.MenuButton>
                </Sidebar.MenuItem>
            </Sidebar.Menu>
        </Sidebar.Header>

        <Sidebar.Content>
            <Sidebar.Group>
                <Sidebar.GroupLabel>Pages</Sidebar.GroupLabel>
                <Sidebar.Menu>
                    {#each pages as page (page.title)}
                        <DevSidebarPageItem {page} />
                    {/each}
                </Sidebar.Menu>
            </Sidebar.Group>
        </Sidebar.Content>

        <Sidebar.Footer>
            <Sidebar.Menu>
                <Sidebar.MenuItem>
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                            {#snippet child({ props })}
                                <Sidebar.MenuButton
                                    {...props}
                                    size="lg"
                                    class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar.Root class="size-8 rounded-lg">
                                        <Avatar.Image src="" alt="" />
                                        <Avatar.Fallback class="rounded-lg"
                                            >CN</Avatar.Fallback
                                        >
                                    </Avatar.Root>
                                    <div
                                        class="grid flex-1 text-start text-sm leading-tight"
                                    >
                                        <span class="truncate font-medium"
                                            >Test</span
                                        >
                                        <span class="truncate text-xs"
                                            >Test@test.dk</span
                                        >
                                    </div>
                                    <ChevronsUpDownIcon
                                        class="ms-auto size-4"
                                    />
                                </Sidebar.MenuButton>
                            {/snippet}
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content
                            class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
                            side="right"
                            align="end"
                            sideOffset={4}
                        >
                            <DropdownMenu.Label class="p-0 font-normal">
                                <div
                                    class="flex items-center gap-2 px-1 py-1.5 text-start text-sm"
                                >
                                    <Avatar.Root class="size-8 rounded-lg">
                                        <Avatar.Image src="" alt="" />
                                        <Avatar.Fallback class="rounded-lg"
                                            >CN</Avatar.Fallback
                                        >
                                    </Avatar.Root>
                                    <div
                                        class="grid flex-1 text-start text-sm leading-tight"
                                    >
                                        <span class="truncate font-medium"
                                            >Test</span
                                        >
                                        <span class="truncate text-xs"
                                            >Test@test.dk</span
                                        >
                                    </div>
                                </div>
                            </DropdownMenu.Label>
                            <DropdownMenu.Separator />
                            <DropdownMenu.Group>
                                <DropdownMenu.Item>
                                    <SparklesIcon />
                                    Upgrade to Pro
                                </DropdownMenu.Item>
                            </DropdownMenu.Group>
                            <DropdownMenu.Separator />
                            <DropdownMenu.Group>
                                <DropdownMenu.Item>
                                    <BadgeCheckIcon />
                                    Account
                                </DropdownMenu.Item>
                                <DropdownMenu.Item>
                                    <CreditCardIcon />
                                    Billing
                                </DropdownMenu.Item>
                                <DropdownMenu.Item>
                                    <BellIcon />
                                    Notifications
                                </DropdownMenu.Item>
                            </DropdownMenu.Group>
                            <DropdownMenu.Separator />
                            <DropdownMenu.Item>
                                <LogOutIcon />
                                Log out
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </Sidebar.MenuItem>
            </Sidebar.Menu>
        </Sidebar.Footer>
    </Sidebar.Root>

    <Sidebar.Inset>
        <header class="flex h-16 shrink-0 items-center gap-2">
            <div class="flex items-center gap-2 px-4">
                <Sidebar.Trigger class="-ms-1" />
                <Separator
                    orientation="vertical"
                    class="data-[orientation=vertical]:h-4"
                />
                <ThemeToggle></ThemeToggle>
                <Separator
                    orientation="vertical"
                    class="me-2 data-[orientation=vertical]:h-4"
                />
                <Breadcrumb.Root>
                    <Breadcrumb.List>
                        <Breadcrumb.Item class="hidden md:block">
                            <Breadcrumb.Link href="##"
                                >Build Your Application</Breadcrumb.Link
                            >
                        </Breadcrumb.Item>
                        <Breadcrumb.Separator class="hidden md:block" />
                        <Breadcrumb.Item>
                            <Breadcrumb.Page>Data Fetching</Breadcrumb.Page>
                        </Breadcrumb.Item>
                    </Breadcrumb.List>
                </Breadcrumb.Root>
            </div>
        </header>
        <main>
            {@render children()}
        </main>
    </Sidebar.Inset>
</Sidebar.Provider>
