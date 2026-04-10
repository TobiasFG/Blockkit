import { writable } from 'svelte/store';
import type { Page } from '$lib/types';

export const pagesStore = writable<Page[] | null>(null);
