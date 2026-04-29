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
		["Background", "bg-background text-foreground"],
		["Card", "bg-card text-card-foreground"],
		["Muted", "bg-muted text-muted-foreground"],
		["Primary", "bg-primary text-primary-foreground"],
		["Destructive", "bg-destructive text-destructive-foreground"],
		["Border", "bg-border text-foreground"]
	];

	let selectedStatus = $state("draft");
</script>

<svelte:head>
	<title>Design System | Blockkit Dev</title>
</svelte:head>

<div class="min-h-screen bg-background text-foreground">
	<header class="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-8 lg:px-8">
		<h1 class="text-2xl font-semibold tracking-normal">Design system</h1>
		<div class="flex items-center gap-2">
			<Button href="/dev" variant="ghost">Dev</Button>
			<Button variant="outline">
				<Plus data-icon="inline-start" />
				Sample
			</Button>
		</div>
	</header>

	<main class="mx-auto grid w-full max-w-7xl gap-10 px-6 pb-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:px-8">
		<div class="space-y-12">
			<section class="grid gap-6 border-t pt-6 md:grid-cols-[9rem_minmax(0,1fr)]">
				<div>
					<p class="text-sm font-semibold">Buttons</p>
					<p class="mt-1 text-xs text-muted-foreground">Variants / size / grouped</p>
				</div>
				<div class="space-y-6">
					<div class="grid gap-3 md:grid-cols-[6rem_minmax(0,1fr)] md:items-center">
						<p class="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Intent</p>
						<div class="flex flex-wrap items-center gap-x-3 gap-y-2">
							<Button>Default</Button>
							<Button variant="secondary">Secondary</Button>
							<Button variant="outline">Outline</Button>
							<Button variant="ghost">Ghost</Button>
							<Button variant="destructive">
								<Trash2 data-icon="inline-start" />
								Delete
							</Button>
							<Button variant="link">Link</Button>
							<Button disabled>Disabled</Button>
						</div>
					</div>

					<div class="grid gap-3 md:grid-cols-[6rem_minmax(0,1fr)] md:items-center">
						<p class="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Density</p>
						<div class="flex flex-wrap items-center gap-x-3 gap-y-2">
							<Button size="xs">Extra small</Button>
							<Button size="sm">Small</Button>
							<Button size="lg">Large</Button>
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
							<ButtonGroup.Root>
								<Button variant="outline" size="sm">Draft</Button>
								<ButtonGroup.Separator />
								<Button variant="outline" size="sm">Preview</Button>
								<ButtonGroup.Separator />
								<Button variant="outline" size="sm">Publish</Button>
							</ButtonGroup.Root>
						</div>
					</div>
				</div>
			</section>

			<section class="grid gap-6 border-t pt-6 md:grid-cols-[9rem_minmax(0,1fr)]">
				<div>
					<p class="text-sm font-semibold">Forms</p>
					<p class="mt-1 text-xs text-muted-foreground">Inputs / select / textarea</p>
				</div>
				<div class="grid gap-5 md:grid-cols-2">
					<div class="space-y-2">
						<Label for="page-title">Page title</Label>
						<Input id="page-title" value="Homepage" />
					</div>
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
					<div class="space-y-2 md:col-span-2">
						<Label for="description">Description</Label>
						<Textarea id="description" value="Short page summary for search and social previews." />
					</div>
				</div>
			</section>

			<section class="grid gap-6 border-t pt-6 md:grid-cols-[9rem_minmax(0,1fr)]">
				<div>
					<p class="text-sm font-semibold">Navigation</p>
					<p class="mt-1 text-xs text-muted-foreground">Tabs / menu / sheet</p>
				</div>
				<div class="space-y-6">
					<Tabs.Root value="overview">
						<Tabs.List>
							<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
							<Tabs.Trigger value="content">Content</Tabs.Trigger>
							<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
						</Tabs.List>
						<Tabs.Content value="overview" class="border-l py-3 pl-4 text-sm text-muted-foreground">
							Overview panel.
						</Tabs.Content>
						<Tabs.Content value="content" class="border-l py-3 pl-4 text-sm text-muted-foreground">
							Content panel.
						</Tabs.Content>
						<Tabs.Content value="settings" class="border-l py-3 pl-4 text-sm text-muted-foreground">
							Settings panel.
						</Tabs.Content>
					</Tabs.Root>

					<div class="flex flex-wrap items-center gap-3">
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
								<Button variant="ghost" class="px-0" {...props}>Show nested controls</Button>
							{/snippet}
						</Collapsible.Trigger>
						<Collapsible.Content class="border-l py-3 pl-4 text-sm text-muted-foreground">
							Collapsible content preserves compact page density.
						</Collapsible.Content>
					</Collapsible.Root>
				</div>
			</section>

			<section class="grid gap-6 border-t pt-6 md:grid-cols-[9rem_minmax(0,1fr)]">
				<div>
					<p class="text-sm font-semibold">Feedback</p>
					<p class="mt-1 text-xs text-muted-foreground">Alerts / badges / loading</p>
				</div>
				<div class="space-y-6">
					<div class="grid gap-3 md:grid-cols-2">
						<Alert.Root>
							<CircleAlert />
							<Alert.Title>Neutral alert</Alert.Title>
							<Alert.Description>Used for status, context, and non-blocking notices.</Alert.Description>
						</Alert.Root>
						<Alert.Root variant="destructive">
							<CircleAlert />
							<Alert.Title>Destructive alert</Alert.Title>
							<Alert.Description>Used for delete and irreversible action warnings.</Alert.Description>
						</Alert.Root>
					</div>
					<div class="flex flex-wrap items-center gap-3">
						<Badge>Default</Badge>
						<Badge variant="secondary">Secondary</Badge>
						<Badge variant="outline">Outline</Badge>
						<Badge variant="destructive">Destructive</Badge>
						<Spinner />
					</div>
					<Progress value={64} />
					<div class="grid gap-3 md:grid-cols-3">
						<Skeleton class="h-16 rounded-md" />
						<Skeleton class="h-16 rounded-md" />
						<Skeleton class="h-16 rounded-md" />
					</div>
				</div>
			</section>
		</div>

		<aside class="space-y-8 lg:sticky lg:top-6 lg:self-start">
			<section class="space-y-4 border-t pt-4">
				<h2 class="text-sm font-semibold">Tokens</h2>
				<div class="space-y-3">
					{#each colorTokens as [name, className]}
						<div class="grid grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-3">
							<div class={`size-9 rounded-md border ${className}`}></div>
							<div>
								<p class="text-sm font-medium">{name}</p>
								<p class="text-xs text-muted-foreground">{className.split(" ")[0]}</p>
							</div>
						</div>
					{/each}
				</div>
			</section>

			<section class="space-y-4 border-t pt-4">
				<h2 class="text-sm font-semibold">Avatars</h2>
				<Avatar.Group>
					<Avatar.Root>
						<Avatar.Fallback>TF</Avatar.Fallback>
					</Avatar.Root>
					<Avatar.Root>
						<Avatar.Fallback>BK</Avatar.Fallback>
					</Avatar.Root>
					<Avatar.GroupCount>+3</Avatar.GroupCount>
				</Avatar.Group>
			</section>

			<section class="space-y-4 border-t pt-4">
				<h2 class="text-sm font-semibold">Icons</h2>
				<div class="grid grid-cols-4 gap-2">
					{#each [Bell, FileText, Filter, Plus, Search, Sparkles, Trash2, EllipsisVertical] as Icon}
						<div class="flex size-10 items-center justify-center border-b border-r">
							<Icon class="size-4" />
						</div>
					{/each}
				</div>
			</section>

			<Separator />

			<p class="text-xs leading-5 text-muted-foreground">
				Add primitives here when installed. Keep samples close to CMS usage.
			</p>
		</aside>
	</main>
</div>
