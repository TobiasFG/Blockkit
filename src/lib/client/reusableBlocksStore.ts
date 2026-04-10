import { writable } from 'svelte/store';
import type { BlockFolder, ReusableBlock } from '$lib/types';

export const blockFoldersStore = writable<BlockFolder[] | null>(null);
export const reusableBlocksStore = writable<ReusableBlock[] | null>(null);
