import { describe, expect, it } from 'vitest';

import { AUTH_ROUTE, buildAuthRedirectPath } from './auth';

describe('buildAuthRedirectPath', () => {
	it('returns bare auth route for root', () => {
		expect(buildAuthRedirectPath('/', '')).toBe(AUTH_ROUTE);
	});

	it('includes redirect target for nested paths', () => {
		expect(buildAuthRedirectPath('/edit/about/team', '')).toBe(
			'/auth?redirectTo=%2Fedit%2Fabout%2Fteam'
		);
	});

	it('preserves query string on redirect target', () => {
		expect(buildAuthRedirectPath('/content', '?view=drafts')).toBe(
			'/auth?redirectTo=%2Fcontent%3Fview%3Ddrafts'
		);
	});
});
