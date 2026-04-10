import { isValidBlockInstance } from '$lib/reusableBlocks';

export type BlockInstance = {
	id: string;
	type: string;
	fields: Record<string, BlockValue>;
};

export type BlockValue = string | number | boolean | null | BlockInstance[];

export type ReusableBlockReference = {
	id: string;
	type: 'reusable';
	reusableBlockId: string;
};

export type PageBlockNode = BlockInstance | ReusableBlockReference;

export type PageContent = {
	version: 1;
	layout: null;
	blocks: PageBlockNode[];
};

export const EMPTY_PAGE_CONTENT: PageContent = {
	version: 1,
	layout: null,
	blocks: []
};

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

export const isReusableBlockReference = (value: unknown): value is ReusableBlockReference => {
	if (!isObject(value)) return false;
	if (typeof value.id !== 'string' || !value.id.trim()) return false;
	if (value.type !== 'reusable') return false;
	if (typeof value.reusableBlockId !== 'string' || !value.reusableBlockId.trim()) return false;
	return true;
};

export const isPageBlockNode = (value: unknown): value is PageBlockNode =>
	isReusableBlockReference(value) || isValidBlockInstance(value);

export const isPageContent = (value: unknown): value is PageContent => {
	if (!isObject(value)) return false;
	if (value.version !== 1) return false;
	if (!('layout' in value) || value.layout !== null) return false;
	if (!Array.isArray(value.blocks)) return false;
	return value.blocks.every((block) => isPageBlockNode(block));
};

export const parsePageContent = (value: unknown): PageContent =>
	isPageContent(value)
		? {
				version: 1,
				layout: null,
				blocks: value.blocks
			}
		: { ...EMPTY_PAGE_CONTENT };

export const serializePageContent = (value: PageContent): Record<string, unknown> => {
	if (!isPageContent(value)) {
		throw new Error('Invalid page content');
	}

	return {
		version: 1,
		layout: null,
		blocks: value.blocks
	};
};
