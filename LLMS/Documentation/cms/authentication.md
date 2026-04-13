Purpose: describe CMS authentication flow, setup requirements, and current access model.

# How to use
- Signed-out requests to any CMS route redirect to `/auth`.
- `/auth` shows login by default with signup available as secondary switch below form.
- After successful login or signup, user is returned to requested route if `redirectTo` exists, else `/`.
- Logged-in state and `Log out` action live in sidebar bottom area.

# Setup
- Add public Supabase env vars in local `.env`:
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Keep existing server env vars for service-role access:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Local Supabase config should keep email auth enabled and email confirmations off for current dev flow.

# Architecture
- `src/hooks.server.ts` creates request-scoped Supabase SSR client with cookie sync.
- `event.locals.safeGetSession()` validates current session by pairing `auth.getSession()` with `auth.getUser()`.
- Root `src/routes/+layout.server.ts` gates CMS access before loading pages/content/sidebar data.
- Signed-out CMS actions and sidebar API mutations are rejected before service-role controllers run.
- Auth forms submit to `/auth` server actions for login, signup, and logout.

# Current access model
- Any authenticated user can access CMS in first pass.
- No seeded-user-only flow, role management, or invite gate yet.
- Authorization is route/action-based for now; DB-level per-user authorization/RLS remains future work.
- Do not use user-editable metadata for authorization decisions.

# UX notes
- Auth route uses split layout:
  - left auth rail sized wider than final sidebar
  - right visual stage previews editor shell
- Success state briefly animates auth rail toward sidebar proportions before route navigation.
- Reduced-motion users get near-immediate transition instead of decorative animation.

# Constraints
- Public env vars are required even for server-rendered auth because SSR client setup uses publishable key.
- Current CMS data controllers still use service-role client; auth gate must remain intact on every route/action.
- Password reset, social login, MFA, and invite-only onboarding are out of scope in current pass.
