import { describe, expect, it } from 'vitest';
import { getBlockDefinition, listBlockDefinitions } from '$lib/blocks/registry';
import {
	EMPTY_PAGE_CONTENT,
	isPageContent,
	isReusableBlockReference,
	parsePageContent,
	serializePageContent,
	type PageContent
} from '$lib/pageContent';

describe('block registry', () => {
	it('exposes the seeded initial block definitions', () => {
		expect(listBlockDefinitions().map((definition) => definition.type)).toEqual([
			'text',
			'hero',
			'section'
		]);
		expect(getBlockDefinition('hero')?.fields.map((field) => field.key)).toEqual([
			'heading',
			'description',
			'publishedOn',
			'priority'
		]);
	});
});

describe('page content helpers', () => {
	it('returns empty defaults when content is missing or invalid', () => {
		expect(parsePageContent(null)).toEqual(EMPTY_PAGE_CONTENT);
		expect(parsePageContent({ version: 1, blocks: [] })).toEqual(EMPTY_PAGE_CONTENT);
		expect(parsePageContent({ version: 2, layout: null, blocks: [] })).toEqual(EMPTY_PAGE_CONTENT);
	});

	it('parses typed page content with primitive fields and nested content references', () => {
		const content = {
			version: 1,
			layout: null,
			blocks: [
				{
					id: 'hero-1',
					type: 'hero',
					fields: {
						heading: 'Welcome',
						publishedOn: '2026-04-09',
						priority: 3
					}
				},
				{
					id: 'section-1',
					type: 'section',
					fields: {
						title: 'Highlights',
						items: [
							{
								id: 'ref-1',
								type: 'reusable',
								reusableBlockId: 'block-123'
							}
						]
					}
				}
			]
		};

		expect(parsePageContent(content)).toEqual(content);
		expect(isPageContent(content)).toBe(true);
	});

	it('accepts top-level reusable block references', () => {
		const content = {
			version: 1,
			layout: null,
			blocks: [
				{
					id: 'ref-1',
					type: 'reusable',
					reusableBlockId: 'block-123'
				}
			]
		};

		expect(isReusableBlockReference(content.blocks[0])).toBe(true);
		expect(parsePageContent(content)).toEqual(content);
		expect(isPageContent(content)).toBe(true);
	});

	it('rejects unknown fields, invalid dates, and inline blocks nested in a blocks field', () => {
		expect(
			isPageContent({
				version: 1,
				layout: null,
				blocks: [
					{
						id: 'text-1',
						type: 'text',
						fields: {
							body: 'Hello',
							extra: 'not allowed'
						}
					}
				]
			})
		).toBe(false);

		expect(
			isPageContent({
				version: 1,
				layout: null,
				blocks: [
					{
						id: 'hero-1',
						type: 'hero',
						fields: {
							heading: 'Welcome',
							publishedOn: 'not-a-date'
						}
					}
				]
			})
		).toBe(false);

		expect(
			isPageContent({
				version: 1,
				layout: null,
				blocks: [
					{
						id: 'section-1',
						type: 'section',
						fields: {
							items: [
								{
									id: 'text-1',
									type: 'text',
									fields: { body: 'Inline blocks are not allowed' }
								}
							]
						}
					}
				]
			})
		).toBe(false);

		expect(
			isPageContent({
				version: 1,
				layout: null,
				blocks: [
					{
						id: 'ref-1',
						type: 'reusable'
					}
				]
			})
		).toBe(false);
	});

	it('serializes valid content and throws for invalid content', () => {
		const content: PageContent = {
			version: 1,
			layout: null,
			blocks: [
				{
					id: 'text-1',
					type: 'text',
					fields: {
						body: 'Hello world'
					}
				}
			]
		};

		expect(serializePageContent(content)).toEqual(content);
		expect(() =>
			serializePageContent({
				version: 1,
				layout: null,
				blocks: [
					{
						id: 'bad-1',
						type: 'text',
						fields: {}
					}
				]
			})
		).toThrow('Invalid page content');
	});
});
