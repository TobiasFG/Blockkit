Purpose: define repo conventions for sharing and mutating state in Svelte 5 with runes.

# How to use
- Read this before adding shared client state, singleton state, or state helper modules in `.svelte.ts` files.
- Use patterns here as defaults unless feature has strong reason to differ.
- Keep examples small. Prefer simple APIs over clever abstractions.

# Defaults
- Prefer `$state` and `$derived` over legacy Svelte stores for app-local and shared app state.
- Prefer factories, accessor objects, or classes when exporting mutable state across modules.
- Prefer proxied object state when consumers need direct property mutation.
- Prefer explicit methods when state changes should enforce invariants or trigger side effects.
- Keep request-specific server data out of shared module singletons.

# Approved patterns

## 1. Proxied object for simple shared mutable state
Use when state shape is small, shared broadly, and direct mutation is acceptable.

```ts
// src/lib/state/config.svelte.ts
export const config = $state({
  theme: 'dark',
  textSize: '16px'
})
```

```svelte
<script lang="ts">
  import { config } from '$lib/state/config.svelte'
</script>

<button onclick={() => (config.theme = 'light')}>
  {config.theme}
</button>
```

Use for config-like state, simple UI flags, small shared objects.

Avoid for state that needs validation, auditability, or controlled mutations.

## 2. Context-scoped class for feature-global state
Use when state should feel global inside feature subtree, but must stay tied to component lifecycle and request boundary.

Good fit for toast systems, modal managers, editor session state, feature registries.

```ts
import { getContext, onDestroy, setContext } from 'svelte'
import type { Toast } from './types'

export class ToastState {
  toasts = $state<Toast[]>([])
  toastToTimeoutMap = new Map<string, number>()

  constructor() {
    onDestroy(() => {
      for (const timeout of this.toastToTimeoutMap.values()) {
        clearTimeout(timeout)
      }
      this.toastToTimeoutMap.clear()
    })
  }

  add(title: string, message: string, durationMs = 5000) {
    const id = crypto.randomUUID()

    this.toasts.push({
      id,
      title,
      message
    })

    this.toastToTimeoutMap.set(
      id,
      setTimeout(() => {
        this.remove(id)
      }, durationMs)
    )
  }

  remove(id: string) {
    const timeout = this.toastToTimeoutMap.get(id)

    if (timeout) {
      clearTimeout(timeout)
      this.toastToTimeoutMap.delete(id)
    }

    this.toasts = this.toasts.filter((toast) => toast.id !== id)
  }
}

const TOAST_KEY = Symbol('TOAST')

export function setToastState() {
  return setContext(TOAST_KEY, new ToastState())
}

export function getToastState() {
  return getContext<ReturnType<typeof setToastState>>(TOAST_KEY)
}
```

Why this pattern:
- `setContext` scopes state to layout/component subtree, not process-wide module singleton.
- `onDestroy` gives cleanup hook for timers, subscriptions, observers.
- Class keeps mutation methods, cleanup, derived state close together.
- SSR-safe when provider created per request/component tree, not shared module.

Use this over module singleton when feature has timers, subscriptions, DOM handles, request-specific data, or should reset on navigation/layout teardown.

## 3. Accessor object for controlled primitive state
Use when underlying state is primitive, but external code must read/write cleanly.

```ts
// src/lib/state/counter.svelte.ts
function createCounter() {
  let count = $state(0)
  let double = $derived(count * 2)

  return {
    get count() {
      return count
    },
    get double() {
      return double
    },
    set count(value: number) {
      count = value
    },
    increment() {
      count++
    }
  }
}

export const counter = createCounter()
```

```svelte
<script lang="ts">
  import { counter } from '$lib/state/counter.svelte'
</script>

<button onclick={counter.increment}>
  {counter.count} / {counter.double}
</button>
```

Use for primitives, derived values, guarded writes, small domain logic.

## 4. Factory for scoped state
Use when each component subtree or feature instance needs isolated state.

```ts
// src/lib/state/counter.svelte.ts
export function createCounter(initial = 0) {
  let count = $state(initial)

  return {
    get count() {
      return count
    },
    set count(value: number) {
      count = value
    },
    increment() {
      count++
    }
  }
}
```

```svelte
<script lang="ts">
  import { createCounter } from '$lib/state/counter.svelte'

  const counter = createCounter()
</script>
```

Use for per-dialog, per-form, per-widget state.

## 5. Class for richer domain state
Use when state and methods belong together and instance semantics are useful.

```ts
// src/lib/state/counter.svelte.ts
export class Counter {
  #count = $state(0)
  double = $derived(this.#count * 2)

  get count() {
    return this.#count
  }

  set count(value: number) {
    this.#count = value
  }

  increment = () => {
    this.#count++
  }
}
```

Use for stateful helpers with non-trivial behavior, invariants, or method grouping.

# Avoid

## Do not export bare mutable primitive rune state for cross-module writes

```ts
export let count = $state(0)
```

Consumers cannot reassign imported bindings:

```svelte
<script lang="ts">
  import { count } from './counter.svelte'
</script>

<button onclick={() => count++}>
  {count}
</button>
```

This fails because imported bindings are read-only in JavaScript.

## Do not destructure accessor-backed reactive values

```ts
const { count, increment } = createCounter()
```

`count` becomes snapshot value, not live accessor. Reactivity breaks.

Use one of these instead:
- Keep owner object intact: `counter.count`
- Return proxied object state: `{ count: $state({ value: 0 }) }`
- Return function API: `count()` and `setCount()`

## Do not default to stores for new rune-native state
Stores still fine for interop or existing architecture. Do not introduce `writable` by habit when rune state solves problem more directly.

# Side effects
- Avoid `$effect` in module-level singleton setup unless lifetime is explicit.
- Effects outside component init need cleanup root. Without root, effect usage is invalid.
- Prefer putting side effects at mutation boundaries when possible.

Good:

```ts
export class Counter {
  #count = $state(0)

  get count() {
    return this.#count
  }

  set count(value: number) {
    console.log(value)
    this.#count = value
  }
}
```

Risky unless cleanup is explicit:

```ts
function createCounter() {
  let count = $state({ value: 0 })

  $effect(() => {
    console.log(count.value)
  })

  return { count }
}

export const counter = createCounter()
```

# SSR and SvelteKit
- Never write request-specific `load` data into shared module singleton state on server.
- Shared module state on server can leak across requests.
- Return data from `load`, then pass through props, context, or `$page.data`.
- For feature-global state in SvelteKit, prefer layout/provider + context when lifecycle or request scoping matters.

Good server pattern:

```ts
// +layout.ts
export async function load({ fetch }) {
  const response = await fetch('/api/data')

  return {
    user: await response.json()
  }
}
```

```svelte
<!-- +layout.svelte -->
<script lang="ts">
  import { setContext } from 'svelte'

  let { data } = $props()
  let user = $state({ ...data.user })

  $effect(() => {
    Object.assign(user, data.user)
  })

  setContext('user', user)
</script>
```

# Decision guide
- Need simple shared mutable object → proxied object.
- Need feature-global state with cleanup/lifecycle → context-scoped class.
- Need primitive with controlled writes → accessor object.
- Need isolated instances → factory.
- Need rich behavior/invariants → class.
- Need old ecosystem interop → store only when necessary.

# Notes
- `.svelte.ts` state modules should stay small and feature-focused.
- Export minimal surface area.
- Prefer direct, obvious names like `createEditorState`, `editorState`, `selection`.
