import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import ToastTestHost from '$lib/toasts/ToastTestHost.svelte';
import TrashPage from './+page.svelte';

let nextResult: {
	type: 'success' | 'failure';
	data?: Record<string, unknown>;
};

vi.mock('$app/environment', () => ({
	browser: true
}));

vi.mock('$app/forms', () => ({
	applyAction: vi.fn(async () => {}),
	enhance: (
		node: HTMLFormElement,
		submit: (input: {
			formElement: HTMLFormElement;
			cancel: () => void;
			submitter: HTMLElement | null;
		}) => ((args: { result: typeof nextResult; update: () => Promise<void> }) => Promise<void>) | void
	) => {
		const onSubmit = async (event: Event) => {
			event.preventDefault();
			const submitter =
				document.activeElement instanceof HTMLElement ? document.activeElement : null;
			const callback = submit({
				formElement: node,
				cancel: vi.fn(),
				submitter
			});

			if (typeof callback === 'function') {
				await callback({
					result: nextResult,
					update: async () => {}
				});
			}
		};

		node.addEventListener('submit', onSubmit);

		return {
			destroy() {
				node.removeEventListener('submit', onSubmit);
			}
		}
	}
}));

describe('trash page toasts', () => {
	beforeAll(() => {
		Object.defineProperty(HTMLElement.prototype, 'animate', {
			configurable: true,
			value: vi.fn(() => ({
				cancel: vi.fn(),
				finished: Promise.resolve(),
				finish: vi.fn(),
				play: vi.fn()
			}))
		});
	});

	beforeEach(() => {
		nextResult = {
			type: 'success',
			data: {
				pages: [
					{
						id: 'parent-1',
						title: 'Home'
					}
				]
			}
		};
	});

	it('shows restore success in toast stack', async () => {
		render(ToastTestHost, {
			props: {
				RenderedComponent: TrashPage,
				componentProps: {
					data: {
						pages: [
							{
								id: 'parent-1',
								title: 'Home',
								path: '/',
								parent_page_id: null
							}
						],
						reusableBlocks: [],
						deletedPages: [
							{
								id: 'page-1',
								title: 'About',
								path: '/about',
								parent_page_id: 'parent-1',
								deleted_at: '2026-04-21T09:00:00.000Z'
							}
						],
						deletedReusableBlocks: []
					}
				}
			}
		});

		expect(screen.queryByText('Page restored.')).toBeNull();

		await fireEvent.change(screen.getByLabelText('Restore under parent'), {
			target: { value: 'parent-1' }
		});
		const restoreButton = screen.getByRole('button', { name: 'Restore page' });
		const restoreForm = restoreButton.closest('form');
		expect(restoreForm).not.toBeNull();
		await fireEvent.submit(restoreForm!);

		await waitFor(() => {
			expect(screen.getByRole('status').textContent).toContain('Page restored.');
		});

		expect(screen.getAllByText('Page restored.')).toHaveLength(1);
	});
});
