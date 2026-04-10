import type { Page } from '$lib/types';

export const pageHasDraftChanges = (page: Pick<Page, 'draft_version_id' | 'published_version_id'>) => {
	const draftVersionId = page.draft_version_id ?? null;
	const publishedVersionId = page.published_version_id ?? null;

	if (draftVersionId === null) return false;
	if (publishedVersionId === null) return true;

	return draftVersionId !== publishedVersionId;
};
