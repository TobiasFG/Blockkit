import type { ReusableBlock } from '$lib/types';

export const reusableBlockHasDraftChanges = (
	block: Pick<ReusableBlock, 'draft_version_id' | 'published_version_id'> &
		Partial<Pick<ReusableBlock, 'has_unpublished_changes'>>
) => {
	if (typeof block.has_unpublished_changes === 'boolean') {
		return block.has_unpublished_changes;
	}

	const draftVersionId = block.draft_version_id ?? null;
	const publishedVersionId = block.published_version_id ?? null;

	if (draftVersionId === null) return false;
	if (publishedVersionId === null) return true;

	return draftVersionId !== publishedVersionId;
};

export const reusableBlockIsPublished = (
	block: Pick<ReusableBlock, 'published_version_id'> & Partial<Pick<ReusableBlock, 'is_published'>>
) => {
	if (typeof block.is_published === 'boolean') {
		return block.is_published;
	}

	return (block.published_version_id ?? null) !== null;
};

export const getReusableBlockPublishState = (
	block: Pick<ReusableBlock, 'draft_version_id' | 'published_version_id'> &
		Partial<Pick<ReusableBlock, 'has_unpublished_changes' | 'is_published'>>
) => {
	if (!reusableBlockIsPublished(block)) return 'unpublished' as const;
	if (reusableBlockHasDraftChanges(block)) return 'draft-changes' as const;
	return 'published' as const;
};
