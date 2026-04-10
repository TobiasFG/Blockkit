import { describe, expect, it } from 'vitest';
import {
	buildEditPagePath,
	buildPageSlugCandidates,
	normalizePageSlug,
	slugFromRouteParam,
	validatePageSlug
} from '$lib/pageSlug';

describe('page slug helpers', () => {
	it('normalizes root, leading slashes, and trailing slashes', () => {
		expect(normalizePageSlug('/')).toBe('/');
		expect(normalizePageSlug('about')).toBe('/about');
		expect(normalizePageSlug('/about/team/')).toBe('/about/team');
		expect(normalizePageSlug('///about//team///')).toBe('/about/team');
	});

	it('validates required slugs and allowed segment characters', () => {
		expect(validatePageSlug('   ').error).toBe('Slug is required');
		expect(validatePageSlug('/about/team').error).toBeUndefined();
		expect(validatePageSlug('/release-1.0/~notes').error).toBeUndefined();
		expect(validatePageSlug('/about us').error).toMatch('Slug segments may only contain');
		expect(validatePageSlug('/../secret').error).toBe('Slug segments cannot be "." or ".."');
	});

	it('builds route candidates for root and nested slugs', () => {
		expect(buildPageSlugCandidates('__root__')).toEqual(['/', '']);
		expect(buildPageSlugCandidates('about/team')).toEqual(['/about/team', 'about/team']);
	});

	it('maps route params and edit paths consistently', () => {
		expect(slugFromRouteParam(undefined)).toBe('/');
		expect(slugFromRouteParam('__root__')).toBe('/');
		expect(slugFromRouteParam('about/team')).toBe('/about/team');
		expect(buildEditPagePath('/')).toBe('/edit/__root__');
		expect(buildEditPagePath('/about/team')).toBe('/edit/about/team');
	});
});
