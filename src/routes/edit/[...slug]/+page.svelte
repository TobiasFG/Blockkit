<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { applyAction, enhance } from '$app/forms';
	import { pagesStore } from '$lib/client/pagesStore';
	import BlockListEditor from '$lib/components/cms/BlockListEditor.svelte';
	import { registerReusableBlockInsertHandler } from '$lib/components/cms/reusableBlockInsertion';
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
		slug: string;
		seo: PageSeoMeta;
		content: PageContent;
	};

	type PrimaryActionState = 'validation-error' | 'save-draft' | 'publish' | 'all-saved';

	let { data }: PageProps = $props();

	let page = $state<Page | null>(null);
	let title = $state('');
	let slug = $state('');
	let seo = $state<PageSeoMeta>({ ...EMPTY_PAGE_SEO_META });
	let content = $state<PageContent>(createEditablePageContent(null));
	let reusableBlocks = $state<ReusableBlock[]>([]);
	let formSubmitting = $state(false);
	let publishing = $state(false);
	let successMessage = $state('');
	let errorMessage = $state('');
	let contentErrors = $state<PageContentValidationErrors>({});
	let draggingPath = $state<string | null>(null);
	let canDragBlocks = $state(false);
	let loadedSnapshot = $state<LoadedSnapshot | null>(null);
	let activeTab = $state<'identity' | 'content' | 'discovery'>('content');

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
	const hasDraftChanges = $derived(page ? pageHasDraftChanges(page) : false);
	const publishState = $derived(page ? getPagePublishState(page) : 'unpublished');

	const resetMessages = () => {
		successMessage = '';
		errorMessage = '';
	};

	const displaySlug = (slug: string) => {
		const cleaned = slug.replace(/^\//, '');
		return cleaned.length === 0 ? '/' : `/${cleaned}`;
	};

	const formatTimestamp = (value?: string | null) => (value ? new Date(value).toLocaleString() : '—');
	const inputClass =
		'w-full rounded-2xl border border-stone-300/80 bg-white px-4 py-3 text-sm text-stone-900 shadow-[0_1px_0_rgba(41,37,36,0.04)] outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-4 focus:ring-stone-200/70 disabled:bg-stone-100 disabled:text-stone-500';
	const captionClass = 'text-[10px] font-medium uppercase tracking-[0.24em] text-stone-500';

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
	const primaryActionIntent = $derived(primaryActionState === 'publish' ? 'publish' : 'save');
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
	});

	onMount(() => {
		const mediaQuery = window.matchMedia('(pointer: fine) and (hover: hover) and (min-width: 1024px)');
		const updateDragMode = () => {
			canDragBlocks = mediaQuery.matches;
		};
		const unregisterReusableInsert = registerReusableBlockInsertHandler(({ reusableBlockId }) => {
			insertReusableReference(reusableBlockId, content.blocks.length);
			successMessage = 'Content added to page draft.';
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
		slug = loadedSnapshot.slug;
		seo = { ...loadedSnapshot.seo };
		content = createEditablePageContent(loadedSnapshot.content);
		contentErrors = {};
		draggingPath = null;
		resetMessages();
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

				resetMessages();

				if (!syncContentErrors()) {
					errorMessage =
						intent === 'publish'
							? 'Fix highlighted content fields before publishing.'
							: 'Fix the highlighted content fields before saving.';
					cancel();
					formElement.reportValidity();
					return;
				}

				if (intent === 'publish') {
					if (hasUnsavedChanges) {
						errorMessage = 'Save draft before publishing current page changes.';
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
						successMessage =
							intent === 'publish' ? 'Page published successfully!' : 'Draft saved successfully!';
					} else if (result.type === 'failure') {
						errorMessage =
							intent === 'publish'
								? `Failed to publish page: ${result.data?.error ?? 'Unknown error'}`
								: `Failed to update page: ${result.data?.error ?? 'Unknown error'}`;
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
								<h1 class="max-w-2xl text-[2.6rem] font-semibold tracking-[-0.045em] text-stone-950 sm:text-5xl">
									{title || page.title}
								</h1>
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

                <div
                    class="grid gap-10 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start"
                >
                    <div class="space-y-8">
                        <div class="border-b border-stone-200 pb-4">
                            <div
                                class="inline-flex w-full flex-wrap gap-2 rounded-[1.5rem] bg-stone-100/80 p-1.5"
                            >
                                <button
                                    type="button"
                                    class={`min-h-11 rounded-[1.1rem] px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-200/70 ${
                                        activeTab === "identity"
                                            ? "bg-white text-stone-950 shadow-[0_1px_0_rgba(41,37,36,0.06)]"
                                            : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
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
                                        activeTab === "content"
                                            ? "bg-white text-stone-950 shadow-[0_1px_0_rgba(41,37,36,0.06)]"
                                            : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
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
                                        activeTab === "discovery"
                                            ? "bg-white text-stone-950 shadow-[0_1px_0_rgba(41,37,36,0.06)]"
                                            : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                                    }`}
                                    onclick={() => {
                                        activeTab = 'discovery';
                                    }}
                                >
                                    Discovery &amp; Sharing
                                </button>
                            </div>
                        </div>

                        {#if activeTab === "identity"}
                            <section class="space-y-5">
                                <div class="space-y-2">
                                    <p class={captionClass}>Identity</p>
                                    <h2
                                        class="text-[1.65rem] font-semibold tracking-[-0.035em] text-stone-950"
                                    >
                                        Page name and link
                                    </h2>
                                    <p
                                        class="max-w-[62ch] text-base leading-7 text-stone-600"
                                    >
                                        Choose page name people will recognize.
                                        Change page link only if needed.
                                    </p>
                                </div>

                                <div
                                    class="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]"
                                >
                                    <div class="space-y-2">
                                        <label
                                            for="title"
                                            class="text-sm font-medium text-stone-800"
                                            >Title</label
                                        >
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
                                        <label
                                            for="slug"
                                            class="text-sm font-medium text-stone-800"
                                            >Page link</label
                                        >
                                        <input
                                            id="slug"
                                            type="text"
                                            name="slug"
                                            required
                                            bind:value={slug}
                                            disabled={page.slug === "/"}
                                            class={`${inputClass} font-mono text-[13px]`}
                                        />
                                        <p class="text-sm leading-6 text-stone-500">
                                            {#if page.slug === "/"}
                                                Home page always uses `/`.
                                            {:else}
                                                Use links like `/about` or
                                                `/about/team`.
                                            {/if}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        {/if}

                        {#if activeTab === "content"}
                            <section class="space-y-5">
                                <div class="space-y-2">
                                    <p class={captionClass}>Content</p>
                                    <h2
                                        class="text-[1.65rem] font-semibold tracking-[-0.035em] text-stone-950"
                                    >
                                        Page content
                                    </h2>
                                </div>

                                <div class="border-t border-stone-200 pt-5">
                                    <BlockListEditor
                                        blocks={content.blocks}
                                        location={{
                                            parentPath: null,
                                            fieldKey: null,
                                        }}
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
                                            draggingPath = path.join(".");
                                        }}
                                        onEndDrag={() => {
                                            draggingPath = null;
                                        }}
                                    />

                                    {#if Object.keys(contentErrors).length > 0}
                                        <div
                                            class="mt-5 rounded-2xl border border-red-300/70 bg-red-50 px-4 py-3 text-sm text-red-900"
                                        >
                                            Some content still needs attention
                                            before you can save.
                                        </div>
                                    {/if}
                                </div>
                            </section>
                        {/if}

                        {#if activeTab === "discovery"}
                            <section class="space-y-5">
                                <div class="space-y-2">
                                    <p class={captionClass}>
                                        Discovery &amp; sharing
                                    </p>
                                    <h2
                                        class="text-[1.65rem] font-semibold tracking-[-0.035em] text-stone-950"
                                    >
                                        Search and sharing
                                    </h2>
                                    <p
                                        class="max-w-[62ch] text-base leading-7 text-stone-600"
                                    >
                                        Optional. Change this only if search
                                        results or shared links should show
                                        different text or image.
                                    </p>
                                </div>

                                <div class="space-y-4 border-t border-stone-200 pt-5">
                                    <div class="space-y-2">
                                        <label
                                            for="seoTitle"
                                            class="text-sm font-medium text-stone-800"
                                            >Title for search</label
                                        >
                                        <input
                                            id="seoTitle"
                                            type="text"
                                            name="seoTitle"
                                            bind:value={seo.title}
                                            class={inputClass}
                                        />
                                        <p
                                            class="text-sm leading-6 text-stone-500"
                                        >
                                            Optional. Leave empty to use page
                                            title.
                                        </p>
                                    </div>

                                    <div class="space-y-2">
                                        <label
                                            for="seoDescription"
                                            class="text-sm font-medium text-stone-800"
                                        >
                                            Description for search
                                        </label>
                                        <textarea
                                            id="seoDescription"
                                            name="seoDescription"
                                            rows="4"
                                            bind:value={seo.description}
                                            class={inputClass}
                                        ></textarea>
                                        <p
                                            class="text-sm leading-6 text-stone-500"
                                        >
                                            Short summary people may see under
                                            page title.
                                        </p>
                                    </div>

                                    <div class="space-y-2">
                                        <label
                                            for="canonicalUrl"
                                            class="text-sm font-medium text-stone-800"
                                        >
                                            Preferred link
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
                                        <label
                                            for="ogImageUrl"
                                            class="text-sm font-medium text-stone-800"
                                        >
                                            Image for sharing
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
                                                <span
                                                    class="block font-medium text-stone-950"
                                                    >Hide from search
                                                    results</span
                                                >
                                                <span
                                                    class="mt-1 block leading-6 text-stone-500"
                                                >
                                                    Use for pages that should
                                                    not show up in search.
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
                                                <span
                                                    class="block font-medium text-stone-950"
                                                    >Do not pass link
                                                    signals</span
                                                >
                                                <span
                                                    class="mt-1 block leading-6 text-stone-500"
                                                >
                                                    Use only if links on this
                                                    page should not affect
                                                    search ranking.
                                                </span>
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </section>
                        {/if}
                    </div>

					<aside
						class="border-t border-stone-300/70 pt-8 xl:sticky xl:top-6 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0"
					>
                        <div class="space-y-8">
                            <section
                                class="space-y-4 border-b border-stone-200 pb-8"
                            >
                                <div class="space-y-2">
                                    <p class={captionClass}>Draft panel</p>
                                    <h2
                                        class="text-[1.35rem] font-semibold tracking-[-0.03em] text-stone-950"
                                    >
                                        Save and publish
                                    </h2>
                                </div>

								<div class="space-y-3">
									<div class="flex flex-wrap gap-2">
										<span
											class={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getPublishStateClass(publishState)}`}
										>
											{getPublishStateLabel(publishState)}
										</span>
									</div>

									<div class="space-y-3">
                                    <div
                                        class="flex items-center justify-between gap-3"
                                    >
                                        <span class="text-sm text-stone-600"
                                            >Page link</span
                                        >
                                        <span
                                            class="font-mono text-xs tabular-nums tracking-[0.02em] text-stone-900"
                                            >{displaySlug(page.slug)}</span
                                        >
                                    </div>
									<div
										class="flex items-center justify-between gap-3"
									>
										<span class="text-sm text-stone-600"
											>Draft state</span
										>
										<span
											class="text-sm font-medium text-stone-950"
										>
											{getDraftStateLabel()}
										</span>
									</div>
									<div class="flex items-center justify-between gap-3">
										<span class="text-sm text-stone-600">Last published</span>
										<span class="text-right tabular-nums text-sm text-stone-950">
											{formatTimestamp(page.last_published_at)}
										</span>
									</div>
									</div>
                                </div>

                                <div class="space-y-3">
                                    <button
                                        type="submit"
                                        formaction={primaryActionFormAction}
										data-intent={primaryActionIntent}
                                        class={`inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${primaryActionClass}`}
                                        disabled={primaryActionDisabled}
                                    >
                                        {primaryActionLabel}
									</button>
                                    {#if hasUnsavedChanges}
                                        <button
                                            type="button"
                                            class="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-200/70"
                                            onclick={resetDraft}
                                        >
                                            Reset draft
                                        </button>
                                    {/if}
                                </div>

                                {#if successMessage}
                                    <div
                                        class="rounded-2xl border border-emerald-300/70 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
                                    >
                                        {successMessage}
                                    </div>
                                {/if}

                                {#if errorMessage}
                                    <div
                                        class="rounded-2xl border border-red-300/70 bg-red-50 px-4 py-3 text-sm text-red-950"
                                    >
                                        {errorMessage}
                                    </div>
                                {/if}

								{#if hasUnsavedChanges}
									<p class="text-sm leading-6 text-stone-500">
										Save draft before publishing current page changes.
									</p>
								{/if}
                            </section>

                            <section class="space-y-3">
                                <p class={captionClass}>Page record</p>
                                <div class="space-y-3 text-sm text-stone-700">
                                    <div
                                        class="flex items-center justify-between gap-3"
                                    >
                                        <span class="text-stone-500"
                                            >Created</span
                                        >
                                        <span
                                            class="text-right tabular-nums text-stone-950"
                                            >{formatTimestamp(
                                                page.created_at,
                                            )}</span
                                        >
                                    </div>
                                    <div
                                        class="flex items-center justify-between gap-3"
                                    >
                                        <span class="text-stone-500"
                                            >Updated</span
                                        >
                                        <span
                                            class="text-right tabular-nums text-stone-950"
                                            >{formatTimestamp(
                                                page.updated_at,
                                            )}</span
                                        >
                                    </div>
                                </div>
                            </section>
                        </div>
                    </aside>
                </div>
            </div>
        </form>
    {:else}
        <div
            class="rounded-[1.5rem] border border-dashed border-stone-300/80 bg-stone-50/60 px-6 py-8 text-sm text-stone-600"
        >
            Page not found.
        </div>
    {/if}
</main>
