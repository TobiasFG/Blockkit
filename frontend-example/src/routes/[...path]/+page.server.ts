import { error } from '@sveltejs/kit';
import { getPageByPath, listPages } from '$lib/blockkit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const path = params.path ? `/${params.path}` : '/';
	const [page, pages] = await Promise.all([getPageByPath(fetch, path), listPages(fetch)]);

	if (!page) {
		error(404, `No published page at ${path}`);
	}

	return {
		page,
		navigation: pages.map(({ path, title }) => ({ path, title }))
	};
};
