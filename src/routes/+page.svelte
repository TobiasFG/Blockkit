<script lang="ts">
	import { browser } from '$app/environment';
	import { applyAction, enhance } from '$app/forms';
	import { resolveRoute } from '$app/paths';
	import { flip } from 'svelte/animate';

	import { pagesStore } from '$lib/client/pagesStore';
	import { pageHasDraftChanges } from '$lib/pageStatus';
	import type { PageProps } from './$types';
	import type { Page } from '$lib/types';

	type FeedbackState = { tone: 'success' | 'error'; text: string } | null;

	let { data }: PageProps = $props();
	const pages = $derived(browser ? ($pagesStore ?? (data.pages ?? [])) : (data.pages ?? []));
	const dashboardPages = $derived(sortDashboardPages(pages));
	const draftPageCount = $derived(dashboardPages.filter((page) => pageHasDraftChanges(page)).length);
	const reusableBlockCount = $derived(data.reusableBlocks?.length ?? 0);
	let formSubmitting = $state(false);
	let pageFeedback = $state<FeedbackState>(null);
	let deletingPage = $state<string | null>(null);
	let pendingDeletePage = $state<Page | null>(null);
	let showDeletePageModal = $state(false);

	const dateFormatter = new Intl.DateTimeFormat('en', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});

	function sortDashboardPages(items: Page[]) {
		return [...items].sort((a, b) => {
			const draftDiff = Number(pageHasDraftChanges(b)) - Number(pageHasDraftChanges(a));
			if (draftDiff !== 0) return draftDiff;

			const updatedDiff = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
			if (updatedDiff !== 0) return updatedDiff;

			return a.title.localeCompare(b.title);
		});
	}

	const clearPageFeedback = () => {
		pageFeedback = null;
	};

	const openDeletePageModal = (page: Page) => {
		pendingDeletePage = page;
		showDeletePageModal = true;
	};

	const closeDeletePageModal = () => {
		showDeletePageModal = false;
		pendingDeletePage = null;
	};

	const editHref = (slug: string) => {
		const cleaned = slug.replace(/^\//, '');
		const target = isRootPage(slug) ? '__root__' : cleaned;
		return resolveRoute('/edit/[...slug]', { slug: target });
	};

	const displaySlug = (slug: string) => {
		const cleaned = slug.replace(/^\//, '');
		return cleaned.length === 0 ? '/' : `/${cleaned}`;
	};

	const isRootPage = (slug: string) => slug === '/' || slug.trim() === '';
	const displayDate = (value: string) => dateFormatter.format(new Date(value));

	$effect(() => {
		if (browser) {
			pagesStore.set(data.pages ?? []);
		}
	});
</script>

<main class="mx-auto max-w-6xl space-y-8 pb-12">
	<section class="overflow-hidden rounded-3xl border border-slate-900 bg-slate-950 text-white shadow-[0_32px_90px_-48px_rgba(15,23,42,0.95)]">
		<div class="grid gap-8 px-6 py-7 sm:px-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.7fr)] lg:items-end">
			<div class="space-y-4">
				<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">CMS</p>
				<div class="space-y-3">
					<h1 class="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
						Pages first. Shared content lives in the library.
					</h1>
					<p class="max-w-2xl text-base leading-7 text-slate-300">
						Open page that needs attention, draft next one, leave content creation to dedicated Content library.
					</p>
				</div>
				<p class="text-sm text-slate-400">Home stays at `/`.</p>
			</div>

			<div class="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
				<div class="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
					<span class="text-sm font-medium text-slate-300">Pages</span>
					<span class="text-lg font-semibold text-white">{dashboardPages.length}</span>
				</div>
				<div class="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
					<span class="text-sm font-medium text-slate-300">Draft work</span>
					<span class="text-lg font-semibold text-white">{draftPageCount}</span>
				</div>
				<div class="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
					<span class="text-sm font-medium text-slate-300">Shared content</span>
					<span class="text-lg font-semibold text-white">{reusableBlockCount}</span>
				</div>
			</div>
		</div>
	</section>

	<section class="space-y-6">
		<div class="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
			<div class="space-y-1">
				<h2 class="text-2xl font-semibold tracking-tight text-slate-900">Pages</h2>
				<p class="max-w-2xl text-sm leading-6 text-slate-600">
					Draft changes sort first, then the most recently updated pages.
				</p>
			</div>
			<span class="text-sm font-medium text-slate-500">{dashboardPages.length} total</span>
		</div>

		{#if dashboardPages.length > 0}
			<ul class="grid gap-3">
				{#each dashboardPages as page (page.id)}
					<li
						animate:flip={{ duration: 300 }}
						class={[
							'grid gap-4 rounded-2xl border px-5 py-5 transition sm:grid-cols-[minmax(0,1fr)_auto]',
							pageHasDraftChanges(page)
								? 'border-sky-200 bg-sky-50/70 shadow-sm'
								: 'border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:bg-slate-50/60'
						].join(' ')}
					>
						<div class="min-w-0 space-y-2">
							<div class="flex flex-wrap items-center gap-2">
								<h3 class="text-lg font-semibold text-slate-900">{page.title}</h3>
								{#if pageHasDraftChanges(page)}
									<span class="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-800">
										Draft work
									</span>
								{/if}
							</div>
							<div class="flex flex-wrap items-center gap-3 text-sm text-slate-600">
								<span class="font-mono text-slate-500">{displaySlug(page.slug)}</span>
								<span>Updated {displayDate(page.updated_at)}</span>
							</div>
						</div>
						<div class="flex items-center justify-end gap-2 sm:self-center">
							<a
								href={editHref(page.slug)}
								class="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
							>
								Edit
							</a>
							{#if !isRootPage(page.slug)}
								<button
									type="button"
									class="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
									disabled={deletingPage === page.slug}
									onclick={() => openDeletePageModal(page)}
								>
									{deletingPage === page.slug ? 'Deleting...' : 'Delete'}
								</button>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<div class="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
				<p class="text-slate-700">
					No pages yet. Add your first page below to start building the site structure.
				</p>
			</div>
		{/if}

		<div id="create" class="scroll-mt-20 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
			<div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
				<div class="space-y-1">
					<h3 class="text-lg font-semibold text-slate-900">Create a page</h3>
					<p class="text-sm text-slate-600">Start a new page draft with a title and URL segment.</p>
				</div>
				<span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pages</span>
			</div>

			{#if pageFeedback}
				<div
					class={[
						'rounded-md px-3 py-2 text-sm',
						pageFeedback.tone === 'success'
							? 'border border-green-200 bg-green-50 text-green-800'
							: 'border border-red-200 bg-red-50 text-red-800'
					].join(' ')}
				>
					{pageFeedback.text}
				</div>
			{/if}

			<form
				method="POST"
				action="?/createPage"
				class="flex flex-col gap-3 sm:flex-row sm:items-end"
				use:enhance={({ formElement }) => {
					clearPageFeedback();
					formSubmitting = true;

					return async ({ result, update }) => {
						formSubmitting = false;

						if (result.type === 'success') {
							formElement.reset();
							pageFeedback = {
								tone: 'success',
								text: 'Page created successfully.'
							};
						} else if (result.type === 'failure') {
							pageFeedback = {
								tone: 'error',
								text: 'Failed to create page: ' + (result.data?.error || 'Unknown error')
							};
						}

						await applyAction(result);
						await update({
							reset: true,
							invalidateAll: false
						});

						if (result.type === 'success' && result.data && 'pages' in result.data) {
							pagesStore.set(result.data.pages as Page[]);
						}
					};
				}}
			>
				<div class="flex-1 space-y-3">
					<div class="space-y-1">
						<label for="title" class="text-sm font-medium text-slate-700">Page title</label>
						<input
							id="title"
							type="text"
							name="title"
							placeholder="About us"
							required
							class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
						/>
					</div>
					<div class="space-y-1">
						<label for="slug" class="text-sm font-medium text-slate-700">Page URL</label>
						<input
							id="slug"
							type="text"
							name="slug"
							placeholder="about"
							required
							class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
						/>
						<p class="text-xs text-slate-500">Use the last part of the page path, for example `about`.</p>
					</div>
				</div>
				<button
					type="submit"
					class="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
					disabled={formSubmitting}
				>
					{formSubmitting ? 'Creating...' : 'Create page'}
				</button>
			</form>
		</div>
	</section>

	<section class="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
		<div class="space-y-2">
			<p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Shared content</p>
			<h2 class="text-xl font-semibold tracking-tight text-slate-900">Content lives in Content library</h2>
			<p class="max-w-2xl text-sm leading-6 text-slate-600">
				Dashboard no longer manages folders or content creation. Open Content to create, organize, and edit shared content.
			</p>
		</div>
		<div class="flex flex-col gap-3 sm:flex-row lg:items-center lg:justify-end">
			<div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
				<div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Content items</div>
				<div class="text-2xl font-semibold text-slate-900">{reusableBlockCount}</div>
			</div>
			<a
				href="/content"
				class="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
			>
				Open Content
			</a>
		</div>
	</section>
</main>

{#if pendingDeletePage}
	<button
		type="button"
		aria-label="Close delete page dialog"
		class={[
			'fixed inset-0 z-40 bg-slate-950/40 transition-opacity',
			showDeletePageModal ? 'opacity-100' : 'pointer-events-none opacity-0'
		].join(' ')}
		onclick={closeDeletePageModal}
	></button>
	<div
		class={[
			'fixed inset-x-4 top-24 z-50 mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all',
			showDeletePageModal ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
		].join(' ')}
	>
		<h2 class="text-lg font-semibold text-slate-900">Delete page</h2>
		<p class="mt-2 text-sm text-slate-600">
			{pendingDeletePage
				? `Delete “${pendingDeletePage.title}” at ${displaySlug(pendingDeletePage.slug)}.`
				: ''}
		</p>

		<form
			method="POST"
			action="?/deletePage"
			class="mt-6 flex items-center justify-end gap-2"
			use:enhance={({ formData }) => {
				const slug = String(formData.get('slug') ?? '');
				clearPageFeedback();
				deletingPage = slug;

				return async ({ result, update }) => {
					deletingPage = null;

					if (result.type === 'success') {
						pageFeedback = {
							tone: 'success',
							text: 'Page deleted successfully.'
						};
						closeDeletePageModal();
					} else if (result.type === 'failure') {
						pageFeedback = {
							tone: 'error',
							text: 'Failed to delete page: ' + (result.data?.error || 'Unknown error')
						};
					}

					await applyAction(result);
					await update({
						reset: false,
						invalidateAll: false
					});

					if (result.type === 'success' && result.data && 'pages' in result.data) {
						pagesStore.set(result.data.pages as Page[]);
					}
				};
			}}
		>
			<input type="hidden" name="slug" value={pendingDeletePage.slug} />
			<button
				type="button"
				class="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
				onclick={closeDeletePageModal}
			>
				Cancel
			</button>
			<button
				type="submit"
				class="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
				disabled={deletingPage === pendingDeletePage.slug}
			>
				{deletingPage === pendingDeletePage.slug ? 'Deleting...' : 'Delete page'}
			</button>
		</form>
	</div>
{/if}
