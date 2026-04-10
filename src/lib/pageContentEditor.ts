import { getBlockDefinition, type BlockFieldDefinition } from '$lib/blocks/registry';
import type { BlockInstance, BlockValue, PageBlockNode, PageContent, ReusableBlockReference } from '$lib/pageContent';
import { EMPTY_PAGE_CONTENT, isPageContent, isReusableBlockReference } from '$lib/pageContent';
import { createDefaultBlockInstance } from '$lib/reusableBlocks';

export type BlockPath = number[];
export type BlockListLocation =
	| { parentPath: null; fieldKey: null }
	| { parentPath: BlockPath; fieldKey: string };
export type PageContentValidationErrors = Record<string, string>;

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

const cloneBlocks = (blocks: PageBlockNode[]): PageBlockNode[] => blocks.map((block) => clonePageNode(block));

const getBlocksList = (blocks: PageBlockNode[], location: BlockListLocation): PageBlockNode[] | BlockInstance[] | null => {
	if (location.parentPath === null) {
		return blocks;
	}

	const block = getBlockAtPath(blocks, location.parentPath);
	if (!block) return null;

	const definition = getBlockDefinition(block.type);
	if (!definition) return null;

	const nestedField = definition.fields.find(
		(field) => field.type === 'blocks' && field.key === location.fieldKey
	);
	if (!nestedField) return null;

	const nestedValue = block.fields[nestedField.key];
	return Array.isArray(nestedValue) ? nestedValue : null;
};

const getBlockParentList = (blocks: PageBlockNode[], path: BlockPath): PageBlockNode[] | BlockInstance[] | null => {
	if (path.length === 0) return null;
	if (path.length === 1) return blocks;

	const walk = (list: PageBlockNode[] | BlockInstance[], depth: number): BlockInstance[] | null => {
		const block = list[path[depth]];
		if (!block || isReusableBlockReference(block)) return null;
		if (depth === path.length - 2) {
			const definition = getBlockDefinition(block.type);
			if (!definition) return null;

			for (const field of definition.fields) {
				if (field.type !== 'blocks') continue;
				const value = block.fields[field.key];
				if (!Array.isArray(value)) continue;
				if (value[path[depth + 1]]) {
					return value;
				}
			}

			return null;
		}

		const definition = getBlockDefinition(block.type);
		if (!definition) return null;

		for (const field of definition.fields) {
			if (field.type !== 'blocks') continue;
			const value = block.fields[field.key];
			if (!Array.isArray(value)) continue;
			const found = walk(value, depth + 1);
			if (found) return found;
		}

		return null;
	};

	return walk(blocks, 0);
};

const getBlockAtPath = (blocks: PageBlockNode[], path: BlockPath): BlockInstance | null => {
	const parentList = getBlockParentList(blocks, path);
	if (!parentList) return null;
	const block = parentList[path[path.length - 1]] ?? null;
	return block && !isReusableBlockReference(block) ? block : null;
};

export const parseSubmittedPageContent = (value: string): PageContent | null => {
	try {
		const parsed: unknown = JSON.parse(value);
		return isPageContent(parsed) ? parsed : null;
	} catch {
		return null;
	}
};

export const createEditablePageContent = (content: PageContent | null | undefined): PageContent =>
	content ? { version: 1, layout: null, blocks: cloneBlocks(content.blocks) } : { ...EMPTY_PAGE_CONTENT };

export const addBlockAtPath = (
	content: PageContent,
	location: BlockListLocation,
	type: string,
	id: string
): PageContent => {
	const next = createEditablePageContent(content);
	const list = getBlocksList(next.blocks, location);
	if (!list) return next;

	list.push(createDefaultBlockInstance(type, id));
	return next;
};

export const addReusableBlockReference = (
	content: PageContent,
	reusableBlockId: string,
	id: string
): PageContent => {
	const next = createEditablePageContent(content);
	const reference: ReusableBlockReference = {
		id,
		type: 'reusable',
		reusableBlockId
	};
	next.blocks.push(reference);
	return next;
};

export const removeBlockAtPath = (content: PageContent, path: BlockPath): PageContent => {
	const next = createEditablePageContent(content);
	const parentList = getBlockParentList(next.blocks, path);
	if (!parentList) return next;

	parentList.splice(path[path.length - 1], 1);
	return next;
};

export const moveBlock = (content: PageContent, from: BlockPath, toIndex: number): PageContent => {
	const next = createEditablePageContent(content);
	const parentList = getBlockParentList(next.blocks, from);
	if (!parentList) return next;

	const fromIndex = from[from.length - 1];
	if (toIndex < 0 || toIndex >= parentList.length || toIndex === fromIndex) {
		return next;
	}

	const [moved] = parentList.splice(fromIndex, 1);
	if (!moved) return next;

	parentList.splice(toIndex, 0, moved);
	return next;
};

export const updateBlockFieldValue = (
	content: PageContent,
	path: BlockPath,
	fieldKey: string,
	value: BlockValue | undefined
): PageContent => {
	const next = createEditablePageContent(content);
	const block = getBlockAtPath(next.blocks, path);
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
	field: BlockFieldDefinition
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
			if (value === '') return field.required ? `${field.label} is required.` : null;
			return typeof value === 'number' && Number.isFinite(value)
				? null
				: `${field.label} must be a number.`;
		case 'boolean':
			return typeof value === 'boolean' ? null : `${field.label} must be true or false.`;
		case 'blocks':
			return Array.isArray(value) ? null : `${field.label} must be a list of blocks.`;
	}
};

export const validatePageContentEditorState = (
	content: PageContent,
	reusableBlockIds: Set<string> | null = null
): PageContentValidationErrors => {
	const errors: PageContentValidationErrors = {};

	const visitBlocks = (blocks: PageBlockNode[] | BlockInstance[], listLocation: string, allowReusableReferences: boolean) => {
		blocks.forEach((block, index) => {
			const pathKey = listLocation ? `${listLocation}.${index}` : String(index);

			if (isReusableBlockReference(block)) {
				if (!allowReusableReferences) {
					errors[pathKey] = 'Reusable block references are only allowed at the top level.';
					return;
				}

				if (reusableBlockIds && !reusableBlockIds.has(block.reusableBlockId)) {
					errors[pathKey] = 'Referenced reusable block no longer exists.';
				}
				return;
			}

			const definition = getBlockDefinition(block.type);

			if (!definition) {
				errors[pathKey] = `Unknown block type: ${block.type}`;
				return;
			}

			for (const field of definition.fields) {
				const value = block.fields[field.key];
				const fieldError = validateFieldValue(value, field);
				if (fieldError) {
					errors[`${pathKey}:${field.key}`] = fieldError;
				}

				if (field.type === 'blocks' && Array.isArray(value)) {
					const allowedTypes = new Set(field.blocks?.allowedTypes ?? []);
					value.forEach((nestedBlock, nestedIndex) => {
						if (allowedTypes.size > 0 && !allowedTypes.has(nestedBlock.type)) {
							errors[`${pathKey}:${field.key}.${nestedIndex}`] =
								`${nestedBlock.type} is not allowed in ${field.label}.`;
						}
					});
					visitBlocks(value, `${pathKey}:${field.key}`, false);
				}
			}
		});
	};

	visitBlocks(content.blocks, '', true);
	return errors;
};
