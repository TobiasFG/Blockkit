import { json } from '@sveltejs/kit';
import { getPublishedPageById } from '$lib/server/ContentApiController.server';

// GET /api/v1/pages/:id -> one published page with its blocks resolved
export const GET = async ({ params }) => {
	const page = await getPublishedPageById(params.id);
	if (!page) {
		return json({ error: `No published page ${params.id}` }, { status: 404 });
	}

	return json(page, {
		headers: {
			'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
			'access-control-allow-origin': '*'
		}
	});
};
