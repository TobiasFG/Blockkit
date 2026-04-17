import { describe, expect, it } from 'vitest';
import type { BlockInstance } from '$lib/pageContent';
import {
	addNestedReusableBlockAtPath,
	createEditableReusableBlockContent,
	moveNestedReusableBlock,
	parseSubmittedReusableBlockContent,
	removeNestedReusableBlockAtPath,
	updateReusableBlockFieldValue,
	validateReusableBlockEditorState
} from '$lib/reusableBlockEditor';

const BASE_BLOCK: BlockInstance = {
	id: 'section-1',
	type: 'section',
	fields: {
		title: 'Highlights',
		items: [
			{
				id: 'text-1',
				type: 'text',
				fields: {
					body: 'Nested copy'
				}
			}
		]
	}
};

describe('reusable block editor helpers', () => {
	it('creates an editable clone', () => {
		const next = createEditableReusableBlockContent(BASE_BLOCK);
		expect(next).toEqual(BASE_BLOCK);
		expect(next).not.toBe(BASE_BLOCK);
		expect(next.fields).not.toBe(BASE_BLOCK.fields);
	});

	it('adds, updates, removes, and reorders nested blocks', () => {
		const added = addNestedReusableBlockAtPath(
			BASE_BLOCK,
			{ parentPath: [], fieldKey: 'items' },
			'text',
			'text-2'
		);
		expect((added.fields.items as BlockInstance[])).toHaveLength(2);

		const updated = updateReusableBlockFieldValue(added, [1], 'body', 'Updated nested copy');
		expect(((updated.fields.items as BlockInstance[])[1].fields.body)).toBe('Updated nested copy');

		const moved = moveNestedReusableBlock(updated, [1], 0);
		expect((moved.fields.items as BlockInstance[]).map((block) => block.id)).toEqual([
			'text-2',
			'text-1'
		]);

		const removed = removeNestedReusableBlockAtPath(moved, [1]);
		expect((removed.fields.items as BlockInstance[]).map((block) => block.id)).toEqual(['text-2']);
	});

	it('validates root and nested fields', () => {
		const errors = validateReusableBlockEditorState({
			id: 'hero-root',
			type: 'hero',
			fields: {
				heading: ''
			}
		});

		expect(errors['root:heading']).toBe('Heading is required.');

		const nestedErrors = validateReusableBlockEditorState({
			...BASE_BLOCK,
			fields: {
				title: 'Container',
				items: [
					{
						id: 'text-1',
						type: 'text',
						fields: {
							body: ''
						}
					}
				]
			}
		});

		expect(nestedErrors['0:body']).toBe('Body is required.');
	});

	it('parses submitted reusable block content JSON and rejects invalid payloads', () => {
		expect(parseSubmittedReusableBlockContent(JSON.stringify(BASE_BLOCK))).toEqual(BASE_BLOCK);
		expect(
			parseSubmittedReusableBlockContent(
				'{"id":"x","type":"text","fields":{}}'
			)
		).toBeNull();
		expect(parseSubmittedReusableBlockContent('not-json')).toBeNull();
	});
});
