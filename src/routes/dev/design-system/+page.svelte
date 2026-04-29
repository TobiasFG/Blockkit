<script lang="ts">
	import * as Alert from "$lib/components/ui/alert/index.ts";
	import * as Avatar from "$lib/components/ui/avatar/index.ts";
	import { Badge } from "$lib/components/ui/badge/index.ts";
	import { Button } from "$lib/components/ui/button/index.ts";
	import * as ButtonGroup from "$lib/components/ui/button-group/index.ts";
	import * as Collapsible from "$lib/components/ui/collapsible/index.ts";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.ts";
	import { Input } from "$lib/components/ui/input/index.ts";
	import { Label } from "$lib/components/ui/label/index.ts";
	import { Progress } from "$lib/components/ui/progress/index.ts";
	import * as Select from "$lib/components/ui/select/index.ts";
	import { Separator } from "$lib/components/ui/separator/index.ts";
	import * as Sheet from "$lib/components/ui/sheet/index.ts";
	import { Skeleton } from "$lib/components/ui/skeleton/index.ts";
	import { Spinner } from "$lib/components/ui/spinner/index.ts";
	import * as Tabs from "$lib/components/ui/tabs/index.ts";
	import { Textarea } from "$lib/components/ui/textarea/index.ts";
	import * as Tooltip from "$lib/components/ui/tooltip/index.ts";
	import {
		Bell,
		CircleAlert,
		EllipsisVertical,
		FileText,
		Filter,
		Plus,
		Search,
		Sparkles,
		Trash2
	} from "$lib/icons/index.ts";

	const colorTokens = [
		["Primary", "bg-primary"],
		["Focus", "bg-sky-500"],
		["Success", "bg-emerald-600"],
		["Warning", "bg-amber-500"],
		["Error", "bg-destructive"],
		["Neutral", "bg-muted-foreground"]
	];

	const componentLinks = [
		"Buttons",
		"Inputs",
		"Select",
		"Textarea",
		"Tabs",
		"Badges",
		"Alerts",
		"Icons"
	];

	let selectedStatus = $state("draft");
</script>

<svelte:head>
	<title>Design System | Blockkit Dev</title>
</svelte:head>

<div class="min-h-screen bg-background text-foreground">
	<header class="border-b">
		<div class="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
			<div class="flex items-center gap-3">
				<h1 class="text-sm font-semibold uppercase tracking-[0.18em]">Blockkit</h1>
				<span class="size-1.5 rounded-full bg-primary"></span>
				<p class="text-sm text-muted-foreground">Design system</p>
			</div>
			<div class="flex items-center gap-2">
				<Button href="/dev" variant="ghost" size="sm">Dev</Button>
				<Button variant="outline" size="sm">
					<Search data-icon="inline-start" />
					Search
				</Button>
			</div>
		</div>
	</header>

	<main class="mx-auto grid w-full max-w-7xl grid-cols-1 lg:grid-cols-[14rem_minmax(0,1fr)_18rem]">
		<aside class="hidden border-r px-4 py-8 lg:block">
			<nav class="sticky top-6 space-y-8">
				<div class="space-y-2">
					<p class="px-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
						Components
					</p>
					<div class="space-y-1">
						{#each componentLinks as item, index}
							<a
								href={`#${item.toLowerCase()}`}
								class={`flex h-8 items-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-muted ${
									index === 0 ? "bg-muted font-medium text-primary" : "text-muted-foreground"
								}`}
							>
								<span class={`size-1.5 rounded-full ${index === 0 ? "bg-primary" : "bg-border"}`}></span>
								{item}
							</a>
						{/each}
					</div>
				</div>

				<div class="rounded-lg border p-4">
					<div class="flex items-center gap-2 text-sm font-medium">
						<Sparkles class="size-4 text-primary" />
						Dev notes
					</div>
					<p class="mt-3 text-xs leading-5 text-muted-foreground">
						Keep samples close to production CMS behavior.
					</p>
				</div>
			</nav>
		</aside>

		<div class="px-6 py-8 lg:px-10">
			<section id="buttons" class="space-y-8">
				<div class="flex items-center gap-3">
					<h2 class="text-2xl font-semibold tracking-normal">Buttons</h2>
					<Badge variant="outline">base</Badge>
				</div>

				<div class="grid gap-x-16 gap-y-8 md:grid-cols-2">
					<div class="space-y-3">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Variants</p>
						<div class="flex flex-wrap items-center gap-3">
							<Button>Primary</Button>
							<Button variant="secondary">Secondary</Button>
							<Button variant="outline">Outline</Button>
							<Button variant="ghost">Ghost</Button>
							<Button variant="destructive">
								<Trash2 data-icon="inline-start" />
								Delete
							</Button>
							<Button variant="link">Link</Button>
						</div>
					</div>

					<div class="space-y-3">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Icon buttons</p>
						<div class="flex flex-wrap items-center gap-3">
							<Tooltip.Provider>
								<Tooltip.Root>
									<Tooltip.Trigger>
										{#snippet child({ props })}
											<Button size="icon" variant="outline" {...props}>
												<Search />
												<span class="sr-only">Search</span>
											</Button>
										{/snippet}
									</Tooltip.Trigger>
									<Tooltip.Content>Search content</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
							<Button size="icon" variant="outline"><Filter /></Button>
							<Button size="icon"><Plus /></Button>
							<Button size="icon" variant="outline"><Bell /></Button>
						</div>
					</div>

					<div class="space-y-3">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Sizes</p>
						<div class="flex flex-wrap items-center gap-3">
							<Button size="xs">XS</Button>
							<Button size="sm">SM</Button>
							<Button>MD</Button>
							<Button size="lg">LG</Button>
							<Button disabled>Disabled</Button>
						</div>
					</div>

					<div class="space-y-3">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Group</p>
						<ButtonGroup.Root>
							<Button variant="outline" size="sm">Draft</Button>
							<ButtonGroup.Separator />
							<Button variant="outline" size="sm">Preview</Button>
							<ButtonGroup.Separator />
							<Button variant="outline" size="sm">Publish</Button>
						</ButtonGroup.Root>
					</div>
				</div>
			</section>

			<Separator class="my-8" />

			<section id="inputs" class="space-y-6">
				<h2 class="text-xl font-semibold tracking-normal">Form elements</h2>
				<div class="grid gap-x-16 gap-y-6 md:grid-cols-3">
					<div class="space-y-5">
						<div class="space-y-2">
							<Label for="page-title">Label</Label>
							<Input id="page-title" placeholder="Placeholder" />
						</div>
						<div class="space-y-2">
							<Label for="page-slug">With helper text</Label>
							<Input id="page-slug" value="/home" />
							<p class="text-xs text-muted-foreground">This is helper text.</p>
						</div>
						<div class="space-y-2">
							<Label for="page-error">With error</Label>
							<Input id="page-error" value="Invalid entry" aria-invalid="true" />
							<p class="text-xs text-destructive">This field has an error.</p>
						</div>
					</div>

					<div class="space-y-5">
						<div class="space-y-2">
							<Label>Status</Label>
							<Select.Root type="single" bind:value={selectedStatus}>
								<Select.Trigger class="w-full">Draft</Select.Trigger>
								<Select.Content>
									<Select.Item value="draft">Draft</Select.Item>
									<Select.Item value="published">Published</Select.Item>
									<Select.Item value="archived">Archived</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>
						<div class="space-y-2">
							<Label>Badges</Label>
							<div class="flex flex-wrap gap-2">
								<Badge>Default</Badge>
								<Badge variant="secondary">Draft</Badge>
								<Badge variant="outline">Idle</Badge>
								<Badge variant="destructive">Error</Badge>
							</div>
						</div>
					</div>

					<div class="space-y-2">
						<Label for="description">Textarea</Label>
						<Textarea id="description" value="Enter details..." class="min-h-32" />
					</div>
				</div>
			</section>

			<Separator class="my-8" />

			<section id="tabs" class="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(16rem,0.8fr)]">
				<div class="space-y-4">
					<h2 class="text-xl font-semibold tracking-normal">Tabs</h2>
					<Tabs.Root value="overview">
						<Tabs.List>
							<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
							<Tabs.Trigger value="content">Content</Tabs.Trigger>
							<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
							<Tabs.Trigger value="activity">Activity</Tabs.Trigger>
						</Tabs.List>
						<Tabs.Content value="overview" class="mt-4 rounded-lg border p-5 text-sm text-muted-foreground">
							Overview panel content goes here.
						</Tabs.Content>
						<Tabs.Content value="content" class="mt-4 rounded-lg border p-5 text-sm text-muted-foreground">
							Content panel content goes here.
						</Tabs.Content>
						<Tabs.Content value="settings" class="mt-4 rounded-lg border p-5 text-sm text-muted-foreground">
							Settings panel content goes here.
						</Tabs.Content>
						<Tabs.Content value="activity" class="mt-4 rounded-lg border p-5 text-sm text-muted-foreground">
							Activity panel content goes here.
						</Tabs.Content>
					</Tabs.Root>
				</div>

				<div class="space-y-4">
					<h2 class="text-xl font-semibold tracking-normal">Overlay</h2>
					<div class="flex flex-wrap gap-3">
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Button variant="outline" {...props}>
										<EllipsisVertical data-icon="inline-start" />
										Actions
									</Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content>
								<DropdownMenu.Label>Page actions</DropdownMenu.Label>
								<DropdownMenu.Item>Edit</DropdownMenu.Item>
								<DropdownMenu.Item>Duplicate</DropdownMenu.Item>
								<DropdownMenu.Separator />
								<DropdownMenu.Item variant="destructive">Delete</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>

						<Sheet.Root>
							<Sheet.Trigger>
								{#snippet child({ props })}
									<Button variant="outline" {...props}>Open sheet</Button>
								{/snippet}
							</Sheet.Trigger>
							<Sheet.Content>
								<Sheet.Header>
									<Sheet.Title>Inspector</Sheet.Title>
									<Sheet.Description>Side panel pattern for focused editing.</Sheet.Description>
								</Sheet.Header>
								<div class="px-4 text-sm text-muted-foreground">Sheet content area.</div>
							</Sheet.Content>
						</Sheet.Root>
					</div>

					<Collapsible.Root>
						<Collapsible.Trigger>
							{#snippet child({ props })}
								<Button variant="ghost" class="px-0" {...props}>Show collapsible row</Button>
							{/snippet}
						</Collapsible.Trigger>
						<Collapsible.Content class="rounded-lg border p-4 text-sm text-muted-foreground">
							Collapsible content preserves compact page density.
						</Collapsible.Content>
					</Collapsible.Root>
				</div>
			</section>

			<Separator class="my-8" />

			<section id="alerts" class="space-y-5">
				<h2 class="text-xl font-semibold tracking-normal">Feedback</h2>
				<div class="grid gap-3 md:grid-cols-2">
					<Alert.Root class="border-emerald-200 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/20">
						<CircleAlert />
						<Alert.Title>Success</Alert.Title>
						<Alert.Description>Operation completed.</Alert.Description>
					</Alert.Root>
					<Alert.Root class="border-amber-200 bg-amber-50 text-amber-950 dark:bg-amber-950/20">
						<CircleAlert />
						<Alert.Title>Warning</Alert.Title>
						<Alert.Description>Review before publishing.</Alert.Description>
					</Alert.Root>
					<Alert.Root variant="destructive">
						<CircleAlert />
						<Alert.Title>Error</Alert.Title>
						<Alert.Description>Action could not complete.</Alert.Description>
					</Alert.Root>
					<Alert.Root>
						<CircleAlert />
						<Alert.Title>Info</Alert.Title>
						<Alert.Description>Draft saved locally.</Alert.Description>
					</Alert.Root>
				</div>
				<Progress value={64} />
			</section>
		</div>

		<aside class="border-l px-6 py-8">
			<div class="sticky top-6 space-y-8">
				<section class="space-y-4">
					<div class="flex items-center justify-between">
						<h2 class="text-sm font-semibold uppercase tracking-[0.14em]">Tokens</h2>
						<Button variant="link" size="sm">View all</Button>
					</div>
					<div class="space-y-3">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Color</p>
						<div class="grid grid-cols-3 gap-4">
							{#each colorTokens as [name, className]}
								<div class="space-y-2">
									<div class={`size-8 rounded-full border ${className}`}></div>
									<p class="text-xs text-muted-foreground">{name}</p>
								</div>
							{/each}
						</div>
					</div>
				</section>

				<section class="space-y-4">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Spacing</p>
					<div class="flex items-end gap-3">
						{#each [4, 8, 12, 16, 24, 32, 48] as size}
							<div class="space-y-2">
								<div class="bg-muted-foreground/30" style={`width:${Math.max(size / 2, 4)}px;height:${Math.max(size / 2, 4)}px`}></div>
								<p class="text-[0.65rem] text-muted-foreground">{size}</p>
							</div>
						{/each}
					</div>
				</section>

				<section class="space-y-4">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Type</p>
					<div class="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-y-3">
						<p class="text-5xl font-semibold">Ag</p>
						<div class="self-center text-xs text-muted-foreground">Display<br />36 / 40</div>
						<p class="text-2xl font-semibold">Ag</p>
						<div class="self-center text-xs text-muted-foreground">Heading<br />24 / 32</div>
						<p class="text-base">Ag</p>
						<div class="self-center text-xs text-muted-foreground">Body<br />16 / 24</div>
					</div>
				</section>

				<section class="space-y-4">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Identity</p>
					<Avatar.Group>
						<Avatar.Root>
							<Avatar.Fallback>TF</Avatar.Fallback>
						</Avatar.Root>
						<Avatar.Root>
							<Avatar.Fallback>BK</Avatar.Fallback>
						</Avatar.Root>
						<Avatar.GroupCount>+3</Avatar.GroupCount>
					</Avatar.Group>
					<div class="grid grid-cols-4 gap-2">
						{#each [Bell, FileText, Filter, Plus, Search, Sparkles, Trash2, EllipsisVertical] as Icon}
							<div class="flex size-9 items-center justify-center rounded-md border">
								<Icon class="size-4" />
							</div>
						{/each}
					</div>
				</section>

				<Skeleton class="h-28 rounded-lg" />
			</div>
		</aside>
	</main>
</div>
