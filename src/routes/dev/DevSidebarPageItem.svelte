<script module lang="ts">
    export type DevSidebarPage = {
        title: string;
        url: string;
        isActive?: boolean;
        items?: {
            title: string;
            url: string;
        }[];
        children?: DevSidebarPage[];
    };
</script>

<script lang="ts">
    import * as Collapsible from "$lib/components/ui/collapsible/index.ts";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.ts";
    import { Badge } from "$lib/components/ui/badge/index.ts";
    import * as Sidebar from "$lib/components/ui/sidebar/index.ts";
    import {
        ChevronRightIcon,
        EllipsisIcon,
        FileTextIcon,
        FolderIcon,
    } from "@lucide/svelte";
    import Self from "./DevSidebarPageItem.svelte";

    let {
        page,
        depth = 0,
    }: {
        page: DevSidebarPage;
        depth?: number;
    } = $props();

    const actions = $derived(
        page.items ?? [
            { title: "Edit page", url: "#" },
            { title: "Duplicate", url: "#" },
            { title: "Archive", url: "#" },
        ],
    );
    const childPages = $derived(page.children ?? []);
    const rowPadding = $derived(
        `padding-left: calc(0.5rem + ${depth} * 0.875rem); padding-right: 6.75rem;`,
    );
</script>

<Collapsible.Root open={page.isActive} class="group/collapsible">
    {#snippet child({ props })}
        <Sidebar.MenuItem {...props}>
            <div class="flex items-center">
                <Sidebar.MenuButton
                    class="w-full flex"
                    style={rowPadding}
                    tooltipContent={page.title}
                >
                    {#snippet child({ props })}
                        <a href={page.url} {...props}>
                            {#if childPages.length}
                                <FolderIcon class="size-4 shrink-0" />
                            {:else}
                                <FileTextIcon class="size-4 shrink-0" />
                            {/if}
                            <span>{page.title}</span>
                        </a>
                    {/snippet}
                </Sidebar.MenuButton>

                {#if childPages.length}
                    <Collapsible.Trigger>
                        {#snippet child({ props })}
                            <Sidebar.MenuAction
                                {...props}
                                class="right-14 opacity-100 hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground dark:hover:bg-muted/50 [&[data-state=open]>svg]:rotate-90"
                            >
                                <ChevronRightIcon
                                    class="transition-transform duration-200"
                                />
                                <span class="sr-only">Toggle subpages</span>
                            </Sidebar.MenuAction>
                        {/snippet}
                    </Collapsible.Trigger>
                {/if}

                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        {#snippet child({ props })}
                            <Sidebar.MenuAction
                                {...props}
                                class="right-8 opacity-100 hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground dark:hover:bg-muted/50"
                            >
                                <EllipsisIcon />
                                <span class="sr-only">Page actions</span>
                            </Sidebar.MenuAction>
                        {/snippet}
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content
                        side="right"
                        align="start"
                        class="min-w-56 rounded-lg"
                    >
                        {#each actions as action (action.title)}
                            <DropdownMenu.Item>
                                {#snippet child({ props })}
                                    <a href={action.url} {...props}
                                        >{action.title}</a
                                    >
                                {/snippet}
                            </DropdownMenu.Item>
                        {/each}
                    </DropdownMenu.Content>
                </DropdownMenu.Root>

                <Badge
                    class="right-1 flex justify-center h-0.5 w-0.5 rounded-full font-mono tabular-nums"
                ></Badge>
            </div>

            {#if childPages.length}
                <Collapsible.Content>
                    <div class="relative">
                        {#each childPages as childPage, index (index)}
                            <Self page={childPage} depth={depth + 1} />
                        {/each}
                    </div>
                </Collapsible.Content>
            {/if}
        </Sidebar.MenuItem>
    {/snippet}
</Collapsible.Root>
