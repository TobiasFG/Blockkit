import { describe, expect, it } from 'vitest';
import {
	areValidBlockFields,
	createDefaultBlockInstance,
	isReusableBlockDraft,
	isValidBlockInstance,
	normalizeBlockInstance
} from '$lib/reusableBlocks';
import { getBlockDefinition } from '$lib/blocks/registry';
import { buildReusableBlocksTree, collectReusableBlockFolderAncestors } from '$lib/sidebar';

describe('reusable block helpers', () => {
	it('creates default block instances from the registry', () => {
		expect(createDefaultBlockInstance('hero', 'hero-1')).toEqual({
			id: 'hero-1',
			type: 'hero',
			fields: {
				heading: ''
			}
		});
	});

	it('validates single block instances and reusable block payloads', () => {
		const block = {
			id: 'text-1',
			type: 'text',
			fields: {
				body: 'Hello'
			}
		};

		expect(isValidBlockInstance(block)).toBe(true);
		expect(
			isReusableBlockDraft({
				name: 'Intro copy',
				folder_id: null,
				block_type: 'text',
				content: block
			})
		).toBe(true);
	});

	it('rejects invalid fields for a known definition', () => {
		expect(
			areValidBlockFields(
				{
					body: 'Hello',
					extra: 'not allowed'
				},
				getBlockDefinition('text')!
			)
		).toBe(false);
	});

	it('normalizes legacy optional empty values while keeping valid block content', () => {
		expect(
			normalizeBlockInstance({
				id: 'hero-1',
				type: 'hero',
				fields: {
					heading: 'Welcome',
					publishedOn: ''
				}
			})
		).toEqual({
			id: 'hero-1',
			type: 'hero',
			fields: {
				heading: 'Welcome'
			}
		});
	});
});

describe('reusable block tree', () => {
	it('builds folder trees and finds ancestor folders', () => {
		const tree = buildReusableBlocksTree(
			[
				{
					id: 'folder-1',
					name: 'Headers',
					parent_id: null,
					sort_order: 0,
					created_at: '',
					updated_at: ''
				},
				{
					id: 'folder-2',
					name: 'Landing',
					parent_id: 'folder-1',
					sort_order: 0,
					created_at: '',
					updated_at: ''
				}
			],
			[
				{
					id: 'block-1',
					name: 'Homepage hero',
					folder_id: 'folder-2',
					block_type: 'hero',
					content: createDefaultBlockInstance('hero', 'hero-1'),
					draft_version_id: 'draft-1',
					published_version_id: 'published-1',
					has_unpublished_changes: false,
					is_published: true,
					last_published_at: '',
					created_at: '',
					updated_at: ''
				}
			]
		);

		expect(tree.folders).toHaveLength(1);
		expect(tree.folders[0].folders[0].blocks[0].name).toBe('Homepage hero');
		expect(collectReusableBlockFolderAncestors(tree, 'folder-2')).toEqual(['folder-1']);
	});
});
