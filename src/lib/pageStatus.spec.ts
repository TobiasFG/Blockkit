import { describe, expect, it } from 'vitest';
import { pageHasDraftChanges } from '$lib/pageStatus';

describe('page draft status', () => {
	it('treats unpublished pages with a draft version as draft', () => {
		expect(
			pageHasDraftChanges({
				draft_version_id: 'draft-1',
				published_version_id: null
			})
		).toBe(true);
	});

	it('treats matching published and draft versions as not draft', () => {
		expect(
			pageHasDraftChanges({
				draft_version_id: 'version-1',
				published_version_id: 'version-1'
			})
		).toBe(false);
	});

	it('treats mismatched draft and published versions as draft changes', () => {
		expect(
			pageHasDraftChanges({
				draft_version_id: 'draft-2',
				published_version_id: 'published-1'
			})
		).toBe(true);
	});

	it('ignores pages without a draft version pointer', () => {
		expect(
			pageHasDraftChanges({
				draft_version_id: null,
				published_version_id: 'published-1'
			})
		).toBe(false);
	});
});
