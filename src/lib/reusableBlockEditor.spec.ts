import { describe, expect, it } from 'vitest';
import type { BlockInstance, ReusableBlockReference } from '$lib/pageContent';
import {
	createEditableReusableBlockContent,
	insertNestedReferenceAtIndex,
	moveNestedReference,
	parseSubmittedReusableBlockContent,
	removeNestedReferenceAtIndex,
	updateReusableBlockFieldValue,
	validateReusableBlockEditorState
} from '$lib/reusableBlockEditor';

const ITEMS_LOCATION = { parentPath: [] as number[], fieldKey: 'items' };

const KNOWN_BLOCKS = [
	{ id: 'block-1', block_type: 'text' as const },
	{ id: 'block-2', block_type: 'text' as const }
];

const BASE_BLOCK: BlockInstance = {
	id: 'section-1',
	type: 'section',
	fields: {
		title: 'Highlights',
		items: [{ id: 'ref-1', type: 'reusable', reusableBlockId: 'block-1' }]
	}
};

const items = (block: BlockInstance) => block.fields.items as ReusableBlockReference[];

describe('reusable block editor helpers', () => {
	it('creates an editable clone', () => {
		const next = createEditableReusableBlockContent(BASE_BLOCK);
		expect(next).toEqual(BASE_BLOCK);
		expect(next).not.toBe(BASE_BLOCK);
		expect(next.fields).not.toBe(BASE_BLOCK.fields);
	});

	it('inserts, reorders, and removes nested content references', () => {
		const added = insertNestedReferenceAtIndex(BASE_BLOCK, ITEMS_LOCATION, 'block-2', 'ref-2', 1);
		expect(items(added).map((reference) => reference.reusableBlockId)).toEqual([
			'block-1',
			'block-2'
		]);

		const moved = moveNestedReference(added, ITEMS_LOCATION, 1, 0);
		expect(items(moved).map((reference) => reference.id)).toEqual(['ref-2', 'ref-1']);

		const removed = removeNestedReferenceAtIndex(moved, ITEMS_LOCATION, 1);
		expect(items(removed).map((reference) => reference.id)).toEqual(['ref-2']);
	});

	it('updates root fields', () => {
		const updated = updateReusableBlockFieldValue(BASE_BLOCK, [], 'title', 'Updated');
		expect(updated.fields.title).toBe('Updated');
	});

	it('validates root fields and nested references', () => {
		const errors = validateReusableBlockEditorState({
			id: 'hero-root',
			type: 'hero',
			fields: { heading: '' }
		});

		expect(errors['root:heading']).toBe('Heading is required.');

		const missingReference = validateReusableBlockEditorState(
			{
				...BASE_BLOCK,
				fields: {
					title: 'Container',
					items: [{ id: 'ref-9', type: 'reusable', reusableBlockId: 'missing' }]
				}
			},
			KNOWN_BLOCKS
		);

		expect(missingReference['root:items.0']).toBe('Referenced content item no longer exists.');
	});

	it('rejects nested content whose type is not allowed by the field', () => {
		const errors = validateReusableBlockEditorState(BASE_BLOCK, [
			{ id: 'block-1', block_type: 'text' }
		]);

		expect(errors).toEqual({});
	});

	it('parses submitted reusable block content JSON and rejects invalid payloads', () => {
		expect(parseSubmittedReusableBlockContent(JSON.stringify(BASE_BLOCK))).toEqual(BASE_BLOCK);
		expect(parseSubmittedReusableBlockContent('{"id":"x","type":"text","fields":{}}')).toBeNull();
		expect(parseSubmittedReusableBlockContent('not-json')).toBeNull();
	});
});
