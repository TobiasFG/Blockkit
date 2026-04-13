import { createServerClient } from '@supabase/ssr';
import { env } from '$env/dynamic/public';
import type { Handle } from '@sveltejs/kit';

const getSupabasePublicEnv = () => {
	if (!env.PUBLIC_SUPABASE_URL || !env.PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
		throw new Error(
			[
				'Missing `PUBLIC_SUPABASE_URL` or `PUBLIC_SUPABASE_PUBLISHABLE_KEY` in public environment.',
				'Create a local `.env` (gitignored) with values from `supabase status`.'
			].join('\n')
		);
	}

	return {
		url: env.PUBLIC_SUPABASE_URL,
		publishableKey: env.PUBLIC_SUPABASE_PUBLISHABLE_KEY
	};
};

export const handle: Handle = async ({ event, resolve }) => {
	const { url, publishableKey } = getSupabasePublicEnv();

	event.locals.supabase = createServerClient(url, publishableKey, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				for (const { name, value, options } of cookiesToSet) {
					event.cookies.set(name, value, { ...options, path: '/' });
				}
			}
		}
	});

	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error || !user) {
			return { session: null, user: null };
		}

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};
