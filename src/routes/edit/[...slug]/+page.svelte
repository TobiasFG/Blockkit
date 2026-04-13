<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { applyAction, enhance } from '$app/forms';
	import { pagesStore } from '$lib/client/pagesStore';
	import BlockListEditor from '$lib/components/cms/BlockListEditor.svelte';
	import { registerReusableBlockInsertHandler } from '$lib/components/cms/reusableBlockInsertion';
	import type { BlockListLocation, BlockPath, PageContentValidationErrors } from '$lib/pageContentEditor';
	import {
		addBlockAtPath,
		createEditablePageContent,
		insertReusableBlockReferenceAtIndex,
		moveBlock,
		removeBlockAtPath,
		updateBlockFieldValue,
		validatePageContentEditorState
	} from '$lib/pageContentEditor';
	import type { BlockValue, PageContent } from '$lib/pageContent';
	import { EMPTY_PAGE_SEO_META, type PageSeoMeta } from '$lib/pageSeoMeta';
	import type { Page, ReusableBlock } from '$lib/types';
	import type { PageProps } from './$types';

	type LoadedSnapshot = {
		title: string;
		slug: string;
		seo: PageSeoMeta;
		content: PageContent;
	};

	let { data }: PageProps = $props();

	let page = $state<Page | null>(null);
	let title = $state('');
	let slug = $state('');
	let seo = $state<PageSeoMeta>({ ...EMPTY_PAGE_SEO_META });
	let content = $state<PageContent>(createEditablePageContent(null));
	let reusableBlocks = $state<ReusableBlock[]>([]);
	let formSubmitting = $state(false);
	let successMessage = $state('');
	let errorMessage = $state('');
	let contentErrors = $state<PageContentValidationErrors>({});
	let draggingPath = $state<string | null>(null);
	let canDragBlocks = $state(false);
	let loadedSnapshot = $state<LoadedSnapshot | null>(null);
	let seoExpanded = $state(false);

	const serializedContent = $derived(JSON.stringify(content));
	const hasValidationErrors = $derived(Object.keys(contentErrors).length > 0);
	const hasUnsavedChanges = $derived.by(() => {
		if (!loadedSnapshot) return false;

		return (
			title !== loadedSnapshot.title ||
			slug !== loadedSnapshot.slug ||
			JSON.stringify(seo) !== JSON.stringify(loadedSnapshot.seo) ||
			serializedContent !== JSON.stringify(loadedSnapshot.content)
		);
	});

	const resetMessages = () => {
		successMessage = '';
		errorMessage = '';
	};

	const displaySlug = (slug: string) => {
		const cleaned = slug.replace(/^\//, '');
		return cleaned.length === 0 ? '/' : `/${cleaned}`;
	};

	const formatTimestamp = (value?: string | null) =>
		value ? new Date(value).toLocaleString() : '—';

	const inputClass =
		'w-full rounded-2xl border border-stone-300/80 bg-white px-4 py-3 text-sm text-stone-900 shadow-[0_1px_0_rgba(41,37,36,0.04)] outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-4 focus:ring-stone-200/70 disabled:bg-stone-100 disabled:text-stone-500';

	const captionClass = 'text-[11px] font-semibold uppercase tracking-[0.3em] text-stone-500';

	$effect(() => {
		page = data.page ?? null;
		title = data.page?.title ?? '';
		slug = data.page?.slug ?? '';
		seo = data.seo ? { ...data.seo } : { ...EMPTY_PAGE_SEO_META };
		content = createEditablePageContent(data.content);
		loadedSnapshot = {
			title: data.page?.title ?? '',
			slug: data.page?.slug ?? '',
			seo: data.seo ? { ...data.seo } : { ...EMPTY_PAGE_SEO_META },
			content: createEditablePageContent(data.content)
		};
		reusableBlocks = data.reusableBlocks ?? [];
		contentErrors = {};
		seoExpanded = false;
	});

	onMount(() => {
		const mediaQuery = window.matchMedia('(pointer: fine) and (hover: hover) and (min-width: 1024px)');
		const updateDragMode = () => {
			canDragBlocks = mediaQuery.matches;
		};
		const unregisterReusableInsert = registerReusableBlockInsertHandler(({ reusableBlockId }) => {
			insertReusableReference(reusableBlockId, content.blocks.length);
			successMessage = 'Reusable block added to the page draft.';
			errorMessage = '';
		});

		updateDragMode();
		mediaQuery.addEventListener('change', updateDragMode);

		return () => {
			unregisterReusableInsert();
			mediaQuery.removeEventListener('change', updateDragMode);
		};
	});

	const syncContentErrors = () => {
		contentErrors = validatePageContentEditorState(
			content,
			new Set(reusableBlocks.map((block) => block.id))
		);
		return Object.keys(contentErrors).length === 0;
	};

	const createBlockId = () =>
		typeof crypto !== 'undefined' && 'randomUUID' in crypto
			? crypto.randomUUID()
			: `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

	const addBlock = (location: BlockListLocation, type: string) => {
		content = addBlockAtPath(content, location, type, createBlockId());
		syncContentErrors();
	};

	const insertReusableReference = (reusableBlockId: string, index: number) => {
		content = insertReusableBlockReferenceAtIndex(content, reusableBlockId, createBlockId(), index);
		syncContentErrors();
	};

	const removeBlock = (path: BlockPath) => {
		content = removeBlockAtPath(content, path);
		syncContentErrors();
	};

	const reorderBlock = (path: BlockPath, toIndex: number) => {
		content = moveBlock(content, path, toIndex);
		syncContentErrors();
	};

	const updateField = (path: BlockPath, fieldKey: string, value: BlockValue | undefined) => {
		content = updateBlockFieldValue(content, path, fieldKey, value);
		syncContentErrors();
	};

	const resetDraft = () => {
		if (!loadedSnapshot) return;

		title = loadedSnapshot.title;
		slug = loadedSnapshot.slug;
		seo = { ...loadedSnapshot.seo };
		content = createEditablePageContent(loadedSnapshot.content);
		contentErrors = {};
		draggingPath = null;
		seoExpanded = false;
		resetMessages();
	};
</script>

<main class="mx-auto max-w-[96rem] px-4 pb-10 pt-6 sm:px-6 lg:px-8">
	{#if page}
		<form
			method="POST"
			action="?/updatePage"
			class="space-y-6"
			use:enhance={({ formElement, cancel }) => {
				resetMessages();
				if (!syncContentErrors()) {
					errorMessage = 'Fix the highlighted content fields before saving.';
					cancel();
					formElement.reportValidity();
					return;
				}

				formSubmitting = true;

				return async ({ result, update }) => {
					formSubmitting = false;

					if (result.type === 'success') {
						successMessage = 'Page updated successfully!';
					} else if (result.type === 'failure') {
						errorMessage = `Failed to update page: ${result.data?.error ?? 'Unknown error'}`;
					}

					await applyAction(result);
					await update({
						reset: false,
						invalidateAll: false
					});

					if (result.type === 'success' && result.data && 'page' in result.data) {
						page = result.data.page as Page;
						title = page.title;
						slug = page.slug;
						if ('seo' in result.data && result.data.seo) {
							seo = { ...(result.data.seo as PageSeoMeta) };
						}
						if ('content' in result.data && result.data.content) {
							content = createEditablePageContent(result.data.content as PageContent);
							contentErrors = {};
						}
						if ('reusableBlocks' in result.data && result.data.reusableBlocks) {
							reusableBlocks = result.data.reusableBlocks as ReusableBlock[];
						}
						loadedSnapshot = {
							title,
							slug,
							seo: { ...seo },
							content: createEditablePageContent(content)
						};

						if (browser) {
							pagesStore.update((current) =>
								current ? current.map((item) => (item.id === page?.id ? page : item)) : current
							);
						}
					}

					formElement.reportValidity();
				};
			}}
		>
			<input type="hidden" name="content" value={serializedContent} />

			<div class="space-y-8">
				<header class="border-b border-stone-300/70 pb-8">
					<div class="flex flex-wrap items-start justify-between gap-6">
						<div class="max-w-3xl space-y-3">
							<p class={captionClass}>Page editor</p>
							<div class="space-y-2">
								<h1 class="max-w-2xl text-4xl font-black tracking-[-0.04em] text-stone-950">
									{title || page.title}
								</h1>
								<p class="max-w-2xl text-sm leading-6 text-stone-600">
									Shape draft content first. Route settings and search metadata stay close, but out of the way.
								</p>
							</div>
						</div>

						<a
							href="/"
							class="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
						>
							Back to pages
						</a>
					</div>
				</header>

				<div class="grid gap-10 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
					<div class="space-y-12">
						<section class="space-y-5">
							<div class="space-y-2">
									<p class={captionClass}>Page identity</p>
								<h2 class="text-2xl font-black tracking-[-0.03em] text-stone-950">
									Title and route
								</h2>
								<p class="max-w-2xl text-sm leading-6 text-stone-600">
									Keep naming clear for editors. Use route changes sparingly because they affect where this page lives.
								</p>
							</div>

							<div class="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
								<div class="space-y-2">
									<label for="title" class="text-sm font-semibold text-stone-800">Title</label>
									<input
										id="title"
										type="text"
										name="title"
										required
										bind:value={title}
										class={inputClass}
									/>
								</div>

								<div class="space-y-2">
									<label for="slug" class="text-sm font-semibold text-stone-800">Route slug</label>
									<input
										id="slug"
										type="text"
										name="slug"
										required
										bind:value={slug}
										disabled={page.slug === '/'}
										class={`${inputClass} font-mono text-[13px]`}
									/>
									<p class="text-xs leading-5 text-stone-500">
										{#if page.slug === '/'}
											The root page always uses `/`.
										{:else}
											Use `/segment` or nested paths like `/about/team`.
										{/if}
									</p>
								</div>
							</div>
						</section>

						<section class="space-y-5">
							<div class="space-y-2">
									<p class={captionClass}>Page body</p>
								<h2 class="text-2xl font-black tracking-[-0.03em] text-stone-950">Content</h2>
								<p class="max-w-2xl text-sm leading-6 text-stone-600">
									Build draft page body from registered blocks. Reuse shared content only when it should stay linked across pages.
								</p>
							</div>

							<div class="border-t border-stone-200 pt-5">
								<BlockListEditor
									blocks={content.blocks}
									location={{ parentPath: null, fieldKey: null }}
									allowedTypes={null}
									title="Draft blocks"
									description="Add, reorder, and refine content blocks."
									errors={contentErrors}
									{draggingPath}
									{canDragBlocks}
									onAddBlock={addBlock}
									onInsertReusableBlockReference={insertReusableReference}
									onRemoveBlock={removeBlock}
									onMoveBlock={reorderBlock}
									onUpdateField={updateField}
									{reusableBlocks}
									onStartDrag={(path) => {
										draggingPath = path.join('.');
									}}
									onEndDrag={() => {
										draggingPath = null;
									}}
								/>

								{#if Object.keys(contentErrors).length > 0}
									<div class="mt-5 rounded-2xl border border-red-300/70 bg-red-50 px-4 py-3 text-sm text-red-900">
										Content has validation errors. Review marked block fields before saving.
									</div>
								{/if}
							</div>
						</section>
					</div>

					<aside class="border-t border-stone-300/70 pt-8 xl:sticky xl:top-6 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0">
						<div class="space-y-8">
							<section class="space-y-4 border-b border-stone-200 pb-8">
								<div class="space-y-2">
										<p class={captionClass}>Draft panel</p>
									<h2 class="text-xl font-black tracking-[-0.03em] text-stone-950">Save and review</h2>
								</div>

								<div class="space-y-3">
									<div class="flex items-center justify-between gap-3">
										<span class="text-sm font-medium text-stone-600">Current route</span>
										<span class="font-mono text-[11px] uppercase tracking-[0.14em] text-stone-900">{displaySlug(page.slug)}</span>
									</div>
									<div class="flex items-center justify-between gap-3">
										<span class="text-sm font-medium text-stone-600">Draft state</span>
										<span class="text-sm font-semibold text-stone-950">
											{hasUnsavedChanges ? 'Unsaved changes' : 'Up to date'}
										</span>
									</div>
									<div class="flex items-center justify-between gap-3">
										<span class="text-sm font-medium text-stone-600">Validation</span>
										<span class={`text-sm font-semibold ${hasValidationErrors ? 'text-red-900' : 'text-emerald-900'}`}>
											{hasValidationErrors ? 'Needs attention' : 'Ready to save'}
										</span>
									</div>
								</div>

								<div class="space-y-3">
									<button
										type="submit"
										class="inline-flex w-full items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
										disabled={formSubmitting}
									>
										{formSubmitting ? 'Saving...' : 'Save changes'}
									</button>
									{#if hasUnsavedChanges}
										<button
											type="button"
											class="inline-flex w-full items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
											onclick={resetDraft}
										>
											Reset draft
										</button>
									{/if}
								</div>

								{#if successMessage}
									<div class="rounded-2xl border border-emerald-300/70 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
										{successMessage}
									</div>
								{/if}

								{#if errorMessage}
									<div class="rounded-2xl border border-red-300/70 bg-red-50 px-4 py-3 text-sm text-red-950">
										{errorMessage}
									</div>
								{/if}
							</section>

							<section class="space-y-4 border-b border-stone-200 pb-8">
								<details bind:open={seoExpanded} class="group">
									<summary class="flex cursor-pointer list-none items-start justify-between gap-4 rounded-[1.25rem] text-left outline-none marker:hidden">
										<div class="space-y-1">
											<p class={captionClass}>Discovery and sharing</p>
											<h3 class="text-lg font-black tracking-[-0.03em] text-stone-950">
												Search appearance
											</h3>
											<p class="max-w-[24ch] text-sm leading-5 text-stone-600">
												Optional. Open when you need Google or link-preview control.
											</p>
										</div>
										<div class="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-600 transition group-open:bg-stone-950 group-open:text-stone-50">
											{seoExpanded ? 'Hide' : 'Edit'}
										</div>
									</summary>

									<div class="mt-4 space-y-4 border-t border-stone-200 pt-4">
										<div class="space-y-2">
											<label for="seoTitle" class="text-sm font-semibold text-stone-800">Search title</label>
											<input
												id="seoTitle"
												type="text"
												name="seoTitle"
												bind:value={seo.title}
												class={inputClass}
											/>
											<p class="text-xs leading-5 text-stone-500">
												Optional. Leave blank to reuse page title in search results.
											</p>
										</div>

										<div class="space-y-2">
											<label for="seoDescription" class="text-sm font-semibold text-stone-800">
												Search description
											</label>
											<textarea
												id="seoDescription"
												name="seoDescription"
												rows="4"
												bind:value={seo.description}
												class={inputClass}
											></textarea>
											<p class="text-xs leading-5 text-stone-500">
												Write short summary people may see under page title in search results.
											</p>
										</div>

										<div class="space-y-2">
											<label for="canonicalUrl" class="text-sm font-semibold text-stone-800">
												Preferred page URL
											</label>
											<input
												id="canonicalUrl"
												type="url"
												name="canonicalUrl"
												bind:value={seo.canonicalUrl}
												class={inputClass}
											/>
										</div>

										<div class="space-y-2">
											<label for="ogImageUrl" class="text-sm font-semibold text-stone-800">
												Sharing image URL
											</label>
											<input
												id="ogImageUrl"
												type="url"
												name="ogImageUrl"
												bind:value={seo.ogImageUrl}
												class={inputClass}
											/>
										</div>

										<div class="space-y-3">
											<label
												for="noIndex"
												class="flex items-start gap-3 rounded-2xl border border-stone-300/80 bg-stone-50 px-4 py-3 text-sm text-stone-700"
											>
												<input
													id="noIndex"
													type="checkbox"
													name="noIndex"
													bind:checked={seo.noIndex}
													class="mt-0.5 h-4 w-4 rounded border-stone-400 text-stone-950 focus:ring-stone-300"
												/>
												<span>
													<span class="block font-semibold text-stone-950">Hide from search results</span>
													<span class="mt-1 block text-stone-500">
														Use for private, utility, or staging pages that should not appear in search.
													</span>
												</span>
											</label>

											<label
												for="noFollow"
												class="flex items-start gap-3 rounded-2xl border border-stone-300/80 bg-stone-50 px-4 py-3 text-sm text-stone-700"
											>
												<input
													id="noFollow"
													type="checkbox"
													name="noFollow"
													bind:checked={seo.noFollow}
													class="mt-0.5 h-4 w-4 rounded border-stone-400 text-stone-950 focus:ring-stone-300"
												/>
												<span>
													<span class="block font-semibold text-stone-950">Do not pass link signals</span>
													<span class="mt-1 block text-stone-500">
														Use only when links on this page should not influence search engines.
													</span>
												</span>
											</label>
										</div>
									</div>
								</details>
							</section>

							<section class="space-y-3">
								<p class={captionClass}>Page record</p>
								<div class="space-y-3 text-sm text-stone-700">
									<div class="flex items-center justify-between gap-3">
										<span class="text-stone-500">Created</span>
										<span class="text-right text-stone-950">{formatTimestamp(page.created_at)}</span>
									</div>
									<div class="flex items-center justify-between gap-3">
										<span class="text-stone-500">Updated</span>
										<span class="text-right text-stone-950">{formatTimestamp(page.updated_at)}</span>
									</div>
								</div>
							</section>
						</div>
					</aside>
				</div>
			</div>
		</form>
	{:else}
		<div class="rounded-[1.5rem] border border-dashed border-stone-300/80 bg-stone-50/60 px-6 py-8 text-sm text-stone-600">
			Page not found.
		</div>
	{/if}
</main>
