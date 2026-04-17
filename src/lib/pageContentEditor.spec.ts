import { describe, expect, it } from 'vitest';
import type { BlockInstance, PageContent } from '$lib/pageContent';
import {
	addBlockAtPath,
	addReusableBlockReference,
	createEditablePageContent,
	insertReusableBlockReferenceAtIndex,
	moveBlock,
	parseSubmittedPageContent,
	removeBlockAtPath,
	updateBlockFieldValue,
	validatePageContentEditorState
} from '$lib/pageContentEditor';

const BASE_CONTENT: PageContent = {
	version: 1,
	layout: null,
	blocks: [
		{
			id: 'hero-1',
			type: 'hero',
			fields: {
				heading: 'Welcome'
			}
		},
		{
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
		}
	]
};

describe('page content editor helpers', () => {
	it('creates an editable clone', () => {
		const next = createEditablePageContent(BASE_CONTENT);
		expect(next).toEqual(BASE_CONTENT);
		expect(next).not.toBe(BASE_CONTENT);
		expect(next.blocks).not.toBe(BASE_CONTENT.blocks);
	});

	it('adds nested blocks at the requested list location', () => {
		const next = addBlockAtPath(
			BASE_CONTENT,
			{ parentPath: [1], fieldKey: 'items' },
			'text',
			'text-2'
		);

		const section = next.blocks[1] as BlockInstance;
		expect((section.fields.items as unknown[]).length).toBe(2);
		expect((section.fields.items as { id: string }[])[1].id).toBe('text-2');
	});

	it('updates fields and removes nested blocks', () => {
		const updated = updateBlockFieldValue(BASE_CONTENT, [0], 'heading', 'Updated');
		expect((updated.blocks[0] as BlockInstance).fields.heading).toBe('Updated');

		const removed = removeBlockAtPath(updated, [1, 0]);
		expect((removed.blocks[1] as BlockInstance).fields.items).toEqual([]);
	});

	it('reorders blocks within the same list', () => {
		const next = moveBlock(BASE_CONTENT, [1, 0], 0);
		expect(((next.blocks[1] as BlockInstance).fields.items as { id: string }[]).map((block) => block.id)).toEqual([
			'text-1'
		]);

		const rootMoved = moveBlock(BASE_CONTENT, [1], 0);
		expect(rootMoved.blocks.map((block) => block.id)).toEqual(['section-1', 'hero-1']);
	});

	it('parses submitted content JSON and rejects invalid payloads', () => {
		expect(parseSubmittedPageContent(JSON.stringify(BASE_CONTENT))).toEqual(BASE_CONTENT);
		expect(parseSubmittedPageContent('{"version":1,"layout":null,"blocks":[{"id":"x","type":"text","fields":{}}]}')).toBeNull();
		expect(parseSubmittedPageContent('not-json')).toBeNull();
	});

	it('adds reusable block references at the top level', () => {
		const next = addReusableBlockReference(BASE_CONTENT, 'block-1', 'ref-1');
		expect(next.blocks[2]).toEqual({
			id: 'ref-1',
			type: 'reusable',
			reusableBlockId: 'block-1'
		});
	});

	it('inserts reusable block references at a specific top-level index', () => {
		const next = insertReusableBlockReferenceAtIndex(BASE_CONTENT, 'block-1', 'ref-1', 1);
		expect(next.blocks.map((block) => block.id)).toEqual(['hero-1', 'ref-1', 'section-1']);
	});

	it('validates reusable block references against known ids and nesting rules', () => {
		const withMissingReference: PageContent = {
			version: 1,
			layout: null,
			blocks: [
				{
					id: 'ref-1',
					type: 'reusable',
					reusableBlockId: 'missing'
				}
			]
		};

		expect(validatePageContentEditorState(withMissingReference, new Set(['block-1']))).toEqual({
			'0': 'Referenced reusable block no longer exists.'
		});

		const withNestedReference: PageContent = {
			version: 1,
			layout: null,
			blocks: [
				{
					id: 'section-1',
					type: 'section',
					fields: {
						items: [
							{
								id: 'ref-2',
								type: 'reusable',
								reusableBlockId: 'block-1'
							} as never
						]
					}
				}
			]
		};

		expect(validatePageContentEditorState(withNestedReference, new Set(['block-1']))).toEqual({
			'0': 'Top-level page content must come from Content library.'
		});
	});

	it('rejects top-level inline page blocks', () => {
		expect(validatePageContentEditorState(BASE_CONTENT, new Set(['block-1']))).toEqual({
			'0': 'Top-level page content must come from Content library.',
			'1': 'Top-level page content must come from Content library.'
		});
	});
});
