<script lang="ts">
	import { browser } from '$app/environment';
	import { applyAction, enhance } from '$app/forms';
	import { flip } from 'svelte/animate';

	import { pagesStore } from '$lib/client/pagesStore';
	import { buildEditPagePath, buildPagePathPreview, isRootPage } from '$lib/pagePath';
	import { getPagePublishState, pageHasDraftChanges } from '$lib/pageStatus';
	import type { Page } from '$lib/types';
	import type { PageProps } from './$types';

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
	let createTitle = $state('');
	let createUrlName = $state('');
	let createParentPageId = $state('');

	const dateFormatter = new Intl.DateTimeFormat('en', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});

	const captionClass = 'text-[10px] font-medium uppercase tracking-[0.24em] text-stone-500';
	const panelClass =
		'rounded-[1.75rem] border border-stone-200/80 bg-white/92 p-5 shadow-[0_22px_60px_-42px_rgba(41,37,36,0.2)]';
	const inputClass =
		'w-full rounded-2xl border border-stone-300/80 bg-white px-4 py-3 text-sm text-stone-900 shadow-[0_1px_0_rgba(41,37,36,0.04)] outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-4 focus:ring-stone-200/70';

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

	const editHref = (pageId: string) => buildEditPagePath(pageId);
	const displayPath = (path: string | null | undefined) => (path && path.trim() ? path : '/');
	const displayDate = (value: string) => dateFormatter.format(new Date(value));
	const createPathPreview = $derived.by(() => {
		if (!createParentPageId) return '/';

		try {
			return buildPagePathPreview({
				pageId: '__new__',
				parentPageId: createParentPageId,
				title: createTitle,
				urlName: createUrlName,
				pages
			});
		} catch {
			return '/';
		}
	});
	const getPublishStateLabel = (page: Page) => {
		const state = getPagePublishState(page);
		if (state === 'draft-changes') return 'Draft changes';
		if (state === 'published') return 'Published';
		return 'Unpublished';
	};
	const getPublishStateClass = (page: Page) => {
		const state = getPagePublishState(page);
		if (state === 'draft-changes') return 'bg-sky-100 text-sky-800';
		if (state === 'published') return 'bg-emerald-100 text-emerald-800';
		return 'bg-amber-100 text-amber-800';
	};

	$effect(() => {
		if (browser) {
			pagesStore.set(data.pages ?? []);
		}

		if (!createParentPageId) {
			createParentPageId = (data.pages ?? []).find((page) => isRootPage(page))?.id ?? '';
		}
	});
</script>

<main class="mx-auto max-w-[96rem] px-4 pb-10 pt-6 sm:px-6 lg:px-8">
	<div class="space-y-8">
		<header class="border-b border-stone-300/70 pb-8">
			<div class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
				<div class="space-y-5">
					<div class="space-y-2">
						<p class={captionClass}>Dashboard</p>
						<h1 class="max-w-3xl text-[2.6rem] font-semibold tracking-[-0.045em] text-stone-950 sm:text-5xl">
							Pages first. Shared content stays close, not loud.
						</h1>
						<p class="max-w-[66ch] text-base leading-7 text-stone-600">
							Open draft work first, create next page fast, leave shared content structure to dedicated Content library.
						</p>
					</div>

					<div class="flex flex-wrap gap-6 border-t border-stone-200 pt-5">
						<div class="space-y-1">
							<p class={captionClass}>Pages</p>
							<p class="text-3xl font-semibold tracking-[-0.04em] text-stone-950">{dashboardPages.length}</p>
						</div>
						<div class="space-y-1">
							<p class={captionClass}>Draft work</p>
							<p class="text-3xl font-semibold tracking-[-0.04em] text-stone-950">{draftPageCount}</p>
						</div>
						<div class="space-y-1">
							<p class={captionClass}>Content items</p>
							<p class="text-3xl font-semibold tracking-[-0.04em] text-stone-950">{reusableBlockCount}</p>
						</div>
					</div>
				</div>

				<section id="create" class={`${panelClass} scroll-mt-20`}>
					<div class="space-y-1">
						<p class={captionClass}>New page</p>
						<h2 class="text-[1.35rem] font-semibold tracking-[-0.03em] text-stone-950">Create next draft</h2>
						<p class="text-sm leading-6 text-stone-600">Start with page name, parent, optional URL override.</p>
					</div>

					{#if pageFeedback}
						<div
							class={[
								'mt-4 rounded-2xl px-4 py-3 text-sm',
								pageFeedback.tone === 'success'
									? 'border border-emerald-300/70 bg-emerald-50 text-emerald-950'
									: 'border border-red-300/70 bg-red-50 text-red-950'
							].join(' ')}
						>
							{pageFeedback.text}
						</div>
					{/if}

					<form
						method="POST"
						action="?/createPage"
						class="mt-5 space-y-4"
						use:enhance={({ formElement }) => {
							clearPageFeedback();
							formSubmitting = true;

							return async ({ result, update }) => {
								formSubmitting = false;

								if (result.type === 'success') {
									formElement.reset();
									createTitle = '';
									createUrlName = '';
									createParentPageId = pages.find((page) => isRootPage(page))?.id ?? '';
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
						<div class="space-y-2">
							<label for="title" class="text-sm font-medium text-stone-800">Page title</label>
							<input
								id="title"
								type="text"
								name="title"
								placeholder="About us"
								required
								bind:value={createTitle}
								class={inputClass}
							/>
						</div>
						<div class="space-y-2">
							<label for="parentPageId" class="text-sm font-medium text-stone-800">Parent page</label>
							<select
								id="parentPageId"
								name="parentPageId"
								required
								bind:value={createParentPageId}
								class={inputClass}
							>
								{#each pages as page (page.id)}
									<option value={page.id}>{page.title} ({displayPath(page.path)})</option>
								{/each}
							</select>
						</div>
						<div class="space-y-2">
							<label for="urlName" class="text-sm font-medium text-stone-800">URL name</label>
							<input
								id="urlName"
								type="text"
								name="urlName"
								placeholder="about-us"
								bind:value={createUrlName}
								class={`${inputClass} font-mono text-[13px]`}
							/>
							<p class="text-sm leading-6 text-stone-500">Optional. Leave empty to derive URL from title.</p>
						</div>
						<div class="rounded-2xl border border-stone-200/80 bg-stone-50 px-4 py-3">
							<p class={captionClass}>Path preview</p>
							<p class="mt-1 font-mono text-sm text-stone-800">{displayPath(createPathPreview)}</p>
						</div>
						<button
							type="submit"
							class="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-300/70 disabled:cursor-not-allowed disabled:opacity-70"
							disabled={formSubmitting}
						>
							{formSubmitting ? 'Creating...' : 'Create page'}
						</button>
					</form>
				</section>
			</div>
		</header>

		<section class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
			<div class="space-y-5">
				<div class="flex flex-col gap-3 border-b border-stone-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
					<div class="space-y-2">
						<p class={captionClass}>Pages</p>
						<h2 class="text-[1.7rem] font-semibold tracking-[-0.035em] text-stone-950">Open current page work</h2>
						<p class="max-w-[62ch] text-base leading-7 text-stone-600">
							Draft changes sort first, then most recently updated pages.
						</p>
					</div>
					<span class="text-sm font-medium text-stone-500">{dashboardPages.length} total</span>
				</div>

				{#if dashboardPages.length > 0}
					<ul class="divide-y divide-stone-200 border-t border-stone-200">
						{#each dashboardPages as page (page.id)}
							<li animate:flip={{ duration: 300 }} class="py-5">
								<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
									<div class="min-w-0 space-y-2">
										<div class="flex flex-wrap items-center gap-2">
											<h3 class="text-[1.12rem] font-semibold tracking-[-0.02em] text-stone-950">{page.title}</h3>
											<span class={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getPublishStateClass(page)}`}>
												{getPublishStateLabel(page)}
											</span>
										</div>
										<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-500">
											<span class="font-mono text-[12px] text-stone-600">{displayPath(page.path)}</span>
											{#if page.live_path && page.live_path !== page.path}
												<span>Live path {displayPath(page.live_path)}</span>
											{/if}
											<span>Updated {displayDate(page.updated_at)}</span>
											{#if page.last_published_at}
												<span>Live {displayDate(page.last_published_at)}</span>
											{/if}
										</div>
									</div>
									<div class="flex items-center gap-2 sm:justify-end">
										<a
											href={editHref(page.id)}
											class="inline-flex min-h-10 items-center justify-center rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-300/70"
										>
											Edit
										</a>
										{#if !isRootPage(page)}
											<button
												type="button"
												class="inline-flex min-h-10 items-center justify-center rounded-full border border-red-300/70 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200/70 disabled:cursor-not-allowed disabled:opacity-60"
												disabled={deletingPage === page.id}
												onclick={() => openDeletePageModal(page)}
											>
												{deletingPage === page.id ? 'Deleting...' : 'Delete'}
											</button>
										{/if}
									</div>
								</div>
							</li>
						{/each}
					</ul>
				{:else}
					<div class="rounded-[1.5rem] border border-dashed border-stone-300/80 bg-stone-50/60 px-6 py-8 text-sm text-stone-600">
						No pages yet. Create first page draft to start building site structure.
					</div>
				{/if}
			</div>

			<aside class={panelClass}>
				<div class="space-y-2">
					<p class={captionClass}>Content library</p>
					<h2 class="text-[1.35rem] font-semibold tracking-[-0.03em] text-stone-950">Shared content stays separate</h2>
					<p class="text-sm leading-6 text-stone-600">
						Use Content library to create, organize, and update reusable content items without crowding page workflow.
					</p>
				</div>

				<div class="mt-4 space-y-3 border-t border-stone-200 pt-4">
					<div class="flex items-center justify-between gap-3">
						<span class="text-sm text-stone-600">Content items</span>
						<span class="text-lg font-semibold text-stone-950">{reusableBlockCount}</span>
					</div>
					<div class="flex items-center justify-between gap-3">
						<span class="text-sm text-stone-600">Home page</span>
						<span class="font-mono text-xs text-stone-900">/</span>
					</div>
				</div>

				<a
					href="/content"
					class="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-200/70"
				>
					Open Content
				</a>
			</aside>
		</section>
	</div>
</main>

{#if pendingDeletePage}
	<button
		type="button"
		aria-label="Close delete page dialog"
		class={[
			'fixed inset-0 z-40 bg-stone-950/40 transition-opacity',
			showDeletePageModal ? 'opacity-100' : 'pointer-events-none opacity-0'
		].join(' ')}
		onclick={closeDeletePageModal}
	></button>
	<div
		class={[
			'fixed inset-x-4 top-24 z-50 mx-auto max-w-lg rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-[0_32px_90px_-48px_rgba(41,37,36,0.42)] transition-all',
			showDeletePageModal ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
		].join(' ')}
	>
		<p class={captionClass}>Delete page</p>
		<h2 class="mt-2 text-[1.35rem] font-semibold tracking-[-0.03em] text-stone-950">Remove page draft</h2>
		<p class="mt-2 text-sm leading-6 text-stone-600">
			{pendingDeletePage ? `Delete “${pendingDeletePage.title}” at ${displayPath(pendingDeletePage.path)}.` : ''}
		</p>

		<form
			method="POST"
			action="?/deletePage"
			class="mt-6 flex items-center justify-end gap-2"
			use:enhance={({ formData }) => {
				const pageId = String(formData.get('pageId') ?? '');
				clearPageFeedback();
				deletingPage = pageId;

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
			<input type="hidden" name="pageId" value={pendingDeletePage.id} />
			<button
				type="button"
				class="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-200/70"
				onclick={closeDeletePageModal}
			>
				Cancel
			</button>
			<button
				type="submit"
				class="inline-flex items-center rounded-full border border-red-300/70 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200/70 disabled:cursor-not-allowed disabled:opacity-60"
				disabled={deletingPage === pendingDeletePage.id}
			>
				{deletingPage === pendingDeletePage.id ? 'Deleting...' : 'Delete page'}
			</button>
		</form>
	</div>
{/if}
