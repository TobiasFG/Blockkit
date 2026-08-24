import { describe, expect, it } from 'vitest';
import type { PageContent } from '$lib/pageContent';
import {
	addReusableBlockReference,
	createEditablePageContent,
	insertReusableBlockReferenceAtIndex,
	moveBlock,
	parseSubmittedPageContent,
	removeBlockAtPath,
	validatePageContentEditorState
} from '$lib/pageContentEditor';

const KNOWN_BLOCKS = [
	{ id: 'block-1', block_type: 'hero' as const },
	{ id: 'block-2', block_type: 'section' as const }
];

const BASE_CONTENT: PageContent = {
	version: 1,
	layout: null,
	blocks: [
		{ id: 'ref-1', type: 'reusable', reusableBlockId: 'block-1' },
		{ id: 'ref-2', type: 'reusable', reusableBlockId: 'block-2' }
	]
};

describe('page content editor helpers', () => {
	it('creates an editable clone', () => {
		const next = createEditablePageContent(BASE_CONTENT);
		expect(next).toEqual(BASE_CONTENT);
		expect(next).not.toBe(BASE_CONTENT);
		expect(next.blocks).not.toBe(BASE_CONTENT.blocks);
	});

	it('removes and reorders top-level references', () => {
		const removed = removeBlockAtPath(BASE_CONTENT, [0]);
		expect(removed.blocks.map((block) => block.id)).toEqual(['ref-2']);

		const moved = moveBlock(BASE_CONTENT, [1], 0);
		expect(moved.blocks.map((block) => block.id)).toEqual(['ref-2', 'ref-1']);
	});

	it('parses submitted content JSON and rejects invalid payloads', () => {
		expect(parseSubmittedPageContent(JSON.stringify(BASE_CONTENT))).toEqual(BASE_CONTENT);
		expect(
			parseSubmittedPageContent('{"version":1,"layout":null,"blocks":[{"id":"x","type":"text","fields":{}}]}')
		).toBeNull();
		expect(parseSubmittedPageContent('not-json')).toBeNull();
	});

	it('adds reusable block references at the top level', () => {
		const next = addReusableBlockReference(BASE_CONTENT, 'block-1', 'ref-3');
		expect(next.blocks[2]).toEqual({
			id: 'ref-3',
			type: 'reusable',
			reusableBlockId: 'block-1'
		});
	});

	it('inserts reusable block references at a specific top-level index', () => {
		const next = insertReusableBlockReferenceAtIndex(BASE_CONTENT, 'block-1', 'ref-3', 1);
		expect(next.blocks.map((block) => block.id)).toEqual(['ref-1', 'ref-3', 'ref-2']);
	});

	it('flags references to unknown content items', () => {
		const withMissingReference: PageContent = {
			version: 1,
			layout: null,
			blocks: [{ id: 'ref-1', type: 'reusable', reusableBlockId: 'missing' }]
		};

		expect(validatePageContentEditorState(withMissingReference, KNOWN_BLOCKS)).toEqual({
			'0': 'Referenced reusable block no longer exists.'
		});
	});

	it('rejects top-level inline page blocks', () => {
		const inlineContent: PageContent = {
			version: 1,
			layout: null,
			blocks: [{ id: 'hero-1', type: 'hero', fields: { heading: 'Welcome' } }]
		};

		expect(validatePageContentEditorState(inlineContent, KNOWN_BLOCKS)).toEqual({
			'0': 'Top-level page content must come from Content library.'
		});
	});
});
