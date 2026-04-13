import { createBrowserClient } from '@supabase/ssr';
import { env } from '$env/dynamic/public';

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

export const createSupabaseBrowserClient = () => {
	const { url, publishableKey } = getSupabasePublicEnv();
	return createBrowserClient(url, publishableKey);
};
