import type { BlockInstance, BlockValue } from '$lib/pageContent';
import { isValidBlockInstance } from '$lib/reusableBlocks';
import {
	addBlockToRoot,
	cloneBlockRoot,
	moveBlockInRoot,
	removeBlockFromRoot,
	updateBlockFieldInRoot,
	validateBlockContentRoot,
	type BlockContentValidationErrors,
	type BlockListLocation,
	type BlockPath
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

export const addNestedReusableBlockAtPath = (
	content: BlockInstance,
	location: BlockListLocation,
	type: string,
	id: string
): BlockInstance => {
	const result = addBlockToRoot({ kind: 'block', block: content }, location, type, id);
	return result.kind === 'block' ? result.block : content;
};

export const removeNestedReusableBlockAtPath = (
	content: BlockInstance,
	path: BlockPath
): BlockInstance => {
	const result = removeBlockFromRoot({ kind: 'block', block: content }, path);
	return result.kind === 'block' ? result.block : content;
};

export const moveNestedReusableBlock = (
	content: BlockInstance,
	from: BlockPath,
	toIndex: number
): BlockInstance => {
	const result = moveBlockInRoot(
		{ kind: 'block', block: content },
		from,
		toIndex,
		{ allowMoveToEnd: false }
	);
	return result.kind === 'block' ? result.block : content;
};

export const validateReusableBlockEditorState = (
	content: BlockInstance
): ReusableBlockValidationErrors =>
	validateBlockContentRoot({ kind: 'block', block: content }, { rootMode: 'reusable' });
