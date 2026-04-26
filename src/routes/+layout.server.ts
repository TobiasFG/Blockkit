import { redirect } from '@sveltejs/kit';
import { AUTH_ROUTE, buildAuthRedirectPath } from '$lib/server/auth';
import { getPages, getReusableBlockPageReferences } from '$lib/server/PagesController.server';
import { getBlockFolders, getReusableBlocks } from '$lib/server/ReusableBlocksController.server';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const { session, user } = await locals.safeGetSession();
	const isAuthRoute = url.pathname === AUTH_ROUTE;
	const isDevRoute = url.pathname === '/dev';

	if (!user && !isAuthRoute && !isDevRoute) {
		throw redirect(303, buildAuthRedirectPath(url.pathname, url.search));
	}

	if (user && isAuthRoute) {
		throw redirect(303, '/');
	}

	if (isAuthRoute) {
		return {
			isAuthRoute: true,
			isDevRoute: false,
			user
		};
	}

	if (isDevRoute) {
		return {
			isAuthRoute: false,
			isDevRoute: true,
			user
		};
	}

	return {
		isAuthRoute: false,
		isDevRoute: false,
		user,
		pages: await getPages(),
		blockFolders: await getBlockFolders(),
		reusableBlocks: await getReusableBlocks(),
		reusableBlockPageReferences: await getReusableBlockPageReferences()
	};
};
