import { describe, expect, it } from 'vitest';
import {
	EMPTY_PAGE_SEO_META,
	parsePageSeoMeta,
	serializePageSeoMeta
} from '$lib/pageSeoMeta';

describe('page SEO metadata helpers', () => {
	it('returns empty defaults when metadata is missing', () => {
		expect(parsePageSeoMeta(null)).toEqual(EMPTY_PAGE_SEO_META);
		expect(parsePageSeoMeta({})).toEqual(EMPTY_PAGE_SEO_META);
	});

	it('parses typed SEO values from page version metadata', () => {
		expect(
			parsePageSeoMeta({
				seo: {
					title: ' About Blockkit ',
					description: ' Description ',
					canonicalUrl: ' https://example.com/about ',
					ogImageUrl: ' https://example.com/about.png ',
					noIndex: true,
					noFollow: false
				}
			})
		).toEqual({
			title: 'About Blockkit',
			description: 'Description',
			canonicalUrl: 'https://example.com/about',
			ogImageUrl: 'https://example.com/about.png',
			noIndex: true,
			noFollow: false
		});
	});

	it('preserves unrelated metadata when serializing SEO values', () => {
		expect(
			serializePageSeoMeta(
				{ theme: 'marketing', seo: { title: 'Old' } },
				{
					title: '',
					description: 'Fresh description',
					canonicalUrl: '',
					ogImageUrl: '',
					noIndex: false,
					noFollow: true
				}
			)
		).toEqual({
			theme: 'marketing',
			seo: {
				title: null,
				description: 'Fresh description',
				canonicalUrl: null,
				ogImageUrl: null,
				noIndex: false,
				noFollow: true
			}
		});
	});
});
