<script lang="ts">
	import { browser } from '$app/environment';
	import { applyAction, enhance } from '$app/forms';
	import { pagesStore } from '$lib/client/pagesStore';
	import { reusableBlocksStore } from '$lib/client/reusableBlocksStore';
	import type { Page, ReusableBlock } from '$lib/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let feedback = $state<{ tone: 'success' | 'error'; text: string } | null>(null);
	let restoringPageId = $state<string | null>(null);
	let restoringBlockId = $state<string | null>(null);
	let pageParentSelections = $state<Record<string, string>>({});

	const activePages = $derived(data.pages ?? []);
	const deletedPages = $derived(data.deletedPages ?? []);
	const deletedReusableBlocks = $derived(data.deletedReusableBlocks ?? []);

	const formatDate = (value: string | null | undefined) =>
		value
			? new Intl.DateTimeFormat('en', {
					day: 'numeric',
					month: 'short',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				}).format(new Date(value))
			: 'Unknown';

	const displayPath = (value: string | null | undefined) => (value && value.trim() ? value : '/');
	const parentOptions = (pageId: string) => activePages.filter((page) => page.id !== pageId);

	$effect(() => {
		if (browser) {
			pagesStore.set(activePages);
			reusableBlocksStore.set(data.reusableBlocks ?? []);
		}

		for (const page of deletedPages) {
			if (pageParentSelections[page.id] !== undefined) continue;
			pageParentSelections = {
				...pageParentSelections,
				[page.id]: page.parent_page_id ?? ''
			};
		}
	});
</script>

<svelte:head>
	<title>Trash</title>
</svelte:head>

<main class="space-y-8">
	<section class="rounded-[2rem] border border-stone-200/80 bg-white/95 px-6 py-8 shadow-[0_24px_70px_-48px_rgba(41,37,36,0.35)] sm:px-8">
		<p class="text-xs font-semibold uppercase tracking-[0.32em] text-stone-500">Trash</p>
		<h1 class="mt-2 text-[2.4rem] font-semibold tracking-[-0.045em] text-stone-950 sm:text-5xl">
			Deleted work stays recoverable.
		</h1>
		<p class="mt-3 max-w-3xl text-base leading-7 text-stone-600">
			Pages and content moved here stay out of normal CMS lists until restored. Deleted content does not
			auto-reinsert into pages it was removed from.
		</p>
	</section>

	{#if feedback}
		<div
			class={[
				'rounded-2xl border px-4 py-3 text-sm',
				feedback.tone === 'success'
					? 'border-emerald-300/70 bg-emerald-50 text-emerald-950'
					: 'border-red-300/70 bg-red-50 text-red-950'
			].join(' ')}
		>
			{feedback.text}
		</div>
	{/if}

	<section class="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
		<div class="rounded-[1.75rem] border border-stone-200/80 bg-white p-5 shadow-[0_18px_55px_-42px_rgba(41,37,36,0.3)]">
			<div class="space-y-2 border-b border-stone-200 pb-4">
				<p class="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">Pages</p>
				<h2 class="text-[1.45rem] font-semibold tracking-[-0.03em] text-stone-950">Deleted pages</h2>
				<p class="text-sm leading-6 text-stone-600">
					Pages with child pages still cannot be deleted. Restoring can target a new parent.
				</p>
			</div>

			<div class="mt-5 space-y-4">
				{#if deletedPages.length === 0}
					<div class="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-600">
						No deleted pages.
					</div>
				{:else}
					{#each deletedPages as page (page.id)}
						<div class="rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
							<div class="flex flex-wrap items-start justify-between gap-3">
								<div class="space-y-1">
									<div class="flex flex-wrap items-center gap-2">
										<h3 class="text-lg font-semibold text-stone-950">{page.title}</h3>
										<span class="rounded-full bg-stone-200 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-700">
											Page
										</span>
									</div>
									<div class="flex flex-wrap gap-x-3 gap-y-1 text-sm text-stone-500">
										<span class="font-mono text-[12px] text-stone-700">{displayPath(page.path)}</span>
										<span>Deleted {formatDate(page.deleted_at)}</span>
									</div>
								</div>
								<span class="text-sm font-medium text-stone-500">Editor unavailable while trashed</span>
							</div>

							<form
								method="POST"
								action="?/restorePage"
								class="mt-4 space-y-3"
								use:enhance={() => {
									feedback = null;
									restoringPageId = page.id;

									return async ({ result, update }) => {
										restoringPageId = null;

										if (result.type === 'success' && result.data) {
											feedback = {
												tone: 'success',
												text: 'Page restored.'
											};
											pagesStore.set((result.data.pages as Page[]) ?? []);
										} else if (result.type === 'failure') {
											feedback = {
												tone: 'error',
												text: `Failed to restore page: ${result.data?.error ?? 'Unknown error'}`
											};
										}

										await applyAction(result);
										await update({ reset: false, invalidateAll: false });
									};
								}}
							>
								<input type="hidden" name="pageId" value={page.id} />
								<div class="space-y-1">
									<label for={`parent-${page.id}`} class="text-sm font-medium text-stone-800">Restore under parent</label>
									<select
										id={`parent-${page.id}`}
										name="parentPageId"
										bind:value={pageParentSelections[page.id]}
										class="w-full rounded-2xl border border-stone-300/80 bg-white px-4 py-3 text-sm text-stone-900 outline-none focus:border-stone-500 focus:ring-4 focus:ring-stone-200/70"
									>
										<option value="" disabled>Select parent page</option>
										{#each parentOptions(page.id) as parent (parent.id)}
											<option value={parent.id}>{parent.title} ({displayPath(parent.path)})</option>
										{/each}
									</select>
								</div>
								<button
									type="submit"
									class="inline-flex min-h-11 items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-300/70 disabled:cursor-not-allowed disabled:opacity-60"
									disabled={restoringPageId === page.id || !pageParentSelections[page.id]}
								>
									{restoringPageId === page.id ? 'Restoring...' : 'Restore page'}
								</button>
							</form>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<div class="rounded-[1.75rem] border border-stone-200/80 bg-white p-5 shadow-[0_18px_55px_-42px_rgba(41,37,36,0.3)]">
			<div class="space-y-2 border-b border-stone-200 pb-4">
				<p class="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">Content</p>
				<h2 class="text-[1.45rem] font-semibold tracking-[-0.03em] text-stone-950">Deleted content</h2>
				<p class="text-sm leading-6 text-stone-600">
					Restoring content makes item available again, but does not reinsert removed page references.
				</p>
			</div>

			<div class="mt-5 space-y-4">
				{#if deletedReusableBlocks.length === 0}
					<div class="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-600">
						No deleted content.
					</div>
				{:else}
					{#each deletedReusableBlocks as block (block.id)}
						<div class="rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
							<div class="space-y-1">
								<div class="flex flex-wrap items-center gap-2">
									<h3 class="text-lg font-semibold text-stone-950">{block.name}</h3>
									<span class="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-800">
										{block.block_type}
									</span>
								</div>
								<div class="flex flex-wrap gap-x-3 gap-y-1 text-sm text-stone-500">
									<span>Deleted {formatDate(block.deleted_at)}</span>
									<span>{block.is_published ? 'Had published version' : 'Draft only'}</span>
								</div>
							</div>

							<form
								method="POST"
								action="?/restoreReusableBlock"
								class="mt-4"
								use:enhance={() => {
									feedback = null;
									restoringBlockId = block.id;

									return async ({ result, update }) => {
										restoringBlockId = null;

										if (result.type === 'success' && result.data) {
											feedback = {
												tone: 'success',
												text: 'Content restored. Removed page references stay removed.'
											};
											reusableBlocksStore.set((result.data.reusableBlocks as ReusableBlock[]) ?? []);
										} else if (result.type === 'failure') {
											feedback = {
												tone: 'error',
												text: `Failed to restore content: ${result.data?.error ?? 'Unknown error'}`
											};
										}

										await applyAction(result);
										await update({ reset: false, invalidateAll: false });
									};
								}}
							>
								<input type="hidden" name="id" value={block.id} />
								<button
									type="submit"
									class="inline-flex min-h-11 items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-300/70 disabled:cursor-not-allowed disabled:opacity-60"
									disabled={restoringBlockId === block.id}
								>
									{restoringBlockId === block.id ? 'Restoring...' : 'Restore content'}
								</button>
							</form>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</section>
</main>
