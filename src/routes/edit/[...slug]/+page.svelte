<script lang="ts">
	import { browser } from '$app/environment';
	import { applyAction, enhance } from '$app/forms';
	import { pagesStore } from '$lib/client/pagesStore';
	import BlockListEditor from '$lib/components/cms/BlockListEditor.svelte';
	import type { BlockListLocation, BlockPath, PageContentValidationErrors } from '$lib/pageContentEditor';
	import {
		addBlockAtPath,
		addReusableBlockReference,
		createEditablePageContent,
		moveBlock,
		removeBlockAtPath,
		updateBlockFieldValue,
		validatePageContentEditorState
	} from '$lib/pageContentEditor';
	import type { BlockValue, PageContent } from '$lib/pageContent';
	import { EMPTY_PAGE_SEO_META, type PageSeoMeta } from '$lib/pageSeoMeta';
	import type { Page, ReusableBlock } from '$lib/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let page = $state<Page | null>(null);
	let title = $state('');
	let slug = $state('');
	let seo = $state<PageSeoMeta>({ ...EMPTY_PAGE_SEO_META });
	let content = $state<PageContent>(createEditablePageContent(data.content));
	let reusableBlocks = $state<ReusableBlock[]>(data.reusableBlocks ?? []);
	let formSubmitting = $state(false);
	let successMessage = $state('');
	let errorMessage = $state('');
	let contentErrors = $state<PageContentValidationErrors>({});
	let draggingPath = $state<string | null>(null);

	const serializedContent = $derived(JSON.stringify(content));

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

	$effect(() => {
		page = data.page ?? null;
		title = data.page?.title ?? '';
		slug = data.page?.slug ?? '';
		seo = data.seo ? { ...data.seo } : { ...EMPTY_PAGE_SEO_META };
		content = createEditablePageContent(data.content);
		reusableBlocks = data.reusableBlocks ?? [];
		contentErrors = {};
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

	const addReusableReference = (reusableBlockId: string) => {
		content = addReusableBlockReference(content, reusableBlockId, createBlockId());
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
</script>

<main class="mx-auto max-w-4xl space-y-6">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="space-y-2">
			<h1 class="text-3xl font-bold text-slate-900">
				{page ? `Editing: ${page.title}` : 'Edit page'}
			</h1>
			{#if page}
				<p class="text-slate-700">
					Route:
					<span class="font-mono text-sm text-slate-600">{displaySlug(page.slug)}</span>
				</p>
			{/if}
		</div>
		<a
			href="/"
			class="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
		>
			Back to pages
		</a>
	</div>

	<section class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
		{#if page}
			<div class="space-y-4">
				<div class="space-y-2">
					<h2 class="text-lg font-semibold text-slate-900">Page details</h2>
					<p class="text-sm text-slate-600">
						Update the page title, slug, draft SEO metadata, and draft page content.
					</p>
				</div>

				{#if successMessage}
					<div
						class="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
					>
						{successMessage}
					</div>
				{/if}

				{#if errorMessage}
					<div class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
						{errorMessage}
					</div>
				{/if}

				<form
					method="POST"
					action="?/updatePage"
					class="grid gap-4"
					use:enhance={({ formElement, cancel }) => {
						resetMessages();
						if (!syncContentErrors()) {
							errorMessage = 'Fix the content validation errors before saving.';
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

								if (browser) {
									pagesStore.update((current) =>
										current
											? current.map((item) => (item.id === page?.id ? page : item))
											: current
									);
								}
							}

							formElement.reportValidity();
						};
					}}
				>
					<div class="space-y-1">
						<label for="title" class="text-sm font-medium text-slate-700">Title</label>
						<input
							id="title"
							type="text"
							name="title"
							required
							bind:value={title}
							class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
						/>
					</div>

					<div class="space-y-1">
						<label for="slug" class="text-sm font-medium text-slate-700">Slug</label>
						<input
							id="slug"
							type="text"
							name="slug"
							required
							bind:value={slug}
							disabled={page.slug === '/'}
							class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50 disabled:text-slate-500"
						/>
						<p class="text-xs text-slate-500">
							{#if page.slug === '/'}
								The root page always uses `/`.
							{:else}
								Use `/segment` or nested paths like `/about/team`.
							{/if}
						</p>
					</div>

					<div class="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
						<div class="space-y-2">
							<h3 class="text-base font-semibold text-slate-900">SEO</h3>
							<p class="text-sm text-slate-600">
								These values are stored on the current draft page version under metadata.
							</p>
						</div>

						<div class="mt-4 grid gap-4">
							<div class="space-y-1">
								<label for="seoTitle" class="text-sm font-medium text-slate-700">SEO title</label>
								<input
									id="seoTitle"
									type="text"
									name="seoTitle"
									bind:value={seo.title}
									class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
								/>
								<p class="text-xs text-slate-500">Optional. Falls back to the page title if empty.</p>
							</div>

							<div class="space-y-1">
								<label for="seoDescription" class="text-sm font-medium text-slate-700">
									Meta description
								</label>
								<textarea
									id="seoDescription"
									name="seoDescription"
									rows="4"
									bind:value={seo.description}
									class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
								></textarea>
							</div>

							<div class="grid gap-4 sm:grid-cols-2">
								<div class="space-y-1">
									<label for="canonicalUrl" class="text-sm font-medium text-slate-700">
										Canonical URL
									</label>
									<input
										id="canonicalUrl"
										type="url"
										name="canonicalUrl"
										bind:value={seo.canonicalUrl}
										class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
									/>
								</div>

								<div class="space-y-1">
									<label for="ogImageUrl" class="text-sm font-medium text-slate-700">
										Open Graph image URL
									</label>
									<input
										id="ogImageUrl"
										type="url"
										name="ogImageUrl"
										bind:value={seo.ogImageUrl}
										class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
									/>
								</div>
							</div>

							<div class="grid gap-3 sm:grid-cols-2">
								<label
									for="noIndex"
									class="flex items-start gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700"
								>
									<input
										id="noIndex"
										type="checkbox"
										name="noIndex"
										bind:checked={seo.noIndex}
										class="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
									/>
									<span>
										<span class="block font-medium text-slate-900">No index</span>
										<span class="block text-slate-500">Ask search engines not to index this page.</span>
									</span>
								</label>

								<label
									for="noFollow"
									class="flex items-start gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700"
								>
									<input
										id="noFollow"
										type="checkbox"
										name="noFollow"
										bind:checked={seo.noFollow}
										class="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
									/>
									<span>
										<span class="block font-medium text-slate-900">No follow</span>
										<span class="block text-slate-500">Ask search engines not to follow links on this page.</span>
									</span>
								</label>
							</div>
						</div>
					</div>

					<div class="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
						<input type="hidden" name="content" value={serializedContent} />
						<BlockListEditor
							blocks={content.blocks}
							location={{ parentPath: null, fieldKey: null }}
							allowedTypes={null}
							title="Content"
							description="Build the draft page body from the registered block types. Drag cards to reorder within the same list."
							errors={contentErrors}
							{draggingPath}
							onAddBlock={addBlock}
							onAddReusableBlockReference={addReusableReference}
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
							<div class="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
								Content has validation errors. Review the marked block fields before saving.
							</div>
						{/if}
					</div>

					<div class="grid gap-3 sm:grid-cols-2">
						<div class="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
							<span class="block text-xs uppercase tracking-wide text-slate-400">Created</span>
							{formatTimestamp(page.created_at)}
						</div>
						<div class="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
							<span class="block text-xs uppercase tracking-wide text-slate-400">Updated</span>
							{formatTimestamp(page.updated_at)}
						</div>
					</div>

					<div class="flex items-center justify-end gap-3">
						<button
							type="submit"
							class="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
							disabled={formSubmitting}
						>
							{formSubmitting ? 'Saving...' : 'Save changes'}
						</button>
					</div>
				</form>
			</div>
		{:else}
			<div class="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
				Page not found.
			</div>
		{/if}
	</section>
</main>
