Purpose: define first auth gate for CMS using Supabase Auth plus branded login/signup screen that transitions into existing editor shell.

# Summary
- Add Supabase email/password auth for CMS access.
- Gate CMS routes behind signed-in session.
- Replace current direct-open shell with auth-aware app shell that shows branded login/signup experience when signed out.
- Keep first pass focused on local email/password auth, session handling, guarded routes, logout, and polished transition into current CMS.

# Problem
- CMS currently has no auth gate, so every route assumes trusted local/editor access.
- Existing data access uses service-role server client on all CMS loads/actions, which is acceptable for early local development but unsafe if public access is introduced without route protection.
- Product direction now needs identifiable editor accounts plus a deliberate first impression before editor lands inside CMS.

# Goals
- Require authentication before any CMS page data or content-management action is available.
- Use Supabase Auth as single auth system for signup, login, logout, and server-side session checks.
- Deliver login screen with split layout:
  - auth panel around 1.5x current sidebar width
  - remaining area reserved for visual/art direction
- On successful auth, animate auth panel into normal sidebar width and reveal editor shell with transition.
- Keep implementation understandable, local-dev friendly, documented, testable.

# Non-goals
- Do not add social providers, magic links, MFA, password reset, invites, or role management in first pass.
- Do not redesign broader CMS IA beyond auth entry shell.
- Do not move page/content ownership rules into DB-level per-user authorization yet unless needed for safe first pass.
- Do not preserve unauthenticated public access to current CMS routes.

# Current context
- App is SvelteKit 2 + Svelte 5.
- Project currently depends on `@supabase/supabase-js` only; no SSR auth helper package yet.
- Server loads/actions use `supabaseAdmin` service-role client directly from private env.
- Root `+layout.server.ts` loads full CMS navigation/content data for every request.
- No `hooks.server.ts`, no `App.Locals` auth typing, no auth-aware route grouping yet.

# Proposed defaults
- Auth method: Supabase email + password.
- Access model first pass: any authenticated user can enter CMS.
- Signup allowed in UI by default for local/early development.
- Session storage/cookie handling should use official Supabase SSR pattern for SvelteKit rather than custom cookie logic.
- Signed-out users hitting any CMS route should be redirected to `/auth`.
- Signed-in users visiting `/auth` should be redirected to `/`.
- Logout action should clear session server-side and return user to `/auth`.

# UX direction
## Signed-out shell
- Route: `/auth`.
- Layout uses two regions on desktop:
  - left auth rail sized around 1.5x current sidebar width
  - right visual stage for artwork/brand imagery/motion
- Mobile collapses to single-column auth-first layout; visual stage becomes top or background accent, not blocking form completion.
- Auth rail contains:
  - product mark/title
  - short positioning copy
  - segmented login/signup switch
  - email/password form
  - inline auth error/success messaging

## Signed-in transition
- After successful submit:
  - keep user on auth shell long enough to confirm success
  - animate auth rail width down toward normal sidebar width
  - crossfade/slide main editor shell in
- Reduced-motion mode should skip decorative sequence and use fast opacity/state change only.

## Visual tone
- Login should feel intentional and more branded than admin-default.
- Visual stage can use editorial/product imagery, gradients, or block-composition motifs tied to Blockkit.
- Avoid dark-only treatment and avoid generic centered card auth page.

# Technical plan
## Auth client architecture
- Add browser/server auth helpers using official Supabase SSR setup for SvelteKit.
- Introduce `hooks.server.ts` to create request-scoped Supabase client, hydrate session/user into `event.locals`, and persist refreshed auth cookies.
- Extend `src/app.d.ts` with `App.Locals` auth types.

## Route protection
- Gate CMS routes in server load path using session from `locals`.
- Keep `/auth` outside gated CMS shell or make layout branch auth-aware so unauthenticated requests do not trigger current full CMS data load.
- Ensure form actions for page/content mutations reject unauthenticated access before touching service-role operations.

## Data access safety
- Keep service-role controllers for now, but call them only from authenticated server code paths.
- Longer-term per-user/RLS model can come later; first pass relies on route/action gate plus non-public env handling.
- Do not use `user_metadata` for authorization decisions.

## Supabase config
- Enable email auth in local Supabase config if not already active.
- Add required redirect URLs for local dev auth callbacks if SSR helper flow needs them.
- Document required env vars for publishable key, URL, and service-role key.

## Testing
- Add unit coverage for auth guard helpers if extracted.
- Add at least one Playwright flow for:
  - redirect to `/auth` when signed out
  - signup/login success
  - logout returns to `/auth`
- If animation state is logic-driven, test reduced-motion or state classes rather than brittle timing.

# Implementation slices after approval
1. Add Supabase SSR auth plumbing, typed locals, env expectations, and auth route.
2. Protect layout/routes/actions so signed-out users never reach CMS data/actions.
3. Build split auth screen with login/signup states and reduced-motion-safe success transition.
4. Wire logout control into CMS shell.
5. Update docs for auth setup and CMS access flow.

# Review points
- Email/password only for first pass.
- Signup open by default in early development.
- Any authenticated user gets CMS access in first pass.
- Signed-out entry point should be dedicated `/auth` route, not inline modal.
- Service-role controllers remain temporarily, protected by server auth gate.

# Decisions after review
- Login is default auth mode. Signup remains available as secondary switch below login form. No seeded-user-only flow in first pass.
- Prefer layout architecture that gives best auth-to-editor transition without sacrificing clean code boundaries. Implementation may use shared outer shell only if route/data separation stays clear and maintainable.
- Show logged-in state and logout control in sidebar bottom area.

# Open questions
- None. Defaults and reviewed decisions above should be sufficient for first implementation pass.

# Risks
- Mixing service-role DB access with weak route guards would create major exposure if any unauthenticated path remains.
- Supabase SSR setup details change over time; implementation must verify against current docs before coding.
- Fancy auth-to-shell animation can complicate route/layout boundaries if shell separation is not designed carefully.
- Open signup can create unwanted accounts if deployed carelessly beyond local/private environment.

# Follow-ups
- Add password reset flow.
- Add invite-only onboarding or role-based access.
- Move from route-only protection toward user-aware DB authorization/RLS where product needs it.
- Expand visual system from auth screen into broader CMS polish pass.

# Recommendation
- Review review-points and open questions before implementation.
- After approval, verify current Supabase auth docs, then implement in one pass with docs and tests.
