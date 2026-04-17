import type { Page } from '$lib/types';

export const pageHasDraftChanges = (
	page: Pick<Page, 'draft_version_id' | 'published_version_id' | 'has_unpublished_changes'>
) => {
	if (typeof page.has_unpublished_changes === 'boolean') {
		return page.has_unpublished_changes;
	}

	const draftVersionId = page.draft_version_id ?? null;
	const publishedVersionId = page.published_version_id ?? null;

	if (draftVersionId === null) return false;
	if (publishedVersionId === null) return true;

	return draftVersionId !== publishedVersionId;
};

export const pageIsPublished = (page: Pick<Page, 'published_version_id' | 'is_published'>) => {
	if (typeof page.is_published === 'boolean') {
		return page.is_published;
	}

	return (page.published_version_id ?? null) !== null;
};

export const getPagePublishState = (
	page: Pick<
		Page,
		'draft_version_id' | 'published_version_id' | 'has_unpublished_changes' | 'is_published'
	>
) => {
	if (!pageIsPublished(page)) return 'unpublished' as const;
	if (pageHasDraftChanges(page)) return 'draft-changes' as const;
	return 'published' as const;
};
