import { getContext, onDestroy, setContext } from 'svelte';

export type ToastTone = 'success' | 'info' | 'warning' | 'error';

export type ToastAction = {
	id?: string;
	label: string;
	variant?: 'primary' | 'secondary';
	dismissOnClick?: boolean;
	onClick?: () => void | Promise<void>;
};

export type ToastRecord = {
	id: string;
	title: string;
	description?: string;
	tone: ToastTone;
	durationMs: number | null;
	createdAt: number;
	actions: ToastAction[];
	dismissible: boolean;
};

type ShowToastInput = {
	tone: ToastTone;
	title?: string;
	message?: string;
	description?: string;
	durationMs?: number | null;
	actions?: ToastAction[];
	dismissible?: boolean;
};

type ToastStateOptions = {
	maxVisible?: number;
	successDurationMs?: number;
	infoDurationMs?: number;
	warningDurationMs?: number;
	errorDurationMs?: number;
};

const TOAST_STATE_KEY = Symbol('CMS_TOAST_STATE');

const createToastId = () =>
	typeof crypto !== 'undefined' && 'randomUUID' in crypto
		? crypto.randomUUID()
		: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export class ToastState {
	toasts = $state<ToastRecord[]>([]);

	readonly maxVisible: number;
	readonly successDurationMs: number;
	readonly infoDurationMs: number;
	readonly warningDurationMs: number;
	readonly errorDurationMs: number;

	private readonly timeoutById = new Map<string, ReturnType<typeof setTimeout>>();

	constructor(options: ToastStateOptions = {}) {
		this.maxVisible = options.maxVisible ?? 4;
		this.successDurationMs = options.successDurationMs ?? 2800;
		this.infoDurationMs = options.infoDurationMs ?? 3600;
		this.warningDurationMs = options.warningDurationMs ?? 4400;
		this.errorDurationMs = options.errorDurationMs ?? 5200;
	}

	private getDefaultDuration(tone: ToastTone) {
		if (tone === 'success') return this.successDurationMs;
		if (tone === 'info') return this.infoDurationMs;
		if (tone === 'warning') return this.warningDurationMs;
		return this.errorDurationMs;
	}

	show({ title, message, description, tone, durationMs, actions, dismissible }: ShowToastInput) {
		const resolvedTitle = title?.trim() || message?.trim();

		if (!resolvedTitle) {
			throw new Error('Toast requires title or message.');
		}

		const id = createToastId();
		const resolvedDurationMs =
			durationMs === undefined ? this.getDefaultDuration(tone) : durationMs;
		const toast = {
			id,
			title: resolvedTitle,
			description: description?.trim() || undefined,
			tone,
			durationMs: resolvedDurationMs
				? Math.max(0, resolvedDurationMs)
				: resolvedDurationMs,
			createdAt: Date.now(),
			actions: actions ?? [],
			dismissible: dismissible ?? true
		} satisfies ToastRecord;

		this.toasts = [...this.toasts, toast];

		if (this.toasts.length > this.maxVisible) {
			this.remove(this.toasts[0]?.id ?? null);
		}

		if (toast.durationMs !== null) {
			const timeout = setTimeout(() => {
				this.remove(id);
			}, toast.durationMs);

			this.timeoutById.set(id, timeout);
		}
		return id;
	}

	success(message: string, durationMs?: number | null) {
		return this.show({
			title: message,
			tone: 'success',
			durationMs
		});
	}

	info(input: string | Omit<ShowToastInput, 'tone'>) {
		return this.show(typeof input === 'string' ? { title: input, tone: 'info' } : { ...input, tone: 'info' });
	}

	warning(input: string | Omit<ShowToastInput, 'tone'>) {
		return this.show(typeof input === 'string' ? { title: input, tone: 'warning' } : { ...input, tone: 'warning' });
	}

	error(message: string, durationMs?: number | null) {
		return this.show({
			title: message,
			tone: 'error',
			durationMs
		});
	}

	remove(id: string | null) {
		if (!id) return;

		const timeout = this.timeoutById.get(id);

		if (timeout) {
			clearTimeout(timeout);
			this.timeoutById.delete(id);
		}

		this.toasts = this.toasts.filter((toast) => toast.id !== id);
	}

	destroy() {
		for (const timeout of this.timeoutById.values()) {
			clearTimeout(timeout);
		}

		this.timeoutById.clear();
		this.toasts = [];
	}
}

export const setToastState = (options?: ToastStateOptions) => {
	const state = new ToastState(options);

	onDestroy(() => {
		state.destroy();
	});

	return setContext(TOAST_STATE_KEY, state);
};

export const getToastState = () => getContext<ToastState>(TOAST_STATE_KEY);
