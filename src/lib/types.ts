import type { PageContent } from '$lib/pageContent';
import type { BlockInstance } from '$lib/pageContent';

export type Page = {
	id: string;
	title: string;
	slug: string;
	created_at: string;
	updated_at: string;
	draft_version_id?: string | null;
	published_version_id?: string | null;
};

export type ReferencingPage = Pick<Page, 'id' | 'title' | 'slug'>;

export type PageDraftVersion = {
	id: string;
	page_id: string;
	content: PageContent;
	meta: Record<string, unknown>;
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
