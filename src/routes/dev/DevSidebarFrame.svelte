<script lang="ts">
    import * as Avatar from "$lib/components/ui/avatar/index.ts";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.ts";
    import * as Sidebar from "$lib/components/ui/sidebar/index.ts";
    import CommandIcon from "@lucide/svelte/icons/command";
    import {
        BadgeCheckIcon,
        BellIcon,
        ChevronsUpDownIcon,
        CreditCardIcon,
        FileTextIcon,
        FolderIcon,
        HomeIcon,
        LogOutIcon,
        SearchIcon,
        SparklesIcon,
    } from "@lucide/svelte";
    import DevSidebarPageItem, {
        type DevSidebarPage,
    } from "./DevSidebarPageItem.svelte";

    let {
        pages,
    }: {
        pages: DevSidebarPage[];
    } = $props();

    const sidebar = Sidebar.useSidebar();
</script>

<Sidebar.Root variant="inset" collapsible="icon">
    {#if sidebar.state === "collapsed"}
        <Sidebar.Header>
            <Sidebar.Menu>
                <Sidebar.MenuItem>
                    <Sidebar.MenuButton size="lg" tooltipContent="Acme Inc">
                        <CommandIcon class="size-4" />
                    </Sidebar.MenuButton>
                </Sidebar.MenuItem>
            </Sidebar.Menu>
        </Sidebar.Header>

        <Sidebar.Content>
            <Sidebar.Group>
                <Sidebar.Menu>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton tooltipContent="Pages">
                            <HomeIcon size="2" />
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton tooltipContent="All pages">
                            <FileTextIcon class="size-8" />
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton tooltipContent="Folders">
                            <FolderIcon class="size-4" />
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton tooltipContent="Search">
                            <SearchIcon class="size-4" />
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                </Sidebar.Menu>
            </Sidebar.Group>
        </Sidebar.Content>

        <Sidebar.Footer>
            <Sidebar.Menu>
                <Sidebar.MenuItem>
                    <Sidebar.MenuButton size="lg" tooltipContent="Test">
                        <Avatar.Root class="size-8 rounded-lg">
                            <Avatar.Image src="" alt="" />
                            <Avatar.Fallback class="rounded-lg"
                                >CN</Avatar.Fallback
                            >
                        </Avatar.Root>
                    </Sidebar.MenuButton>
                </Sidebar.MenuItem>
            </Sidebar.Menu>
        </Sidebar.Footer>
    {:else}
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
                    {#each pages as page, index (index)}
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
    {/if}
</Sidebar.Root>
