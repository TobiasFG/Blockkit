import { getBlockDefinition, type BlockFieldDefinition } from '$lib/blocks/registry';
import type {
	BlockInstance,
	BlockValue,
	PageBlockNode,
	ReusableBlockReference
} from '$lib/pageContent';
import { isReusableBlockReference } from '$lib/pageContent';
import { createDefaultBlockInstance } from '$lib/reusableBlocks';

export type BlockPath = number[];
export type BlockListLocation =
	| { parentPath: null; fieldKey: null }
	| { parentPath: BlockPath; fieldKey: string };
export type BlockContentValidationErrors = Record<string, string>;

export type BlockEditorRoot =
	| { kind: 'list'; blocks: PageBlockNode[] }
	| { kind: 'block'; block: BlockInstance };

type BlockList = PageBlockNode[] | BlockInstance[];

type ValidateOptions = {
	rootMode: 'page' | 'reusable';
	reusableBlockIds?: Set<string> | null;
};

const cloneBlock = (block: BlockInstance): BlockInstance => ({
	...block,
	fields: Object.fromEntries(
		Object.entries(block.fields).map(([key, value]) => [
			key,
			Array.isArray(value) ? value.map((item) => cloneBlock(item)) : value
		])
	) as Record<string, BlockValue>
});

const clonePageNode = (node: PageBlockNode): PageBlockNode =>
	isReusableBlockReference(node) ? { ...node } : cloneBlock(node);

export const cloneBlockList = (blocks: PageBlockNode[]): PageBlockNode[] =>
	blocks.map((block) => clonePageNode(block));

export const cloneBlockRoot = (block: BlockInstance): BlockInstance => cloneBlock(block);

const firstNestedListContainingIndex = (block: BlockInstance, index: number): BlockInstance[] | null => {
	const definition = getBlockDefinition(block.type);
	if (!definition) return null;

	for (const field of definition.fields) {
		if (field.type !== 'blocks') continue;
		const value = block.fields[field.key];
		if (!Array.isArray(value)) continue;
		if (value[index]) return value;
	}

	return null;
};

const getBlockAtPath = (root: BlockEditorRoot, path: BlockPath): BlockInstance | null => {
	if (root.kind === 'list') {
		if (path.length === 0) return null;
		const parentList = getParentList(root, path);
		const block = parentList?.[path[path.length - 1]] ?? null;
		return block && !isReusableBlockReference(block) ? block : null;
	}

	let current: BlockInstance | null = root.block;
	for (const index of path) {
		if (!current) return null;
		current = firstNestedListContainingIndex(current, index)?.[index] ?? null;
	}
	return current;
};

const getParentList = (root: BlockEditorRoot, path: BlockPath): BlockList | null => {
	if (path.length === 0) return null;
	if (root.kind === 'list' && path.length === 1) return root.blocks;

	const parentPath = path.slice(0, -1);
	const parent =
		root.kind === 'block' && parentPath.length === 0 ? root.block : getBlockAtPath(root, parentPath);
	if (!parent) return null;

	return firstNestedListContainingIndex(parent, path[path.length - 1]);
};

const getBlocksList = (root: BlockEditorRoot, location: BlockListLocation): BlockList | null => {
	if (root.kind === 'list' && location.parentPath === null) return root.blocks;
	if (location.parentPath === null || location.fieldKey === null) return null;

	const parent =
		root.kind === 'block' && location.parentPath.length === 0
			? root.block
			: getBlockAtPath(root, location.parentPath);
	if (!parent) return null;

	const definition = getBlockDefinition(parent.type);
	if (!definition) return null;

	const field = definition.fields.find(
		(candidate) => candidate.type === 'blocks' && candidate.key === location.fieldKey
	);
	if (!field) return null;

	const value = parent.fields[field.key];
	return Array.isArray(value) ? value : null;
};

export const addBlockToRoot = (
	root: BlockEditorRoot,
	location: BlockListLocation,
	type: string,
	id: string
): BlockEditorRoot => {
	const next = cloneRoot(root);
	const list = getBlocksList(next, location);
	if (!list) return next;

	list.push(createDefaultBlockInstance(type, id));
	return next;
};

export const removeBlockFromRoot = (root: BlockEditorRoot, path: BlockPath): BlockEditorRoot => {
	const next = cloneRoot(root);
	const parentList = getParentList(next, path);
	if (!parentList) return next;

	parentList.splice(path[path.length - 1], 1);
	return next;
};

export const moveBlockInRoot = (
	root: BlockEditorRoot,
	from: BlockPath,
	toIndex: number,
	{ allowMoveToEnd }: { allowMoveToEnd: boolean }
): BlockEditorRoot => {
	const next = cloneRoot(root);
	const parentList = getParentList(next, from);
	if (!parentList) return next;

	const fromIndex = from[from.length - 1];
	const maxTarget = allowMoveToEnd ? parentList.length : parentList.length - 1;
	if (toIndex < 0 || toIndex > maxTarget || toIndex === fromIndex) {
		return next;
	}

	const [moved] = parentList.splice(fromIndex, 1);
	if (!moved) return next;

	parentList.splice(toIndex, 0, moved);
	return next;
};

export const updateBlockFieldInRoot = (
	root: BlockEditorRoot,
	path: BlockPath,
	fieldKey: string,
	value: BlockValue | undefined
): BlockEditorRoot => {
	const next = cloneRoot(root);
	const block =
		next.kind === 'block' && path.length === 0 ? next.block : getBlockAtPath(next, path);
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

const cloneRoot = (root: BlockEditorRoot): BlockEditorRoot =>
	root.kind === 'list'
		? { kind: 'list', blocks: cloneBlockList(root.blocks) }
		: { kind: 'block', block: cloneBlockRoot(root.block) };

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
			return Array.isArray(value) ? null : `${field.label} must be a list of blocks.`;
	}
};

export const validateBlockContentRoot = (
	root: BlockEditorRoot,
	options: ValidateOptions
): BlockContentValidationErrors => {
	const errors: BlockContentValidationErrors = {};

	const visitList = (
		blocks: PageBlockNode[] | BlockInstance[],
		listLocation: string,
		allowReusableReferences: boolean
	) => {
		blocks.forEach((block, index) => {
			const pathKey = listLocation ? `${listLocation}.${index}` : String(index);

			if (isReusableBlockReference(block)) {
				if (!allowReusableReferences) {
					errors[pathKey] = 'Reusable block references are only allowed at the top level.';
					return;
				}

				if (options.reusableBlockIds && !options.reusableBlockIds.has(block.reusableBlockId)) {
					errors[pathKey] = 'Referenced reusable block no longer exists.';
				}
				return;
			}

			if (options.rootMode === 'page' && !listLocation) {
				errors[pathKey] = 'Top-level page content must come from Content library.';
				return;
			}

			visitBlock(block, pathKey);
		});
	};

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

			if (field.type === 'blocks' && Array.isArray(value)) {
				const allowedTypes = new Set(field.blocks?.allowedTypes ?? []);
				value.forEach((nestedBlock, nestedIndex) => {
					const nestedPathKey =
						options.rootMode === 'page'
							? `${pathKey}:${field.key}.${nestedIndex}`
							: pathKey
								? `${pathKey}:${field.key}.${nestedIndex}`
								: `${nestedIndex}`;
					if (allowedTypes.size > 0 && !allowedTypes.has(nestedBlock.type)) {
						errors[nestedPathKey] = `${nestedBlock.type} is not allowed in ${field.label}.`;
					}
				});
				visitList(value, pathKey ? `${pathKey}:${field.key}` : '', false);
			}
		}
	};

	if (root.kind === 'list') {
		visitList(root.blocks, '', true);
	} else {
		visitBlock(root.block, '');
	}

	return errors;
};

export const createReusableBlockReference = (
	reusableBlockId: string,
	id: string
): ReusableBlockReference => ({
	id,
	type: 'reusable',
	reusableBlockId
});
