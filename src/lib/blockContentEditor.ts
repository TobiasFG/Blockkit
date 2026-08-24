import { getBlockDefinition, type BlockFieldDefinition, type BlockType } from '$lib/blocks/registry';
import type {
	BlockInstance,
	BlockValue,
	PageBlockNode,
	ReusableBlockReference
} from '$lib/pageContent';
import { isReusableBlockReference } from '$lib/pageContent';

export type BlockPath = number[];
export type BlockListLocation =
	| { parentPath: null; fieldKey: null }
	| { parentPath: BlockPath; fieldKey: string };
export type BlockContentValidationErrors = Record<string, string>;

export type BlockEditorRoot =
	| { kind: 'list'; blocks: PageBlockNode[] }
	| { kind: 'block'; block: BlockInstance };

export type ReusableBlockSummary = { id: string; block_type: BlockType };

type ValidateOptions = {
	rootMode: 'page' | 'reusable';
	reusableBlocks?: ReusableBlockSummary[] | null;
};

const cloneReference = (reference: ReusableBlockReference): ReusableBlockReference => ({
	...reference
});

const cloneBlock = (block: BlockInstance): BlockInstance => ({
	...block,
	fields: Object.fromEntries(
		Object.entries(block.fields).map(([key, value]) => [
			key,
			Array.isArray(value) ? value.map((item) => cloneReference(item)) : value
		])
	) as Record<string, BlockValue>
});

const clonePageNode = (node: PageBlockNode): PageBlockNode =>
	isReusableBlockReference(node) ? cloneReference(node) : cloneBlock(node);

export const cloneBlockList = (blocks: PageBlockNode[]): PageBlockNode[] =>
	blocks.map((block) => clonePageNode(block));

export const cloneBlockRoot = (block: BlockInstance): BlockInstance => cloneBlock(block);

const cloneRoot = (root: BlockEditorRoot): BlockEditorRoot =>
	root.kind === 'list'
		? { kind: 'list', blocks: cloneBlockList(root.blocks) }
		: { kind: 'block', block: cloneBlockRoot(root.block) };

const getBlockAtPath = (root: BlockEditorRoot, path: BlockPath): BlockInstance | null => {
	if (root.kind === 'block') {
		return path.length === 0 ? root.block : null;
	}

	if (path.length !== 1) return null;
	const block = root.blocks[path[0]];
	return block && !isReusableBlockReference(block) ? block : null;
};

const getRootList = (root: BlockEditorRoot, path: BlockPath): PageBlockNode[] | null =>
	root.kind === 'list' && path.length === 1 ? root.blocks : null;

/** Resolves the reference list held by a `blocks` field of the block at `location.parentPath`. */
const getReferenceList = (
	root: BlockEditorRoot,
	location: BlockListLocation
): ReusableBlockReference[] | null => {
	if (location.parentPath === null || location.fieldKey === null) return null;

	const parent = getBlockAtPath(root, location.parentPath);
	if (!parent) return null;

	const definition = getBlockDefinition(parent.type);
	const field = definition?.fields.find(
		(candidate) => candidate.type === 'blocks' && candidate.key === location.fieldKey
	);
	if (!field) return null;

	const value = parent.fields[field.key];
	if (Array.isArray(value)) return value;

	parent.fields = { ...parent.fields, [field.key]: [] };
	return parent.fields[field.key] as ReusableBlockReference[];
};

export const createReusableBlockReference = (
	reusableBlockId: string,
	id: string
): ReusableBlockReference => ({
	id,
	type: 'reusable',
	reusableBlockId
});

export const insertReferenceInRoot = (
	root: BlockEditorRoot,
	location: BlockListLocation,
	reusableBlockId: string,
	id: string,
	index: number
): BlockEditorRoot => {
	const next = cloneRoot(root);
	const list = getReferenceList(next, location);
	if (!list) return next;

	const target = Math.min(Math.max(index, 0), list.length);
	list.splice(target, 0, createReusableBlockReference(reusableBlockId, id));
	return next;
};

export const removeReferenceFromRoot = (
	root: BlockEditorRoot,
	location: BlockListLocation,
	index: number
): BlockEditorRoot => {
	const next = cloneRoot(root);
	const list = getReferenceList(next, location);
	if (!list || !list[index]) return next;

	list.splice(index, 1);
	return next;
};

export const moveReferenceInRoot = (
	root: BlockEditorRoot,
	location: BlockListLocation,
	fromIndex: number,
	toIndex: number
): BlockEditorRoot => {
	const next = cloneRoot(root);
	const list = getReferenceList(next, location);
	if (!list) return next;

	if (toIndex < 0 || toIndex > list.length - 1 || toIndex === fromIndex) return next;

	const [moved] = list.splice(fromIndex, 1);
	if (!moved) return next;

	list.splice(toIndex, 0, moved);
	return next;
};

export const removeBlockFromRoot = (root: BlockEditorRoot, path: BlockPath): BlockEditorRoot => {
	const next = cloneRoot(root);
	const list = getRootList(next, path);
	if (!list) return next;

	list.splice(path[0], 1);
	return next;
};

export const moveBlockInRoot = (
	root: BlockEditorRoot,
	from: BlockPath,
	toIndex: number,
	{ allowMoveToEnd }: { allowMoveToEnd: boolean }
): BlockEditorRoot => {
	const next = cloneRoot(root);
	const list = getRootList(next, from);
	if (!list) return next;

	const fromIndex = from[0];
	const maxTarget = allowMoveToEnd ? list.length : list.length - 1;
	if (toIndex < 0 || toIndex > maxTarget || toIndex === fromIndex) {
		return next;
	}

	const [moved] = list.splice(fromIndex, 1);
	if (!moved) return next;

	list.splice(toIndex, 0, moved);
	return next;
};

export const updateBlockFieldInRoot = (
	root: BlockEditorRoot,
	path: BlockPath,
	fieldKey: string,
	value: BlockValue | undefined
): BlockEditorRoot => {
	const next = cloneRoot(root);
	const block = getBlockAtPath(next, path);
	if (!block) return next;

	const fields = { ...block.fields };
	if (value === undefined) {
		delete fields[fieldKey];
	} else {
		fields[fieldKey] = value;
	}

	block.fields = fields;
	return next;
};

const validateFieldValue = (
	value: BlockValue | undefined,
	field: BlockFieldDefinition,
	options: ValidateOptions
): string | null => {
	if (value === undefined) {
		return field.required ? `${field.label} is required.` : null;
	}

	switch (field.type) {
		case 'string':
			if (typeof value !== 'string') return `${field.label} must be text.`;
			if (field.required && !value.trim()) return `${field.label} is required.`;
			return null;
		case 'date':
			if (typeof value !== 'string') return `${field.label} must be a date string.`;
			if (value.trim() && Number.isNaN(Date.parse(value))) return `${field.label} must be a valid date.`;
			return null;
		case 'number':
			if (options.rootMode === 'page' && value === '') {
				return field.required ? `${field.label} is required.` : null;
			}
			return typeof value === 'number' && Number.isFinite(value)
				? null
				: `${field.label} must be a number.`;
		case 'boolean':
			return typeof value === 'boolean' ? null : `${field.label} must be true or false.`;
		case 'blocks':
			return Array.isArray(value) ? null : `${field.label} must be a list of content items.`;
	}
};

/** Error key for a `blocks` field entry, so the editor can point at the offending row. */
export const referenceErrorKey = (pathKey: string, fieldKey: string, index: number) =>
	`${pathKey || 'root'}:${fieldKey}.${index}`;

export const validateBlockContentRoot = (
	root: BlockEditorRoot,
	options: ValidateOptions
): BlockContentValidationErrors => {
	const errors: BlockContentValidationErrors = {};
	const blocksById = new Map((options.reusableBlocks ?? []).map((block) => [block.id, block]));
	const knowsReusableBlocks = Boolean(options.reusableBlocks);

	const visitBlock = (block: BlockInstance, pathKey: string) => {
		const definition = getBlockDefinition(block.type);
		if (!definition) {
			errors[pathKey || 'root'] = `Unknown block type: ${block.type}`;
			return;
		}

		for (const field of definition.fields) {
			const value = block.fields[field.key];
			const fieldError = validateFieldValue(value, field, options);
			if (fieldError) {
				errors[`${pathKey || 'root'}:${field.key}`] = fieldError;
			}

			if (field.type !== 'blocks' || !Array.isArray(value)) continue;

			const allowedTypes = new Set<string>(field.blocks?.allowedTypes ?? []);
			value.forEach((entry, index) => {
				const key = referenceErrorKey(pathKey, field.key, index);
				if (!isReusableBlockReference(entry)) {
					errors[key] = `${field.label} can only hold content library items.`;
					return;
				}

				if (!knowsReusableBlocks) return;

				const referenced = blocksById.get(entry.reusableBlockId);
				if (!referenced) {
					errors[key] = 'Referenced content item no longer exists.';
					return;
				}

				if (allowedTypes.size > 0 && !allowedTypes.has(referenced.block_type)) {
					errors[key] = `${referenced.block_type} is not allowed in ${field.label}.`;
				}
			});
		}
	};

	if (root.kind === 'block') {
		visitBlock(root.block, '');
		return errors;
	}

	root.blocks.forEach((block, index) => {
		const pathKey = String(index);

		if (!isReusableBlockReference(block)) {
			errors[pathKey] = 'Top-level page content must come from Content library.';
			return;
		}

		if (knowsReusableBlocks && !blocksById.has(block.reusableBlockId)) {
			errors[pathKey] = 'Referenced reusable block no longer exists.';
		}
	});

	return errors;
};
