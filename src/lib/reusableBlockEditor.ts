import { getBlockDefinition, type BlockFieldDefinition } from '$lib/blocks/registry';
import type { BlockInstance, BlockValue } from '$lib/pageContent';
import { createDefaultBlockInstance, isValidBlockInstance } from '$lib/reusableBlocks';
import type { BlockListLocation, BlockPath, PageContentValidationErrors } from '$lib/pageContentEditor';

export type ReusableBlockValidationErrors = PageContentValidationErrors;

const cloneBlock = (block: BlockInstance): BlockInstance => ({
	...block,
	fields: Object.fromEntries(
		Object.entries(block.fields).map(([key, value]) => [
			key,
			Array.isArray(value) ? value.map((item) => cloneBlock(item)) : value
		])
	) as Record<string, BlockValue>
});

const getBlockAtPath = (root: BlockInstance, path: BlockPath): BlockInstance | null => {
	let current: BlockInstance | null = root;

	for (const index of path) {
		if (!current) return null;

		const definition = getBlockDefinition(current.type);
		if (!definition) return null;

		let next: BlockInstance | null = null;
		for (const field of definition.fields) {
			if (field.type !== 'blocks') continue;
			const value: BlockValue | undefined = current.fields[field.key];
			if (!Array.isArray(value)) continue;
			next = value[index] ?? null;
			if (next) break;
		}

		current = next;
	}

	return current;
};

const getBlocksList = (root: BlockInstance, location: BlockListLocation): BlockInstance[] | null => {
	if (location.parentPath === null || location.fieldKey === null) return null;

	const parent = location.parentPath.length === 0 ? root : getBlockAtPath(root, location.parentPath);
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

const getParentList = (root: BlockInstance, path: BlockPath): BlockInstance[] | null => {
	if (path.length === 0) return null;

	const parentPath = path.slice(0, -1);
	if (parentPath.length === 0) {
		const rootDefinition = getBlockDefinition(root.type);
		if (!rootDefinition) return null;

		for (const field of rootDefinition.fields) {
			if (field.type !== 'blocks') continue;
			const value: BlockValue | undefined = root.fields[field.key];
			if (!Array.isArray(value)) continue;
			if (value[path[0]]) return value;
		}

		return null;
	}

	const parent = getBlockAtPath(root, parentPath);
	if (!parent) return null;

	const definition = getBlockDefinition(parent.type);
	if (!definition) return null;

	for (const field of definition.fields) {
		if (field.type !== 'blocks') continue;
		const value: BlockValue | undefined = parent.fields[field.key];
		if (!Array.isArray(value)) continue;
		if (value[path[path.length - 1]]) return value;
	}

	return null;
};

export const parseSubmittedReusableBlockContent = (value: string): BlockInstance | null => {
	try {
		const parsed: unknown = JSON.parse(value);
		return isValidBlockInstance(parsed) ? parsed : null;
	} catch {
		return null;
	}
};

export const createEditableReusableBlockContent = (content: BlockInstance): BlockInstance =>
	cloneBlock(content);

export const updateReusableBlockFieldValue = (
	content: BlockInstance,
	path: BlockPath,
	fieldKey: string,
	value: BlockValue | undefined
): BlockInstance => {
	const next = createEditableReusableBlockContent(content);
	const block = path.length === 0 ? next : getBlockAtPath(next, path);
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

export const addNestedReusableBlockAtPath = (
	content: BlockInstance,
	location: BlockListLocation,
	type: string,
	id: string
): BlockInstance => {
	const next = createEditableReusableBlockContent(content);
	const list = getBlocksList(next, location);
	if (!list) return next;

	list.push(createDefaultBlockInstance(type, id));
	return next;
};

export const removeNestedReusableBlockAtPath = (
	content: BlockInstance,
	path: BlockPath
): BlockInstance => {
	const next = createEditableReusableBlockContent(content);
	const parentList = getParentList(next, path);
	if (!parentList) return next;

	parentList.splice(path[path.length - 1], 1);
	return next;
};

export const moveNestedReusableBlock = (
	content: BlockInstance,
	from: BlockPath,
	toIndex: number
): BlockInstance => {
	const next = createEditableReusableBlockContent(content);
	const parentList = getParentList(next, from);
	if (!parentList) return next;

	const fromIndex = from[from.length - 1];
	if (toIndex < 0 || toIndex >= parentList.length || fromIndex === toIndex) {
		return next;
	}

	const [moved] = parentList.splice(fromIndex, 1);
	if (!moved) return next;

	parentList.splice(toIndex, 0, moved);
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
			return typeof value === 'number' && Number.isFinite(value)
				? null
				: `${field.label} must be a number.`;
		case 'boolean':
			return typeof value === 'boolean' ? null : `${field.label} must be true or false.`;
		case 'blocks':
			return Array.isArray(value) ? null : `${field.label} must be a list of blocks.`;
	}
};

export const validateReusableBlockEditorState = (
	content: BlockInstance
): ReusableBlockValidationErrors => {
	const errors: ReusableBlockValidationErrors = {};

	const visitBlock = (block: BlockInstance, pathKey: string) => {
		const definition = getBlockDefinition(block.type);
		if (!definition) {
			errors[pathKey || 'root'] = `Unknown block type: ${block.type}`;
			return;
		}

		for (const field of definition.fields) {
			const value = block.fields[field.key];
			const fieldError = validateFieldValue(value, field);
			if (fieldError) {
				errors[`${pathKey || 'root'}:${field.key}`] = fieldError;
			}

			if (field.type === 'blocks' && Array.isArray(value)) {
				const allowedTypes = new Set(field.blocks?.allowedTypes ?? []);
				value.forEach((nestedBlock, nestedIndex) => {
					const nestedPathKey = pathKey ? `${pathKey}:${field.key}.${nestedIndex}` : `${nestedIndex}`;
					if (allowedTypes.size > 0 && !allowedTypes.has(nestedBlock.type)) {
						errors[nestedPathKey] = `${nestedBlock.type} is not allowed in ${field.label}.`;
					}
					visitBlock(nestedBlock, nestedPathKey);
				});
			}
		}
	};

	visitBlock(content, '');
	return errors;
};
