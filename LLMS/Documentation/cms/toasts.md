Purpose: define shared CMS toast visual language and state API so transient feedback stays consistent across editors and management screens.

# How to use
- Mount `src/lib/Toasts/ToastProvider.svelte` once in CMS layout.
- Read state with `getToastState()` inside child routes/components.
- Use `success(message)` and `error(message)` for terse one-line outcomes.
- Use `show({...})`, `info({...})`, or `warning({...})` when toast needs custom title, body copy, action buttons, or custom timing.
- Timed bottom rails render through shadcn-svelte `Progress` in `src/lib/components/ui/progress/`, not a custom fake bar.

# Toast shape
- `title`: required visible headline. `message` is accepted as shorthand input and normalized into `title`.
- `description`: optional supporting copy under headline.
- `tone`: `success`, `info`, `warning`, or `error`.
- `durationMs`: auto-dismiss time. Use `null` for persistent toasts with no progress bar.
- `dismissible`: hide close button when false.
- `actions`: array of buttons with:
  - `label`
  - `variant`: `primary` or `secondary`
  - `dismissOnClick`: defaults true
  - `onClick`: optional handler

# Visual rules
- Toasts use flat white slab surface, squarer corners, light border, restrained shadow.
- Tone lives in icon chip, action accents, and bottom progress track + fill.
- Timed toasts fill progress rail from left to right over exact dismiss duration.
- Progress rail spans full width at bottom with muted track behind active fill.
- Content layout stays sparse: icon, title/body, optional close control, action row.
- Keep copy action-linked and short. Avoid paragraph-length descriptions.

# Defaults
- Success/info/warning use short auto-dismiss timing.
- Error uses longer auto-dismiss timing.
- Existing `success(message)` and `error(message)` call sites stay valid and render title-only toasts.
- Use inline validation instead of toast when editor must fix fields in-place.
