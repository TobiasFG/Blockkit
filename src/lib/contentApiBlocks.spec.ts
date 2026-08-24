import { describe, expect, it } from 'vitest';
import { resolveBlocks } from '$lib/contentApiBlocks';
import type { BlockInstance } from '$lib/pageContent';

const TEXT_BLOCK: BlockInstance = {
	id: 'stored-text',
	type: 'text',
	fields: { body: 'Shared copy' }
};

const SECTION_BLOCK: BlockInstance = {
	id: 'stored-section',
	type: 'section',
	fields: {
		title: 'Highlights',
		items: [{ id: 'nested-ref-1', type: 'reusable', reusableBlockId: 'text-item' }]
	}
};

const LIBRARY = new Map<string, BlockInstance>([
	['text-item', TEXT_BLOCK],
	['section-item', SECTION_BLOCK]
]);

const pageContent = (blocks: unknown[]) => ({ version: 1, layout: null, blocks });

describe('content API block resolution', () => {
	it('gives each placement of the same content item a distinct id', () => {
		const resolved = resolveBlocks(
			pageContent([
				{ id: 'placement-1', type: 'reusable', reusableBlockId: 'text-item' },
				{ id: 'placement-2', type: 'reusable', reusableBlockId: 'text-item' }
			]),
			LIBRARY
		);

		expect(resolved.map((block) => block.id)).toEqual(['placement-1', 'placement-2']);
		expect(new Set(resolved.map((block) => block.id)).size).toBe(resolved.length);
		expect(resolved.every((block) => block.fields.body === 'Shared copy')).toBe(true);
	});

	it('expands references nested in a blocks field', () => {
		const [section] = resolveBlocks(
			pageContent([{ id: 'placement-1', type: 'reusable', reusableBlockId: 'section-item' }]),
			LIBRARY
		);

		expect(section.fields.items).toEqual([
			{ id: 'nested-ref-1', type: 'text', fields: { body: 'Shared copy' } }
		]);
	});

	it('drops references that cannot be resolved', () => {
		expect(
			resolveBlocks(
				pageContent([{ id: 'placement-1', type: 'reusable', reusableBlockId: 'missing' }]),
				LIBRARY
			)
		).toEqual([]);
	});

	it('stops expanding a reference that cycles back into itself', () => {
		const selfReferencing: BlockInstance = {
			id: 'stored-loop',
			type: 'section',
			fields: {
				title: 'Loop',
				items: [{ id: 'nested-loop-ref', type: 'reusable', reusableBlockId: 'loop-item' }]
			}
		};

		const [block] = resolveBlocks(
			pageContent([{ id: 'placement-1', type: 'reusable', reusableBlockId: 'loop-item' }]),
			new Map([['loop-item', selfReferencing]])
		);

		expect(block.fields.items).toEqual([]);
	});
});
