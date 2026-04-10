import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from '$env/static/private';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	throw new Error(
		[
			'Missing `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` in server environment.',
			'Create a local `.env` (gitignored) with values from `supabase status`.',
			'Example:',
			'SUPABASE_URL="http://127.0.0.1:54321"',
			'SUPABASE_SERVICE_ROLE_KEY="...service_role key..."'
		].join('\n')
	);
}

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
	auth: { persistSession: false, autoRefreshToken: false }
});
