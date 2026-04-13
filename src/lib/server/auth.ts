import { error, redirect } from '@sveltejs/kit';

export const AUTH_ROUTE = '/auth';

export const buildAuthRedirectPath = (pathname: string, search: string) => {
	const redirectTarget = `${pathname}${search}`;
	const params = new URLSearchParams();

	if (redirectTarget !== '/' && redirectTarget !== AUTH_ROUTE) {
		params.set('redirectTo', redirectTarget);
	}

	return params.size > 0 ? `${AUTH_ROUTE}?${params.toString()}` : AUTH_ROUTE;
};

export const requireAuthenticatedUser = async (
	locals: App.Locals,
	options: { api?: boolean; pathname?: string; search?: string } = {}
) => {
	const { user } = await locals.safeGetSession();

	if (user) {
		return user;
	}

	if (options.api) {
		throw error(401, 'Authentication required');
	}

	throw redirect(303, buildAuthRedirectPath(options.pathname ?? '/', options.search ?? ''));
};
