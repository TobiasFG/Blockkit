// Mirrors the Blockkit content API wire format (`src/lib/contentApi.ts` in the CMS).
export type BlockValue = string | number | boolean | null | BlockInstance[];

export type BlockInstance = {
	id: string;
	type: string;
	fields: Record<string, BlockValue>;
};

export type PageSummary = {
	id: string;
	path: string;
	title: string;
	published_at: string | null;
};

export type Page = PageSummary & {
	meta: Record<string, unknown>;
	blocks: BlockInstance[];
};
