<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { browser } from '$app/environment';
	import { applyAction, enhance } from '$app/forms';
	import { getToastState } from '$lib/Toasts/toastState.svelte';
	import { pagesStore } from '$lib/client/pagesStore';
	import BlockListEditor from '$lib/components/cms/BlockListEditor.svelte';
	import { registerReusableBlockInsertHandler } from '$lib/components/cms/reusableBlockInsertion';
	import { buildPagePathPreview, isRootPage } from '$lib/pagePath';
	import { getPagePublishState, pageHasDraftChanges } from '$lib/pageStatus';
	import type {
		BlockListLocation,
		BlockPath,
		PageContentValidationErrors
	} from '$lib/pageContentEditor';
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
		parentPageId: string | null;
		urlName: string;
		seo: PageSeoMeta;
		content: PageContent;
		revertTargetLabel: 'draft' | 'published';
	};

	type PrimaryActionState = 'validation-error' | 'save-draft' | 'publish' | 'all-saved';

	let { data }: PageProps = $props();

	let page = $state<Page | null>(null);
	let pages = $state<Page[]>([]);
	let title = $state('');
	let parentPageId = $state<string | null>(null);
	let urlName = $state('');
	let seo = $state<PageSeoMeta>({ ...EMPTY_PAGE_SEO_META });
	let content = $state<PageContent>(createEditablePageContent(null));
	let reusableBlocks = $state<ReusableBlock[]>([]);
	let formSubmitting = $state(false);
	let publishing = $state(false);
	let contentErrors = $state<PageContentValidationErrors>({});
	let draggingPath = $state<string | null>(null);
	let canDragBlocks = $state(false);
	let prefersReducedMotion = $state(false);
	let loadedSnapshot = $state<LoadedSnapshot | null>(null);
	let activeTab = $state<'identity' | 'content' | 'discovery'>('content');

	const toastState = getToastState();
	const serializedContent = $derived(JSON.stringify(content));
	const hasValidationErrors = $derived(Object.keys(contentErrors).length > 0);
	const isRoot = $derived(page ? isRootPage(page) : false);
	const selectableParents = $derived(
		pages.filter((entry) => entry.id !== page?.id).filter((entry) => !entry.path.startsWith(`${page?.path}/`))
	);
	const pathPreview = $derived.by(() => {
		if (!page) return '/';
		if (isRoot) return '/';

		try {
			return buildPagePathPreview({
				pageId: page.id,
				parentPageId,
				title,
				urlName,
				pages
			});
		} catch {
			return page.path;
		}
	});
	const descendantPathChangeWarning = $derived.by(() => {
		if (!page) return false;
		const currentPage = page;
		const currentPrefix = page.path === '/' ? '/' : `${page.path}/`;
		return (
			pages.some((entry) => entry.parent_page_id === currentPage.id) &&
			pathPreview !== currentPage.path &&
			currentPrefix.length > 1
		);
	});
	const hasUnsavedChanges = $derived.by(() => {
		if (!loadedSnapshot) return false;

		return (
			title !== loadedSnapshot.title ||
			parentPageId !== loadedSnapshot.parentPageId ||
			urlName !== loadedSnapshot.urlName ||
			JSON.stringify(seo) !== JSON.stringify(loadedSnapshot.seo) ||
			serializedContent !== JSON.stringify(loadedSnapshot.content)
		);
	});
	const hasDraftChanges = $derived(page ? pageHasDraftChanges(page) : false);
	const publishState = $derived(page ? getPagePublishState(page) : 'unpublished');

	const getRevertTargetLabel = (currentPage: Page | null) => {
		if (!currentPage) return 'draft' as const;
		return currentPage.is_published && !pageHasDraftChanges(currentPage) ? 'published' : 'draft';
	};

	const formatTimestamp = (value?: string | null) => (value ? new Date(value).toLocaleString() : '—');
	const inputClass =
		'w-full rounded-2xl border border-stone-300/80 bg-white px-4 py-3 text-sm text-stone-900 shadow-[0_1px_0_rgba(41,37,36,0.04)] outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-4 focus:ring-stone-200/70 disabled:bg-stone-100 disabled:text-stone-500';
	const captionClass = 'text-[10px] font-medium uppercase tracking-[0.24em] text-stone-500';
	const displayPath = (path: string | null | undefined) => (path && path.trim() ? path : '/');

	const getPublishStateLabel = (state: 'unpublished' | 'published' | 'draft-changes') => {
		switch (state) {
			case 'draft-changes':
				return 'Draft changes';
			case 'published':
				return 'Published';
			default:
				return 'Unpublished';
		}
	};

	const getPublishStateClass = (state: 'unpublished' | 'published' | 'draft-changes') => {
		switch (state) {
			case 'draft-changes':
				return 'bg-sky-100 text-sky-800';
			case 'published':
				return 'bg-emerald-100 text-emerald-800';
			default:
				return 'bg-amber-100 text-amber-800';
		}
	};

	const getDraftStateLabel = () => {
		if (hasUnsavedChanges) return 'Unsaved changes';
		if (hasDraftChanges) return 'Saved draft changes';
		return 'Up to date';
	};

	const primaryActionState = $derived<PrimaryActionState>(
		hasValidationErrors
			? 'validation-error'
			: hasUnsavedChanges
				? 'save-draft'
				: hasDraftChanges
					? 'publish'
					: 'all-saved'
	);
	const primaryActionDisabled = $derived(
		formSubmitting || publishing || primaryActionState === 'validation-error' || primaryActionState === 'all-saved'
	);
	const primaryActionFormAction = $derived(
		primaryActionState === 'publish' ? '?/publishPage' : '?/updatePage'
	);
	const primaryActionLabel = $derived.by(() => {
		if (publishing) return 'Publishing...';
		if (formSubmitting) return 'Saving draft...';

		switch (primaryActionState) {
			case 'validation-error':
				return 'Validation error';
			case 'publish':
				return 'Publish';
			case 'all-saved':
				return 'All changes saved';
			default:
				return 'Save draft';
		}
	});
	const primaryActionClass = $derived(
		primaryActionState === 'publish'
			? 'border border-emerald-300/70 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 focus-visible:ring-emerald-200/70'
			: primaryActionState === 'validation-error'
				? 'bg-red-900 text-red-50 hover:bg-red-900 focus-visible:ring-red-200/70'
				: 'bg-stone-950 text-stone-50 hover:bg-stone-800 focus-visible:ring-stone-300/70'
	);
	const showPrimaryAction = $derived(primaryActionState !== 'all-saved');
	const showRevertAction = $derived(hasUnsavedChanges);
	const actionMotion = $derived({
		y: prefersReducedMotion ? -4 : -10,
		duration: prefersReducedMotion ? 0 : 180
	});

	$effect(() => {
		page = data.page ?? null;
		pages = data.pages ?? [];
		title = data.page?.title ?? '';
		parentPageId = data.page?.parent_page_id ?? null;
		urlName = data.page?.url_name ?? '';
		seo = data.seo ? { ...data.seo } : { ...EMPTY_PAGE_SEO_META };
		content = createEditablePageContent(data.content);
		loadedSnapshot = {
			title: data.page?.title ?? '',
			parentPageId: data.page?.parent_page_id ?? null,
			urlName: data.page?.url_name ?? '',
			seo: data.seo ? { ...data.seo } : { ...EMPTY_PAGE_SEO_META },
			content: createEditablePageContent(data.content),
			revertTargetLabel: getRevertTargetLabel(data.page ?? null)
		};
		reusableBlocks = data.reusableBlocks ?? [];
		contentErrors = {};
	});

	onMount(() => {
		const mediaQuery = window.matchMedia('(pointer: fine) and (hover: hover) and (min-width: 1024px)');
		const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		const updateDragMode = () => {
			canDragBlocks = mediaQuery.matches;
		};
		const updateReducedMotion = () => {
			prefersReducedMotion = reducedMotionQuery.matches;
		};
		const unregisterReusableInsert = registerReusableBlockInsertHandler(({ reusableBlockId }) => {
			insertReusableReference(reusableBlockId, content.blocks.length);
			toastState.success('Content added to page draft.');
		});

		updateDragMode();
		updateReducedMotion();
		mediaQuery.addEventListener('change', updateDragMode);
		reducedMotionQuery.addEventListener('change', updateReducedMotion);

		return () => {
			unregisterReusableInsert();
			mediaQuery.removeEventListener('change', updateDragMode);
			reducedMotionQuery.removeEventListener('change', updateReducedMotion);
		};
	});

	const syncContentErrors = () => {
		contentErrors = validatePageContentEditorState(content, new Set(reusableBlocks.map((block) => block.id)));
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
		parentPageId = loadedSnapshot.parentPageId;
		urlName = loadedSnapshot.urlName;
		seo = { ...loadedSnapshot.seo };
		content = createEditablePageContent(loadedSnapshot.content);
		contentErrors = {};
		draggingPath = null;
	};
</script>

<main class="mx-auto max-w-[96rem] px-4 pb-10 pt-6 sm:px-6 lg:px-8">
	{#if page}
		<form
			method="POST"
			action="?/updatePage"
			class="space-y-6"
			use:enhance={({ formElement, cancel, submitter }) => {
				const intent =
					submitter instanceof HTMLButtonElement ? submitter.dataset.intent ?? 'save' : 'save';

				if (!syncContentErrors()) {
					toastState.error(
						intent === 'publish'
							? 'Fix highlighted content fields before publishing.'
							: 'Fix highlighted content fields before saving.'
					);
					cancel();
					formElement.reportValidity();
					return;
				}

				if (intent === 'publish') {
					if (hasUnsavedChanges) {
						toastState.error('Save draft before publishing current page changes.');
						cancel();
						return;
					}

					publishing = true;
				} else {
					formSubmitting = true;
				}

				return async ({ result, update }) => {
					formSubmitting = false;
					publishing = false;

					if (result.type === 'success') {
						toastState.success(intent === 'publish' ? 'Page published.' : 'Page draft saved.');
					} else if (result.type === 'failure') {
						toastState.error(
							intent === 'publish'
								? `Failed to publish page: ${result.data?.error ?? 'Unknown error'}`
								: `Failed to update page: ${result.data?.error ?? 'Unknown error'}`
						);
					}

					await applyAction(result);
					await update({
						reset: false,
						invalidateAll: false
					});

					if (result.type === 'success' && result.data && 'page' in result.data) {
						page = result.data.page as Page;
						pages = (result.data.pages as Page[]) ?? pages;
						title = page.title;
						parentPageId = page.parent_page_id;
						urlName = page.url_name ?? '';
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
							parentPageId,
							urlName,
							seo: { ...seo },
							content: createEditablePageContent(content),
							revertTargetLabel: getRevertTargetLabel(page)
						};

						if (browser) {
							pagesStore.set(pages);
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
								<h1 class="max-w-2xl text-[2.6rem] font-semibold tracking-[-0.045em] text-stone-950 sm:text-5xl">
									{title || page.title}
								</h1>
								<p class="font-mono text-sm text-stone-600">{displayPath(pathPreview)}</p>
								{#if page.live_path && page.live_path !== pathPreview}
									<p class="text-sm text-stone-500">Live path stays {displayPath(page.live_path)} until related drafts publish.</p>
								{/if}
							</div>
						</div>

						<a
							href="/"
							class="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-200/70"
						>
							Back to pages
						</a>
					</div>
				</header>

				<div class="grid gap-10 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
					<div class="space-y-8">
						<div class="border-b border-stone-200 pb-4">
							<div class="inline-flex w-full flex-wrap gap-2 rounded-[1.5rem] bg-stone-100/80 p-1.5">
								<button
									type="button"
									class={`min-h-11 rounded-[1.1rem] px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-200/70 ${
										activeTab === 'identity'
											? 'bg-white text-stone-950 shadow-[0_1px_0_rgba(41,37,36,0.06)]'
											: 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
									}`}
									onclick={() => {
										activeTab = 'identity';
									}}
								>
									Identity
								</button>
								<button
									type="button"
									class={`min-h-11 rounded-[1.1rem] px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-200/70 ${
										activeTab === 'content'
											? 'bg-white text-stone-950 shadow-[0_1px_0_rgba(41,37,36,0.06)]'
											: 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
									}`}
									onclick={() => {
										activeTab = 'content';
									}}
								>
									Content
								</button>
								<button
									type="button"
									class={`min-h-11 rounded-[1.1rem] px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-200/70 ${
										activeTab === 'discovery'
											? 'bg-white text-stone-950 shadow-[0_1px_0_rgba(41,37,36,0.06)]'
											: 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
									}`}
									onclick={() => {
										activeTab = 'discovery';
									}}
								>
									Discovery &amp; Sharing
								</button>
							</div>
						</div>

						{#if activeTab === 'identity'}
							<section class="space-y-5">
								<div class="space-y-2">
									<p class={captionClass}>Identity</p>
									<h2 class="text-[1.65rem] font-semibold tracking-[-0.035em] text-stone-950">Page name and path</h2>
									<p class="max-w-[62ch] text-base leading-7 text-stone-600">
										Title, parent, URL name all save into draft identity. Publish makes them live together.
									</p>
								</div>

								<div class="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
									<div class="space-y-2">
										<label for="title" class="text-sm font-medium text-stone-800">Title</label>
										<input id="title" type="text" name="title" required bind:value={title} class={inputClass} />
									</div>

									<div class="space-y-2">
										<label for="urlName" class="text-sm font-medium text-stone-800">URL name</label>
										<input
											id="urlName"
											type="text"
											name="urlName"
											bind:value={urlName}
											disabled={isRoot}
											placeholder="about-us"
											class={`${inputClass} font-mono text-[13px]`}
										/>
										<p class="text-sm leading-6 text-stone-500">
											{#if isRoot}
												Root page always uses `/`.
											{:else}
												Optional. Leave empty to derive URL from title.
											{/if}
										</p>
									</div>
								</div>

								<div class="space-y-2">
									<label for="parentPageId" class="text-sm font-medium text-stone-800">Parent page</label>
									{#if isRoot}
										<input value="Root page" disabled class={inputClass} />
									{:else}
										<select id="parentPageId" name="parentPageId" bind:value={parentPageId} class={inputClass}>
											{#each selectableParents as parent (parent.id)}
												<option value={parent.id}>{parent.title} ({displayPath(parent.path)})</option>
											{/each}
										</select>
									{/if}
								</div>

								<div class="rounded-2xl border border-stone-200/80 bg-stone-50 px-4 py-3">
									<p class={captionClass}>Path preview</p>
									<p class="mt-1 font-mono text-sm text-stone-800">{displayPath(pathPreview)}</p>
									{#if descendantPathChangeWarning}
										<p class="mt-2 text-sm text-stone-600">Moving or renaming this page changes child page URLs when published.</p>
									{/if}
								</div>
							</section>
						{/if}

						{#if activeTab === 'content'}
							<section class="space-y-5">
								<div class="space-y-2">
									<p class={captionClass}>Content</p>
									<h2 class="text-[1.65rem] font-semibold tracking-[-0.035em] text-stone-950">Page content</h2>
								</div>

								<div class="border-t border-stone-200 pt-5">
									<BlockListEditor
										blocks={content.blocks}
										location={{ parentPath: null, fieldKey: null }}
										allowedTypes={null}
										errors={contentErrors}
										{draggingPath}
										{canDragBlocks}
										allowInlineBlockCreation={false}
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
											Some content still needs attention before you can save.
										</div>
									{/if}
								</div>
							</section>
						{/if}

						{#if activeTab === 'discovery'}
							<section class="space-y-5">
								<div class="space-y-2">
									<p class={captionClass}>Discovery &amp; sharing</p>
									<h2 class="text-[1.65rem] font-semibold tracking-[-0.035em] text-stone-950">Search and sharing</h2>
									<p class="max-w-[62ch] text-base leading-7 text-stone-600">
										Optional. Change this only if search results or shared links should show different text or image.
									</p>
								</div>

								<div class="space-y-4 border-t border-stone-200 pt-5">
									<div class="space-y-2">
										<label for="seoTitle" class="text-sm font-medium text-stone-800">Title for search</label>
										<input id="seoTitle" type="text" name="seoTitle" bind:value={seo.title} class={inputClass} />
										<p class="text-sm leading-6 text-stone-500">Optional. Leave empty to use page title.</p>
									</div>

									<div class="space-y-2">
										<label for="seoDescription" class="text-sm font-medium text-stone-800">Description for search</label>
										<textarea id="seoDescription" name="seoDescription" rows="4" bind:value={seo.description} class={`${inputClass} min-h-28 resize-y`}></textarea>
									</div>

									<div class="space-y-2">
										<label for="canonicalUrl" class="text-sm font-medium text-stone-800">Preferred link</label>
										<input id="canonicalUrl" type="url" name="canonicalUrl" bind:value={seo.canonicalUrl} class={inputClass} />
									</div>

									<div class="space-y-2">
										<label for="ogImageUrl" class="text-sm font-medium text-stone-800">Image for sharing</label>
										<input id="ogImageUrl" type="url" name="ogImageUrl" bind:value={seo.ogImageUrl} class={inputClass} />
									</div>

									<div class="grid gap-3 sm:grid-cols-2">
										<label class="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
											<input type="checkbox" name="noIndex" bind:checked={seo.noIndex} class="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-300" />
											<span>Hide from search engines</span>
										</label>
										<label class="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
											<input type="checkbox" name="noFollow" bind:checked={seo.noFollow} class="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-300" />
											<span>Disable link following</span>
										</label>
									</div>
								</div>
							</section>
						{/if}
					</div>

					<aside class="space-y-4">
						<section class="rounded-[1.75rem] border border-stone-200/80 bg-white/92 p-5 shadow-[0_22px_60px_-42px_rgba(41,37,36,0.2)]">
							<div class="space-y-2">
								<p class={captionClass}>Draft state</p>
								<h2 class="text-[1.25rem] font-semibold tracking-[-0.03em] text-stone-950">{getDraftStateLabel()}</h2>
								<p class="text-sm leading-6 text-stone-600">
									{#if hasUnsavedChanges}
										Current form changes live only in browser until you save draft.
									{:else if hasDraftChanges}
										Draft differs from published page.
									{:else}
										Draft matches published page.
									{/if}
								</p>
							</div>

							<div class="mt-4 flex flex-col gap-2">
								{#if showPrimaryAction}
									<button
										in:fly={actionMotion}
										out:fly={actionMotion}
										type="submit"
										formaction={primaryActionFormAction}
										data-intent={primaryActionState === 'publish' ? 'publish' : 'save'}
										class={`inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${primaryActionClass}`}
										disabled={primaryActionDisabled}
									>
										{primaryActionLabel}
									</button>
								{/if}
								{#if showRevertAction}
									<button
										in:fly={actionMotion}
										out:fly={actionMotion}
										type="button"
										class="inline-flex min-h-11 items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-200/70 disabled:cursor-not-allowed disabled:opacity-60"
										onclick={resetDraft}
									>
										Revert changes to {loadedSnapshot?.revertTargetLabel ?? 'draft'}
									</button>
								{/if}
							</div>
						</section>

						<section class="rounded-[1.75rem] border border-stone-200/80 bg-white/92 p-5 shadow-[0_22px_60px_-42px_rgba(41,37,36,0.2)]">
							<div class="space-y-2">
								<p class={captionClass}>Publish state</p>
								<div class="flex items-center gap-2">
									<span class={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getPublishStateClass(publishState)}`}>
										{getPublishStateLabel(publishState)}
									</span>
								</div>
								<p class="text-sm leading-6 text-stone-600">Publish uses current saved draft identity, content, SEO.</p>
							</div>

							<div class="mt-4 space-y-3 border-t border-stone-200 pt-4 text-sm text-stone-600">
								<div class="flex items-center justify-between gap-3">
									<span>Draft path</span>
									<span class="font-mono text-xs text-stone-900">{displayPath(pathPreview)}</span>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span>Live path</span>
									<span class="font-mono text-xs text-stone-900">{displayPath(page.live_path)}</span>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span>Last published</span>
									<span class="text-right text-stone-900">{formatTimestamp(page.last_published_at)}</span>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span>Updated</span>
									<span class="text-right text-stone-900">{formatTimestamp(page.updated_at)}</span>
								</div>
							</div>
						</section>
					</aside>
				</div>
			</div>
		</form>
	{/if}
</main>
