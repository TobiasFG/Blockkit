import type { BlockInstance, BlockValue } from '$lib/pageContent';
import { isValidBlockInstance } from '$lib/reusableBlocks';
import {
	cloneBlockRoot,
	insertReferenceInRoot,
	moveReferenceInRoot,
	removeReferenceFromRoot,
	updateBlockFieldInRoot,
	validateBlockContentRoot,
	type BlockContentValidationErrors,
	type BlockListLocation,
	type BlockPath,
	type ReusableBlockSummary
} from '$lib/blockContentEditor';

export type ReusableBlockValidationErrors = BlockContentValidationErrors;

export const parseSubmittedReusableBlockContent = (value: string): BlockInstance | null => {
	try {
		const parsed: unknown = JSON.parse(value);
		return isValidBlockInstance(parsed) ? parsed : null;
	} catch {
		return null;
	}
};

export const createEditableReusableBlockContent = (content: BlockInstance): BlockInstance =>
	cloneBlockRoot(content);

export const updateReusableBlockFieldValue = (
	content: BlockInstance,
	path: BlockPath,
	fieldKey: string,
	value: BlockValue | undefined
): BlockInstance => {
	const result = updateBlockFieldInRoot({ kind: 'block', block: content }, path, fieldKey, value);
	return result.kind === 'block' ? result.block : content;
};

export const insertNestedReferenceAtIndex = (
	content: BlockInstance,
	location: BlockListLocation,
	reusableBlockId: string,
	id: string,
	index: number
): BlockInstance => {
	const result = insertReferenceInRoot(
		{ kind: 'block', block: content },
		location,
		reusableBlockId,
		id,
		index
	);
	return result.kind === 'block' ? result.block : content;
};

export const removeNestedReferenceAtIndex = (
	content: BlockInstance,
	location: BlockListLocation,
	index: number
): BlockInstance => {
	const result = removeReferenceFromRoot({ kind: 'block', block: content }, location, index);
	return result.kind === 'block' ? result.block : content;
};

export const moveNestedReference = (
	content: BlockInstance,
	location: BlockListLocation,
	fromIndex: number,
	toIndex: number
): BlockInstance => {
	const result = moveReferenceInRoot(
		{ kind: 'block', block: content },
		location,
		fromIndex,
		toIndex
	);
	return result.kind === 'block' ? result.block : content;
};

export const validateReusableBlockEditorState = (
	content: BlockInstance,
	reusableBlocks: ReusableBlockSummary[] | null = null
): ReusableBlockValidationErrors =>
	validateBlockContentRoot({ kind: 'block', block: content }, { rootMode: 'reusable', reusableBlocks });
