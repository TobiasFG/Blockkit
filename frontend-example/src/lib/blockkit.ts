import { env } from '$env/dynamic/private';
import type { Page, PageSummary } from '$lib/content';

const baseUrl = () => (env.BLOCKKIT_API_URL ?? 'http://localhost:5173').replace(/\/+$/, '');

const get = async (fetchFn: typeof fetch, path: string) => {
	const response = await fetchFn(`${baseUrl()}/api/v1${path}`);

	if (response.status === 404) return null;
	if (!response.ok) {
		throw new Error(`Blockkit API ${path} failed: ${response.status} ${response.statusText}`);
	}

	return response.json();
};

export const listPages = async (fetchFn: typeof fetch): Promise<PageSummary[]> => {
	const body = await get(fetchFn, '/pages');
	return body?.pages ?? [];
};

export const getPageByPath = (fetchFn: typeof fetch, path: string): Promise<Page | null> =>
	get(fetchFn, `/pages?path=${encodeURIComponent(path)}`);
