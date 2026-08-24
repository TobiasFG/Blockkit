import type { BlockValue, PageContent } from '$lib/pageContent';
import { EMPTY_PAGE_CONTENT, isPageContent } from '$lib/pageContent';
import {
	cloneBlockList,
	createReusableBlockReference,
	moveBlockInRoot,
	removeBlockFromRoot,
	updateBlockFieldInRoot,
	validateBlockContentRoot,
	type BlockContentValidationErrors,
	type BlockListLocation,
	type BlockPath,
	type ReusableBlockSummary
} from '$lib/blockContentEditor';

export type { BlockListLocation, BlockPath };
export type PageContentValidationErrors = BlockContentValidationErrors;

export const parseSubmittedPageContent = (value: string): PageContent | null => {
	try {
		const parsed: unknown = JSON.parse(value);
		return isPageContent(parsed) ? parsed : null;
	} catch {
		return null;
	}
};

export const createEditablePageContent = (content: PageContent | null | undefined): PageContent =>
	content ? { version: 1, layout: null, blocks: cloneBlockList(content.blocks) } : { ...EMPTY_PAGE_CONTENT };

export const addReusableBlockReference = (
	content: PageContent,
	reusableBlockId: string,
	id: string
): PageContent => {
	const next = createEditablePageContent(content);
	next.blocks.push(createReusableBlockReference(reusableBlockId, id));
	return next;
};

export const insertReusableBlockReferenceAtIndex = (
	content: PageContent,
	reusableBlockId: string,
	id: string,
	index: number
): PageContent => {
	const next = createEditablePageContent(content);
	if (index < 0 || index > next.blocks.length) return next;

	next.blocks.splice(index, 0, createReusableBlockReference(reusableBlockId, id));
	return next;
};

export const removeBlockAtPath = (content: PageContent, path: BlockPath): PageContent => {
	const result = removeBlockFromRoot({ kind: 'list', blocks: content.blocks }, path);
	return { version: 1, layout: null, blocks: result.kind === 'list' ? result.blocks : [] };
};

export const moveBlock = (content: PageContent, from: BlockPath, toIndex: number): PageContent => {
	const result = moveBlockInRoot(
		{ kind: 'list', blocks: content.blocks },
		from,
		toIndex,
		{ allowMoveToEnd: true }
	);
	return { version: 1, layout: null, blocks: result.kind === 'list' ? result.blocks : [] };
};

export const updateBlockFieldValue = (
	content: PageContent,
	path: BlockPath,
	fieldKey: string,
	value: BlockValue | undefined
): PageContent => {
	const result = updateBlockFieldInRoot(
		{ kind: 'list', blocks: content.blocks },
		path,
		fieldKey,
		value
	);
	return { version: 1, layout: null, blocks: result.kind === 'list' ? result.blocks : [] };
};

export const validatePageContentEditorState = (
	content: PageContent,
	reusableBlocks: ReusableBlockSummary[] | null = null
): PageContentValidationErrors =>
	validateBlockContentRoot(
		{ kind: 'list', blocks: content.blocks },
		{ rootMode: 'page', reusableBlocks }
	);
