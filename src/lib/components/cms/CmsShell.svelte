<script lang="ts">
	import type { BlockFolder, Page, ReusableBlock } from '$lib/types';
	import type { User } from '@supabase/supabase-js';
	import type { Snippet } from 'svelte';
	import Sidebar from './Sidebar.svelte';

	let { pages, blockFolders, reusableBlocks, user, children } = $props<{
		pages: Page[];
		blockFolders: BlockFolder[];
		reusableBlocks: ReusableBlock[];
		user: User;
		children: Snippet;
	}>();
	let mobileOpen = $state(false);

	const closeMobile = () => {
		mobileOpen = false;
	};
</script>

<div class="min-h-screen bg-slate-50">
	<Sidebar
		pages={pages}
		blockFolders={blockFolders}
		reusableBlocks={reusableBlocks}
		user={user}
		mobileOpen={mobileOpen}
		onClose={closeMobile}
	/>

	<div class="lg:pl-72">
		<header class="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:hidden">
			<button
				type="button"
				class="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100"
				aria-label="Open sidebar"
				aria-expanded={mobileOpen}
				onclick={() => (mobileOpen = true)}
			>
				<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>
			<div class="text-sm font-semibold text-slate-900">Blockkit CMS</div>
		</header>

		<div class="p-4 lg:p-8">
			{@render children()}
		</div>
	</div>
</div>
