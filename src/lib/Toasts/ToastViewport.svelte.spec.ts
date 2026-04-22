import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import ToastViewport from './ToastViewport.svelte';
import { ToastState } from './toastState.svelte';

describe('ToastViewport', () => {
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
		vi.useFakeTimers();
	});

	it('renders description and action buttons, then dismisses on action click by default', async () => {
		const state = new ToastState();
		const review = vi.fn();

		state.show({
			tone: 'info',
			title: 'Something happened',
			description: 'Review details before continue.',
			actions: [
				{ label: 'Ignore', variant: 'secondary', dismissOnClick: false },
				{ label: 'Show me', variant: 'primary', onClick: review }
			],
			durationMs: null
		});

		render(ToastViewport, { props: { state } });

		expect(screen.getByText('Something happened')).toBeTruthy();
		expect(screen.getByText('Review details before continue.')).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Ignore' })).toBeTruthy();

		await fireEvent.click(screen.getByRole('button', { name: 'Show me' }));

		expect(review).toHaveBeenCalledTimes(1);
		expect(state.toasts).toHaveLength(0);
	});
});
