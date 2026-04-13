export type ReusableBlockInsertionPayload = {
	reusableBlockId: string;
};

type ReusableBlockInsertRequest = {
	reusableBlockId: string;
};

type ReusableBlockInsertHandler = (request: ReusableBlockInsertRequest) => void;

export const REUSABLE_BLOCK_DRAG_MIME = 'application/x-blockkit-reusable-block';

const reusableBlockInsertHandlers = new Set<ReusableBlockInsertHandler>();

export const createReusableBlockDragData = (reusableBlockId: string): string =>
	JSON.stringify({ reusableBlockId } satisfies ReusableBlockInsertionPayload);

export const setReusableBlockDragData = (event: DragEvent, reusableBlockId: string) => {
	if (!event.dataTransfer) return;

	const payload = createReusableBlockDragData(reusableBlockId);
	event.dataTransfer.setData(REUSABLE_BLOCK_DRAG_MIME, payload);
	event.dataTransfer.setData('text/plain', payload);
};

export const parseReusableBlockDragData = (
	event: DragEvent
): ReusableBlockInsertionPayload | null => {
	const raw =
		event.dataTransfer?.getData(REUSABLE_BLOCK_DRAG_MIME) ??
		event.dataTransfer?.getData('text/plain');

	if (!raw) return null;

	try {
		const parsed = JSON.parse(raw) as Partial<ReusableBlockInsertionPayload>;
		if (typeof parsed.reusableBlockId !== 'string' || !parsed.reusableBlockId) {
			return null;
		}

		return { reusableBlockId: parsed.reusableBlockId };
	} catch {
		return null;
	}
};

export const registerReusableBlockInsertHandler = (
	handler: ReusableBlockInsertHandler
): (() => void) => {
	reusableBlockInsertHandlers.add(handler);

	return () => {
		reusableBlockInsertHandlers.delete(handler);
	};
};

export const requestReusableBlockInsert = (reusableBlockId: string): boolean => {
	if (reusableBlockInsertHandlers.size === 0) {
		return false;
	}

	for (const handler of reusableBlockInsertHandlers) {
		handler({ reusableBlockId });
	}

	return true;
};
