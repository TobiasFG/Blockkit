import { json } from '@sveltejs/kit';
import { getPublishedPageByPath, listPublishedPages } from '$lib/server/ContentApiController.server';

// Read-only public content, no cookies read, so any origin may fetch it.
const HEADERS = {
	'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
	'access-control-allow-origin': '*'
};

// GET /api/v1/pages            -> summaries of every published page
// GET /api/v1/pages?path=/blog -> one published page with its blocks resolved
export const GET = async ({ url }) => {
	const path = url.searchParams.get('path');

	if (path === null) {
		return json({ pages: await listPublishedPages() }, { headers: HEADERS });
	}

	if (!path.startsWith('/')) {
		return json({ error: '`path` must start with "/"' }, { status: 400 });
	}

	const page = await getPublishedPageByPath(path === '/' ? path : path.replace(/\/+$/, ''));
	if (!page) {
		return json({ error: `No published page at ${path}` }, { status: 404 });
	}

	return json(page, { headers: HEADERS });
};
