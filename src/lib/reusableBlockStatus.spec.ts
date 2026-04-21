import { describe, expect, it } from 'vitest';
import {
	getReusableBlockPublishState,
	reusableBlockHasDraftChanges,
	reusableBlockIsPublished
} from '$lib/reusableBlockStatus';

describe('reusable block draft status', () => {
	it('treats unpublished content with a draft version as draft', () => {
		expect(
			reusableBlockHasDraftChanges({
				draft_version_id: 'draft-1',
				published_version_id: null
			})
		).toBe(true);
	});

	it('treats matching published and draft versions as not draft', () => {
		expect(
			reusableBlockHasDraftChanges({
				draft_version_id: 'version-1',
				published_version_id: 'version-1'
			})
		).toBe(false);
	});

	it('prefers explicit unpublished-change state when present', () => {
		expect(
			reusableBlockHasDraftChanges({
				draft_version_id: 'draft-1',
				published_version_id: 'published-1',
				has_unpublished_changes: false
			})
		).toBe(false);
	});

	it('treats explicit published state as source of truth', () => {
		expect(
			reusableBlockIsPublished({
				published_version_id: null,
				is_published: true
			})
		).toBe(true);
	});

	it('builds unpublished state from explicit flags', () => {
		expect(
			getReusableBlockPublishState({
				draft_version_id: 'draft-1',
				published_version_id: null,
				has_unpublished_changes: true,
				is_published: false
			})
		).toBe('unpublished');
	});

	it('builds draft-change state from explicit flags', () => {
		expect(
			getReusableBlockPublishState({
				draft_version_id: 'draft-1',
				published_version_id: 'published-1',
				has_unpublished_changes: true,
				is_published: true
			})
		).toBe('draft-changes');
	});

	it('builds published state from explicit flags', () => {
		expect(
			getReusableBlockPublishState({
				draft_version_id: 'draft-1',
				published_version_id: 'published-1',
				has_unpublished_changes: false,
				is_published: true
			})
		).toBe('published');
	});
});
