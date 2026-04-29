<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.ts";
</script>

<svelte:head>
	<title>Dev | Blockkit</title>
</svelte:head>

<main class="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col justify-center gap-6 px-6 py-10">
	<div class="max-w-2xl space-y-3">
		<p class="text-sm font-medium text-muted-foreground">Blockkit dev</p>
		<h1 class="text-3xl font-semibold tracking-normal">Reference surfaces</h1>
		<p class="text-sm leading-6 text-muted-foreground">
			Internal pages for inspecting UI primitives, route frames, and component behavior.
		</p>
	</div>

	<div class="rounded-lg border bg-card p-5">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 class="text-base font-semibold">Design system</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Base shadcn-svelte primitives, theme tokens, icons, and feedback states.
				</p>
			</div>
			<Button href="/dev/design-system">Open</Button>
		</div>
	</div>
</main>
