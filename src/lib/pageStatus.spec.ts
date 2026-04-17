import { describe, expect, it } from 'vitest';
import { getPagePublishState, pageHasDraftChanges, pageIsPublished } from '$lib/pageStatus';

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

	it('prefers explicit unpublished-change state when present', () => {
		expect(
			pageHasDraftChanges({
				draft_version_id: 'draft-1',
				published_version_id: 'published-1',
				has_unpublished_changes: false
			})
		).toBe(false);
	});

	it('treats explicit published state as source of truth', () => {
		expect(
			pageIsPublished({
				published_version_id: null,
				is_published: true
			})
		).toBe(true);
	});

	it('builds unpublished state from explicit flags', () => {
		expect(
			getPagePublishState({
				draft_version_id: 'draft-1',
				published_version_id: null,
				has_unpublished_changes: true,
				is_published: false
			})
		).toBe('unpublished');
	});

	it('builds draft-change state from explicit flags', () => {
		expect(
			getPagePublishState({
				draft_version_id: 'draft-1',
				published_version_id: 'published-1',
				has_unpublished_changes: true,
				is_published: true
			})
		).toBe('draft-changes');
	});

	it('builds published state from explicit flags', () => {
		expect(
			getPagePublishState({
				draft_version_id: 'draft-1',
				published_version_id: 'published-1',
				has_unpublished_changes: false,
				is_published: true
			})
		).toBe('published');
	});
});
