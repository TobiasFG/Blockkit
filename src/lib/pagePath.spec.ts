import { describe, expect, it } from 'vitest';

import { buildEditPagePath, buildPagePathMap, buildPagePathPreview, validatePagePathInput } from './pagePath';

describe('page path helpers', () => {
	it('validates and derives path segments', () => {
		expect(validatePagePathInput({ title: '', urlName: '', isRoot: false }).error).toBe('Title is required');
		expect(validatePagePathInput({ title: 'About Us', urlName: '', isRoot: false }).pathSegment).toBe('about-us');
		expect(validatePagePathInput({ title: 'About Us', urlName: 'team_page', isRoot: false }).pathSegment).toBe(
			'team_page'
		);
		expect(validatePagePathInput({ title: 'Home', urlName: '', isRoot: true }).pathSegment).toBeNull();
	});

	it('builds page paths from explicit parent links', () => {
		const pathMap = buildPagePathMap([
			{ id: 'root', parent_page_id: null, path_segment: null },
			{ id: 'about', parent_page_id: 'root', path_segment: 'about' },
			{ id: 'team', parent_page_id: 'about', path_segment: 'team' }
		]);

		expect(pathMap.get('root')).toBe('/');
		expect(pathMap.get('about')).toBe('/about');
		expect(pathMap.get('team')).toBe('/about/team');
	});

	it('builds preview and edit paths', () => {
		expect(buildEditPagePath('page-1')).toBe('/edit/page/page-1');
		expect(
			buildPagePathPreview({
				pageId: 'team',
				parentPageId: 'about',
				title: 'Team',
				urlName: '',
				pages: [
					{ id: 'root', parent_page_id: null, path_segment: null },
					{ id: 'about', parent_page_id: 'root', path_segment: 'about' },
					{ id: 'team', parent_page_id: 'about', path_segment: 'team' }
				]
			})
		).toBe('/about/team');
	});
});
