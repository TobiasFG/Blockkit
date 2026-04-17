import type { PageContent } from '$lib/pageContent';
import type { BlockInstance } from '$lib/pageContent';

export type Page = {
	id: string;
	title: string;
	path: string;
	live_title: string | null;
	live_path: string | null;
	parent_page_id: string | null;
	published_parent_page_id: string | null;
	url_name: string | null;
	path_segment: string | null;
	published_url_name: string | null;
	published_path_segment: string | null;
	created_at: string;
	updated_at: string;
	draft_version_id?: string | null;
	published_version_id?: string | null;
	has_unpublished_changes?: boolean;
	is_published?: boolean;
	last_published_at?: string | null;
};

export type ReferencingPage = Pick<Page, 'id' | 'title' | 'path'>;

export type PageDraftVersion = {
	id: string;
	page_id: string;
	status: 'draft' | 'published' | 'archived';
	title: string;
	parent_page_id: string | null;
	url_name: string | null;
	path_segment: string | null;
	content: PageContent;
	meta: Record<string, unknown>;
	parent_id: string | null;
	revision: number | null;
	created_at: string;
	updated_at: string;
	published_at: string | null;
};

export type BlockFolder = {
	id: string;
	name: string;
	parent_id: string | null;
	sort_order: number;
	created_at: string;
	updated_at: string;
};

export type ReusableBlock = {
	id: string;
	name: string;
	folder_id: string | null;
	block_type: string;
	content: BlockInstance;
	draft_version_id: string | null;
	published_version_id: string | null;
	has_unpublished_changes: boolean;
	is_published: boolean;
	last_published_at: string | null;
	created_at: string;
	updated_at: string;
};
