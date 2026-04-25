<script lang="ts">
	import { page } from '$app/stores';
	import { ContextMenu } from 'bits-ui';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		Bell,
		ChevronDown,
		EllipsisVertical,
		FileText,
		Home,
		Plus,
		Search
	} from '$lib/icons';
	import { buildEditPagePath } from '$lib/pagePath';
	import { getReusableBlockPublishState } from '$lib/reusableBlockStatus';
	import type { ReusableBlock } from '$lib/types';
	import { setReusableBlockDragData } from './reusableBlockInsertion';
	import SidebarPageTreeItem from './SidebarPageTreeItem.svelte';
	import SidebarReusableBlocksTreeItem from './SidebarReusableBlocksTreeItem.svelte';
	import SidebarUserFooter from './SidebarUserFooter.svelte';
	import type { SidebarExpandedContentProps } from './types';

	let {
		user,
		pageTree,
		reusableBlocksTree,
		currentPages,
		currentBlockFolders,
		currentReusableBlocks,
		activePageId,
		activeReusableBlockId,
		closedNodes,
		canInsertIntoCurrentPage,
		canDragReusableBlocks,
		actionPending,
		actionNotice,
		logoutEnhanceSubmit,
		onClose,
		onToggle,
		onCreateFolder,
		onDeleteFolder,
		onDeleteBlock,
		onInsertBlock,
		bindPagesSectionElement,
		bindContentSectionElement
	}: SidebarExpandedContentProps = $props();

	let pagesSectionElement = $state<HTMLElement | null>(null);
	let contentSectionElement = $state<HTMLElement | null>(null);

	const editHref = (pageId: string) => buildEditPagePath(pageId);
	const displayPath = (path: string | null | undefined) => (path && path.trim() ? path : '/');
	const isActive = (href: string) => $page.url.pathname === href;
	const isContentLibraryActive = $derived(isActive('/content'));

	const getReusableBlockStateMeta = (state: 'unpublished' | 'published' | 'draft-changes') => {
		switch (state) {
			case 'draft-changes':
				return { dotClass: 'bg-amber-500' };
			case 'published':
				return { dotClass: 'bg-emerald-500' };
			default:
				return { dotClass: 'bg-slate-400' };
		}
	};

	$effect(() => {
		bindPagesSectionElement?.(pagesSectionElement);
	});

	$effect(() => {
		bindContentSectionElement?.(contentSectionElement);
	});
</script>

<div class="flex h-full flex-col bg-background">
	<div class="sticky top-0 z-10 border-b border-border bg-background/95 px-5 py-4 backdrop-blur">
		<div class="flex items-start gap-3">
			<div class="grid h-12 w-12 place-items-center rounded-lg bg-[#173a63] text-xl font-semibold text-white shadow-sm">
				S
			</div>
			<div class="min-w-0 flex-1 pt-0.5">
				<div class="text-[15px] font-semibold text-foreground">SvelteKit CMS</div>
				<button
					type="button"
					class="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
				>
					<span>Acme Marketing</span>
					<ChevronDown class="h-4 w-4" />
				</button>
			</div>
			<div class="ml-auto flex items-center gap-1">
				<Button variant="ghost" size="icon-sm" aria-label="Search">
					<Search class="h-4 w-4" />
				</Button>
				<Button variant="ghost" size="icon-sm" aria-label="Notifications">
					<Bell class="h-4 w-4" />
				</Button>
				<ThemeToggle />
			</div>
		</div>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto px-5 py-5">
		<a
			href="/"
			class={[
				'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition',
				isActive('/')
					? 'bg-muted text-foreground'
					: 'text-slate-700 hover:bg-muted hover:text-foreground dark:text-muted-foreground'
			].join(' ')}
			onclick={onClose}
		>
			<Home class="h-4 w-4" />
			<span>Dashboard</span>
		</a>

		<section class="mt-7 space-y-2" bind:this={pagesSectionElement}>
			<div class="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
				<div class="flex w-full items-center justify-between">
					<span>Pages</span>
					<div class="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							class="h-9 gap-2 rounded-md px-3 text-sm normal-case tracking-normal"
							href="/#create"
							onclick={onClose}
						>
							<Plus class="h-4 w-4" />
							New Page
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							class="h-9 w-9 rounded-md text-muted-foreground"
							aria-label="Page actions"
						>
							<EllipsisVertical class="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>

			<Separator />

			<div class="space-y-1">
				{#if currentPages.length === 0}
					<div class="px-3 py-2 text-sm text-muted-foreground">No pages yet</div>
				{:else}
					{#each pageTree as root (root.page.id)}
						<SidebarPageTreeItem
							node={root}
							depth={0}
							{activePageId}
							{closedNodes}
							collapsed={false}
							onToggle={onToggle}
							{onClose}
							{editHref}
							{displayPath}
						/>
					{/each}
				{/if}
			</div>
		</section>

		<section class="mt-7 space-y-2 border-t border-border pt-5" bind:this={contentSectionElement}>
			<div class="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
				<div class="flex w-full items-center justify-between">
					<a
						href="/content"
						class={['transition', isContentLibraryActive ? 'text-foreground' : 'hover:text-foreground'].join(
							' '
						)}
						onclick={onClose}
					>
						Content
					</a>
					<div class="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							class="h-9 gap-2 rounded-md px-3 text-sm normal-case tracking-normal"
							href="/content"
							onclick={onClose}
						>
							<Plus class="h-4 w-4" />
							Insert
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							class="h-9 w-9 rounded-md text-muted-foreground"
							aria-label="Content actions"
						>
							<EllipsisVertical class="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>

			<Separator />

			<div class="space-y-1">
				{#if currentBlockFolders.length === 0 && currentReusableBlocks.length === 0}
					<div class="px-3 py-2 text-sm text-muted-foreground">No content yet</div>
				{:else}
					{#each reusableBlocksTree.folders as folder (folder.folder?.id)}
						<SidebarReusableBlocksTreeItem
							node={folder}
							depth={0}
							activeBlockId={activeReusableBlockId}
							{closedNodes}
							collapsed={false}
							onToggle={onToggle}
							{onClose}
							canInsertIntoPage={canInsertIntoCurrentPage}
							canDragIntoPage={canDragReusableBlocks}
							onCreateSubfolder={onCreateFolder}
							onDeleteFolder={onDeleteFolder}
							onDeleteBlock={onDeleteBlock}
							onInsertBlockIntoPage={onInsertBlock}
						/>
					{/each}

					{#each reusableBlocksTree.blocks as block (block.id)}
						{@const stateMeta = getReusableBlockStateMeta(getReusableBlockPublishState(block))}
						<div
							class={[
								'flex min-w-0 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition',
								activeReusableBlockId === block.id
									? 'bg-[#e8eef9] text-[#1655e2]'
									: 'text-foreground/88 hover:bg-muted/30 hover:text-foreground'
							].join(' ')}
						>
							<ContextMenu.Root>
								<ContextMenu.Trigger class="flex min-w-0 flex-1">
									<a
										href={`/content/${block.id}`}
										class="flex min-w-0 flex-1 items-center justify-between gap-3"
										draggable={canInsertIntoCurrentPage && canDragReusableBlocks}
										onclick={onClose}
										ondragstart={(event) => setReusableBlockDragData(event, block.id)}
									>
										<div class="flex min-w-0 flex-1 items-center gap-3">
											<span class="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border/80 bg-background text-muted-foreground">
												<FileText class="h-4 w-4" />
											</span>
											<span class="min-w-0 flex-1 truncate text-sm font-medium">{block.name}</span>
										</div>
										<div class="flex shrink-0 items-center gap-2">
											<span class="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
												{block.block_type}
											</span>
											<span class={`h-2.5 w-2.5 rounded-full ${stateMeta.dotClass}`}></span>
										</div>
									</a>
								</ContextMenu.Trigger>
								<ContextMenu.Content class="z-50 min-w-44 rounded-xl border border-border bg-popover p-1.5 shadow-lg">
									{#if canInsertIntoCurrentPage}
										<ContextMenu.Item
											class="rounded-lg px-2 py-2 text-sm text-slate-700 outline-none transition focus:bg-slate-100"
											onSelect={() => onInsertBlock(block.id)}
										>
											Insert into page
										</ContextMenu.Item>
									{/if}
									<ContextMenu.Item
										class="rounded-lg px-2 py-2 text-sm text-red-700 outline-none transition focus:bg-red-50"
										onSelect={() => onDeleteBlock(block.id, block.name)}
									>
										Delete content
									</ContextMenu.Item>
								</ContextMenu.Content>
							</ContextMenu.Root>

							<DropdownMenu.Root>
								<DropdownMenu.Trigger
									class={`${buttonVariants({ variant: 'ghost', size: 'icon-sm' })} h-8 w-8 shrink-0 rounded-md text-muted-foreground`}
								>
									<EllipsisVertical class="h-4 w-4" />
								</DropdownMenu.Trigger>
								<DropdownMenu.Content class="min-w-44 rounded-xl p-1.5">
									{#if canInsertIntoCurrentPage}
										<DropdownMenu.Item class="rounded-lg px-2 py-2 text-sm" onSelect={() => onInsertBlock(block.id)}>
											Insert into page
										</DropdownMenu.Item>
									{/if}
									<DropdownMenu.Item
										variant="destructive"
										class="rounded-lg px-2 py-2 text-sm"
										onSelect={() => onDeleteBlock(block.id, block.name)}
									>
										Delete content
									</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</div>
					{/each}
				{/if}

				{#if actionPending}
					<div class="mx-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
						Applying sidebar action…
					</div>
				{:else if actionNotice}
					<div
						class={[
							'mx-3 rounded-md px-3 py-2 text-xs',
							actionNotice.tone === 'success'
								? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
								: 'border border-destructive/30 bg-destructive/10 text-destructive'
						].join(' ')}
					>
						{actionNotice.text}
					</div>
				{/if}
			</div>
		</section>
	</div>

	<SidebarUserFooter {user} {logoutEnhanceSubmit} />
</div>
