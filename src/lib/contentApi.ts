import type { BlockType } from '$lib/blocks/registry';

// Content-library references are resolved away before they reach the API, so a
// `blocks` field arrives as the nested blocks themselves.
export type ContentApiBlockValue = string | number | boolean | null | ContentApiBlock[];

export type ContentApiBlock = {
	id: string;
	type: BlockType;
	fields: Record<string, ContentApiBlockValue>;
};

// Wire format of the public content API (`/api/v1`). Consumers copy these types.
export type ContentApiPageSummary = {
	id: string;
	path: string;
	title: string;
	published_at: string | null;
};

export type ContentApiPage = ContentApiPageSummary & {
	meta: Record<string, unknown>;
	blocks: ContentApiBlock[];
};
