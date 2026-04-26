<script lang="ts">
    import type { Snippet } from "svelte";
    import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.ts";
    import * as Sidebar from "$lib/components/ui/sidebar/index.ts";
    import { Separator } from "$lib/components/ui/separator/index.ts";
    import ThemeToggle from "$lib/Theme/ThemeToggle.svelte";
    import DevSidebarFrame from "./DevSidebarFrame.svelte";
    import type { DevSidebarPage } from "./DevSidebarPageItem.svelte";

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
    <DevSidebarFrame {pages} />

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
                            <Breadcrumb.Link href="##">
                                Build Your Application
                            </Breadcrumb.Link>
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
