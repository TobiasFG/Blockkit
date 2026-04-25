import type { SubmitFunction } from '@sveltejs/kit';
import type { User } from '@supabase/supabase-js';
import type { BlockFolder, Page, ReferencingPage, ReusableBlock } from '$lib/types';
import type { ReusableBlocksTreeNode } from './reusableBlocksTree';
import type { SidebarTreeNode } from './sidebarTree';

export type SidebarDesktopFocus =
	| { kind: 'dashboard' }
	| { kind: 'pages' }
	| { kind: 'content' }
	| { kind: 'content-folder'; id: string }
	| { kind: 'content-block'; id: string }
	| { kind: 'trash' };

export type SidebarActionNotice = {
	tone: 'success' | 'error';
	text: string;
};

export type SidebarExpandedContentProps = {
	user: User;
	pageTree: SidebarTreeNode[];
	reusableBlocksTree: { folders: ReusableBlocksTreeNode[]; blocks: ReusableBlock[] };
	currentPages: Page[];
	currentBlockFolders: BlockFolder[];
	currentReusableBlocks: ReusableBlock[];
	activePageId: string | null;
	activeReusableBlockId: string | null;
	closedNodes: Record<string, boolean>;
	canInsertIntoCurrentPage: boolean;
	canDragReusableBlocks: boolean;
	actionPending: boolean;
	actionNotice: SidebarActionNotice | null;
	logoutEnhanceSubmit?: SubmitFunction;
	onClose: () => void;
	onToggle: (id: string) => void;
	onCreateFolder: (parentId: string | null, parentName: string) => void;
	onDeleteFolder: (id: string, name: string) => void;
	onDeleteBlock: (id: string, name: string) => void;
	onInsertBlock: (id: string) => void;
	bindPagesSectionElement?: (element: HTMLElement | null) => void;
	bindContentSectionElement?: (element: HTMLElement | null) => void;
};
