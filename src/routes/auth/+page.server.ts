import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const getRedirectTarget = (formData: FormData) => {
	const redirectTo = String(formData.get('redirectTo') ?? '').trim();
	return redirectTo.startsWith('/') ? redirectTo : '/';
};

const getCredentials = (formData: FormData) => ({
	email: String(formData.get('email') ?? '').trim().toLowerCase(),
	password: String(formData.get('password') ?? '')
});

export const load: PageServerLoad = ({ url }) => ({
	redirectTo: url.searchParams.get('redirectTo') || '/'
});

export const actions = {
	login: async ({ request, locals }) => {
		const formData = await request.formData();
		const { email, password } = getCredentials(formData);

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required.', mode: 'login' });
		}

		const { error } = await locals.supabase.auth.signInWithPassword({ email, password });

		if (error) {
			return fail(400, { error: error.message, mode: 'login' });
		}

		return {
			success: true,
			mode: 'login',
			redirectTo: getRedirectTarget(formData)
		};
	},

	signup: async ({ request, locals }) => {
		const formData = await request.formData();
		const { email, password } = getCredentials(formData);

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required.', mode: 'signup' });
		}

		const signUpResult = await locals.supabase.auth.signUp({ email, password });

		if (signUpResult.error) {
			return fail(400, { error: signUpResult.error.message, mode: 'signup' });
		}

		if (!signUpResult.data.session) {
			const { error } = await locals.supabase.auth.signInWithPassword({ email, password });

			if (error) {
				return fail(400, { error: error.message, mode: 'signup' });
			}
		}

		return {
			success: true,
			mode: 'signup',
			redirectTo: getRedirectTarget(formData)
		};
	},

	signOut: async ({ locals }) => {
		const { error } = await locals.supabase.auth.signOut();

		if (error) {
			return fail(400, { error: error.message, mode: 'login' });
		}

		return {
			signedOut: true,
			mode: 'login',
			redirectTo: '/'
		};
	}
} satisfies Actions;
