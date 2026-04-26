import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastState } from './ToastState.svelte';

describe('ToastState', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	it('adds and manually removes toasts', () => {
		const state = new ToastState();
		const id = state.success('Saved.');

		expect(state.toasts).toHaveLength(1);
		expect(state.toasts[0]?.title).toBe('Saved.');

		state.remove(id);

		expect(state.toasts).toHaveLength(0);
	});

	it('auto-removes toast after duration', () => {
		const state = new ToastState({ successDurationMs: 1000 });

		state.success('Saved.');

		expect(state.toasts).toHaveLength(1);

		vi.advanceTimersByTime(1000);

		expect(state.toasts).toHaveLength(0);
	});

	it('caps visible stack by dropping oldest toast', () => {
		const state = new ToastState({ maxVisible: 2 });

		state.success('First.');
		state.success('Second.');
		state.error('Third.');

		expect(state.toasts.map((toast) => toast.title)).toEqual(['Second.', 'Third.']);
	});

	it('supports structured toasts with actions and no auto-dismiss timer', () => {
		const state = new ToastState();
		const action = vi.fn();

		state.show({
			tone: 'warning',
			title: 'Draft has conflicts',
			description: 'Review imported fields before publish.',
			durationMs: null,
			actions: [{ label: 'Review', onClick: action, dismissOnClick: false }],
			dismissible: false
		});

		expect(state.toasts[0]).toMatchObject({
			tone: 'warning',
			title: 'Draft has conflicts',
			description: 'Review imported fields before publish.',
			durationMs: null,
			dismissible: false
		});
		expect(state.toasts[0]?.actions[0]?.onClick).toBe(action);
	});
});
