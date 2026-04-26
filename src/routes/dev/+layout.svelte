<script lang="ts">
    import type { Snippet } from "svelte";
    import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import * as Collapsible from "$lib/components/ui/collapsible/index.js";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";

    import { useSidebar } from "$lib/components/ui/sidebar/index.js";
    const sidebar = useSidebar();

    import CommandIcon from "@lucide/svelte/icons/command";
    import {
        BadgeCheckIcon,
        BellIcon,
        BookOpenIcon,
        BotIcon,
        ChartPieIcon,
        ChevronRightIcon,
        ChevronsUpDownIcon,
        CreditCardIcon,
        EllipsisIcon,
        FolderIcon,
        FrameIcon,
        LifeBuoyIcon,
        LogOutIcon,
        MapIcon,
        SendIcon,
        Settings2Icon,
        ShareIcon,
        SparklesIcon,
        SquareTerminalIcon,
        Trash2Icon,
    } from "@lucide/svelte";

    let { children }: { children: Snippet } = $props();

    const data = {
        user: {
            name: "shadcn",
            email: "m@example.com",
            avatar: "/avatars/shadcn.jpg",
        },
        navMain: [
            {
                title: "Playground",
                url: "#",
                icon: SquareTerminalIcon,
                isActive: true,
                items: [
                    {
                        title: "History",
                        url: "#",
                    },
                    {
                        title: "Starred",
                        url: "#",
                    },
                    {
                        title: "Settings",
                        url: "#",
                    },
                ],
            },
            {
                title: "Models",
                url: "#",
                icon: BotIcon,
                items: [
                    {
                        title: "Genesis",
                        url: "#",
                    },
                    {
                        title: "Explorer",
                        url: "#",
                    },
                    {
                        title: "Quantum",
                        url: "#",
                    },
                ],
            },
            {
                title: "Documentation",
                url: "#",
                icon: BookOpenIcon,
                items: [
                    {
                        title: "Introduction",
                        url: "#",
                    },
                    {
                        title: "Get Started",
                        url: "#",
                    },
                    {
                        title: "Tutorials",
                        url: "#",
                    },
                    {
                        title: "Changelog",
                        url: "#",
                    },
                ],
            },
            {
                title: "Settings",
                url: "#",
                icon: Settings2Icon,
                items: [
                    {
                        title: "General",
                        url: "#",
                    },
                    {
                        title: "Team",
                        url: "#",
                    },
                    {
                        title: "Billing",
                        url: "#",
                    },
                    {
                        title: "Limits",
                        url: "#",
                    },
                ],
            },
        ],
        navSecondary: [
            {
                title: "Support",
                url: "#",
                icon: LifeBuoyIcon,
            },
            {
                title: "Feedback",
                url: "#",
                icon: SendIcon,
            },
        ],
        projects: [
            {
                name: "Design Engineering",
                url: "#",
                icon: FrameIcon,
            },
            {
                name: "Sales & Marketing",
                url: "#",
                icon: ChartPieIcon,
            },
            {
                name: "Travel",
                url: "#",
                icon: MapIcon,
            },
        ],
    };
</script>

<Sidebar.Provider>
    <Sidebar.Root variant="inset">
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
                <Sidebar.GroupLabel>Platform</Sidebar.GroupLabel>
                <Sidebar.Menu>
                    {#each data.navMain as mainItem (mainItem.title)}
                        <Collapsible.Root open={mainItem.isActive}>
                            {#snippet child({ props })}
                                <Sidebar.MenuItem {...props}>
                                    <Sidebar.MenuButton
                                        tooltipContent={mainItem.title}
                                    >
                                        {#snippet child({ props })}
                                            <a href={mainItem.url} {...props}>
                                                <mainItem.icon />
                                                <span>{mainItem.title}</span>
                                            </a>
                                        {/snippet}
                                    </Sidebar.MenuButton>
                                    {#if mainItem.items?.length}
                                        <Collapsible.Trigger>
                                            {#snippet child({ props })}
                                                <Sidebar.MenuAction
                                                    {...props}
                                                    class="data-[state=open]:rotate-90"
                                                >
                                                    <ChevronRightIcon />
                                                    <span class="sr-only"
                                                        >Toggle</span
                                                    >
                                                </Sidebar.MenuAction>
                                            {/snippet}
                                        </Collapsible.Trigger>
                                        <Collapsible.Content>
                                            <Sidebar.MenuSub>
                                                {#each mainItem.items as subItem (subItem.title)}
                                                    <Sidebar.MenuSubItem>
                                                        <Sidebar.MenuSubButton
                                                            href={subItem.url}
                                                        >
                                                            <span
                                                                >{subItem.title}</span
                                                            >
                                                        </Sidebar.MenuSubButton>
                                                    </Sidebar.MenuSubItem>
                                                {/each}
                                            </Sidebar.MenuSub>
                                        </Collapsible.Content>
                                    {/if}
                                </Sidebar.MenuItem>
                            {/snippet}
                        </Collapsible.Root>
                    {/each}
                </Sidebar.Menu>
            </Sidebar.Group>
            <Sidebar.Group class="group-data-[collapsible=icon]:hidden">
                <Sidebar.GroupLabel>Projects</Sidebar.GroupLabel>
                <Sidebar.Menu>
                    {#each data.projects as item (item.name)}
                        <Sidebar.MenuItem>
                            <Sidebar.MenuButton>
                                {#snippet child({ props })}
                                    <a href={item.url} {...props}>
                                        <item.icon />
                                        <span>{item.name}</span>
                                    </a>
                                {/snippet}
                            </Sidebar.MenuButton>
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger>
                                    {#snippet child({ props })}
                                        <Sidebar.MenuAction
                                            showOnHover
                                            {...props}
                                        >
                                            <EllipsisIcon />
                                            <span class="sr-only">More</span>
                                        </Sidebar.MenuAction>
                                    {/snippet}
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content
                                    class="w-48"
                                    side={sidebar.isMobile ? "bottom" : "right"}
                                    align={sidebar.isMobile ? "end" : "start"}
                                >
                                    <DropdownMenu.Item>
                                        <FolderIcon
                                            class="text-muted-foreground"
                                        />
                                        <span>View Project</span>
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item>
                                        <ShareIcon
                                            class="text-muted-foreground"
                                        />
                                        <span>Share Project</span>
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Separator />
                                    <DropdownMenu.Item>
                                        <Trash2Icon
                                            class="text-muted-foreground"
                                        />
                                        <span>Delete Project</span>
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                        </Sidebar.MenuItem>
                    {/each}
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton>
                            <EllipsisIcon />
                            <span>More</span>
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                </Sidebar.Menu>
            </Sidebar.Group>

            <Sidebar.Group>
                <Sidebar.GroupContent>
                    <Sidebar.Menu>
                        {#each data.navSecondary as item (item.title)}
                            <Sidebar.MenuItem>
                                <Sidebar.MenuButton size="sm">
                                    {#snippet child({ props })}
                                        <a href={item.url} {...props}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    {/snippet}
                                </Sidebar.MenuButton>
                            </Sidebar.MenuItem>
                        {/each}
                    </Sidebar.Menu>
                </Sidebar.GroupContent>
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
                            side={sidebar.isMobile ? "bottom" : "right"}
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
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div class="grid auto-rows-min gap-4 md:grid-cols-3">
                <div class="bg-muted/50 aspect-video rounded-xl"></div>
                <div class="bg-muted/50 aspect-video rounded-xl"></div>
                <div class="bg-muted/50 aspect-video rounded-xl"></div>
            </div>
            <div
                class="bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min"
            ></div>
        </div>
    </Sidebar.Inset>
</Sidebar.Provider>
{@render children()}
