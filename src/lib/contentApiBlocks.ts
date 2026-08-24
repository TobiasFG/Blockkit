import type { ContentApiBlock, ContentApiBlockValue } from '$lib/contentApi';
import { isReusableBlockReference, parsePageContent } from '$lib/pageContent';
import type { BlockInstance, ReusableBlockReference } from '$lib/pageContent';

// References to unpublished or trashed reusable blocks are dropped: consumers
// receive inline block instances only and never have to resolve references.
// `visiting` drops references that would cycle back into a block already being
// expanded, so a mutual reference cannot recurse forever.
//
// `id` is the placement's id, not the content item's: the same item inserted
// twice must not hand consumers the same id twice, or keyed lists collide.
const expandBlock = (
	id: string,
	block: BlockInstance,
	reusableBlocks: Map<string, BlockInstance>,
	visiting: Set<string>
): ContentApiBlock => ({
	id,
	type: block.type,
	fields: Object.fromEntries(
		Object.entries(block.fields).map(([key, value]): [string, ContentApiBlockValue] => [
			key,
			Array.isArray(value)
				? value.flatMap((reference) => expandReference(reference, reusableBlocks, visiting))
				: value
		])
	)
});

const expandReference = (
	reference: ReusableBlockReference,
	reusableBlocks: Map<string, BlockInstance>,
	visiting: Set<string>
): ContentApiBlock[] => {
	if (visiting.has(reference.reusableBlockId)) return [];

	const resolved = reusableBlocks.get(reference.reusableBlockId);
	if (!resolved) return [];

	visiting.add(reference.reusableBlockId);
	const expanded = expandBlock(reference.id, resolved, reusableBlocks, visiting);
	visiting.delete(reference.reusableBlockId);

	return [expanded];
};

export const resolveBlocks = (
	content: unknown,
	reusableBlocks: Map<string, BlockInstance>
): ContentApiBlock[] =>
	parsePageContent(content).blocks.flatMap((node) => {
		const visiting = new Set<string>();
		if (!isReusableBlockReference(node)) {
			return [expandBlock(node.id, node, reusableBlocks, visiting)];
		}

		return expandReference(node, reusableBlocks, visiting);
	});
