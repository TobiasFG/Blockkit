import {
	getBlockDefinition,
	isBlockType,
	type BlockDefinition,
	type BlockFieldDefinition,
	type BlockType
} from '$lib/blocks/registry';
import type { BlockInstance, BlockValue, ReusableBlockReference } from '$lib/pageContent';
import { isReusableBlockReference } from '$lib/pageContent';

export type ReusableBlockDraft = {
	name: string;
	folder_id: string | null;
	block_type: BlockType;
	content: BlockInstance;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const isIsoLikeDateString = (value: string): boolean => {
	if (!value.trim()) return false;
	return !Number.isNaN(Date.parse(value));
};

const isBlockValueOfType = (value: unknown, field: BlockFieldDefinition): value is BlockValue => {
	switch (field.type) {
		case 'string':
			return typeof value === 'string';
		case 'date':
			return typeof value === 'string' && isIsoLikeDateString(value);
		case 'number':
			return typeof value === 'number' && Number.isFinite(value);
		case 'boolean':
			return typeof value === 'boolean';
		case 'blocks':
			if (!Array.isArray(value)) return false;
			return value.every((item) => isReusableBlockReference(item));
	}
};

const hasRequiredFieldValue = (value: BlockValue | undefined, field: BlockFieldDefinition): boolean => {
	if (value === undefined || value === null) return false;
	if (field.type === 'blocks') return Array.isArray(value);
	return true;
};

const normalizeFieldValue = (
	value: unknown,
	field: BlockFieldDefinition
): BlockValue | undefined => {
	switch (field.type) {
		case 'string':
			return typeof value === 'string' ? value : undefined;
		case 'date':
			if (typeof value !== 'string') return undefined;
			return value.trim() ? value : undefined;
		case 'number':
			return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
		case 'boolean':
			return typeof value === 'boolean' ? value : undefined;
		case 'blocks':
			if (!Array.isArray(value)) return undefined;
			return value
				.filter((item): item is ReusableBlockReference => isReusableBlockReference(item))
				.map((item) => ({ id: item.id, type: 'reusable' as const, reusableBlockId: item.reusableBlockId }));
	}
};

export const areValidBlockFields = (
	fields: Record<string, unknown>,
	definition: BlockDefinition
): fields is Record<string, BlockValue> => {
	const definitionsByKey = new Map(definition.fields.map((field) => [field.key, field]));

	for (const key of Object.keys(fields)) {
		if (!definitionsByKey.has(key)) {
			return false;
		}
	}

	for (const field of definition.fields) {
		const value = fields[field.key];
		if (value === undefined) {
			if (field.required) {
				return false;
			}
			continue;
		}

		if (!isBlockValueOfType(value, field)) {
			return false;
		}

		if (field.required && !hasRequiredFieldValue(value, field)) {
			return false;
		}
	}

	return true;
};

export const isValidBlockInstance = (value: unknown): value is BlockInstance => {
	if (!isObject(value)) return false;
	if (typeof value.id !== 'string' || !value.id.trim()) return false;
	if (typeof value.type !== 'string' || !isBlockType(value.type)) return false;
	if (!isObject(value.fields)) return false;

	const definition = getBlockDefinition(value.type);
	if (!definition) return false;

	return areValidBlockFields(value.fields, definition);
};

export const normalizeBlockInstance = (value: unknown): BlockInstance | null => {
	if (!isObject(value)) return null;
	if (typeof value.id !== 'string' || !value.id.trim()) return null;
	if (typeof value.type !== 'string' || !isBlockType(value.type)) return null;
	if (!isObject(value.fields)) return null;

	const definition = getBlockDefinition(value.type);
	if (!definition) return null;

	const nextFields: Record<string, BlockValue> = {};

	for (const field of definition.fields) {
		const normalized = normalizeFieldValue(value.fields[field.key], field);
		if (normalized === undefined) {
			if (field.required) return null;
			continue;
		}

		if (!isBlockValueOfType(normalized, field)) {
			return null;
		}

		nextFields[field.key] = normalized;
	}

	return {
		id: value.id,
		type: value.type,
		fields: nextFields
	};
};

export const createDefaultBlockInstance = (type: string, id: string): BlockInstance => {
	const definition = getBlockDefinition(type);

	if (!definition) {
		throw new Error(`Unknown block type: ${type}`);
	}

	const entries: [string, BlockValue][] = [];

	for (const field of definition.fields) {
		switch (field.type) {
			case 'string':
				entries.push([field.key, '']);
				break;
			case 'boolean':
				entries.push([field.key, false]);
				break;
			case 'blocks':
				entries.push([field.key, []]);
				break;
			case 'date':
			case 'number':
				break;
		}
	}

	const fields = Object.fromEntries(entries) as Record<string, BlockValue>;

	return {
		id,
		type: definition.type,
		fields
	};
};

export const isReusableBlockDraft = (value: unknown): value is ReusableBlockDraft => {
	if (!isObject(value)) return false;
	if (typeof value.name !== 'string') return false;
	if (!(typeof value.folder_id === 'string' || value.folder_id === null)) return false;
	if (typeof value.block_type !== 'string' || !isBlockType(value.block_type)) return false;
	if (!isValidBlockInstance(value.content)) return false;
	if (value.content.type !== value.block_type) return false;
	return true;
};
