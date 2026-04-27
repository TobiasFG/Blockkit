# Scope
- CMS authentication flow and route-gate rules.

## Use When
- Touching `/auth`, login/signup/logout, route guards, session reads, auth redirects, or Supabase SSR auth setup.

## Rules
- Signed-out access to CMS routes redirects to `/auth`.
- After successful auth, return to `redirectTo` if present; else `/`.
- Logged-in state and logout live in sidebar bottom area.
- Current access model: any authenticated user may access CMS.
- Do not treat user-editable metadata as authorization source.

## Required Env
- Public:
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Server:
  - `DATABASE_URL`

## Implementation Points
- `src/hooks.server.ts`
  - request-scoped Supabase SSR client with cookie sync
- `event.locals.safeGetSession()`
  - validate session with `auth.getSession()` + `auth.getUser()`
- `src/routes/+layout.server.ts`
  - main CMS gate before page/content/sidebar data load
- `/auth` actions
  - handle login, signup, logout

## Constraints
- Prisma controllers power CMS data. Auth gate must remain intact on every route/action.
- Reduced-motion users should avoid decorative auth transition motion.
- Password reset, social login, MFA, invite-only flows are not current baseline.
