---
name: test-and-verify
description: Verify Blockkit changes with repo-standard commands and task-specific checks. Use for choosing Bun commands, deciding unit vs e2e scope, and validating docs, CMS flows, auth gates, and schema-related work before final response.
---

# Use When
- Before final response.
- After code, schema, doc-structure, or workflow changes.
- Trigger phrases: `verify`, `run checks`, `what should we test`, `finish task`.

## Do Not Use When
- User explicitly asks to skip verification.
- No repo change happened and answer is purely conceptual.

## Inputs To Inspect First
- `docs/agents/workflows/testing-and-verification.md`
- Changed files and touched surfaces
- `package.json` scripts if command availability seems uncertain

## Steps
1. Classify change: docs-only, UI/domain, route flow, schema, or mixed.
2. Pick smallest command set that proves changed behavior.
3. Prefer `bun run check` plus targeted tests over broad full-suite runs when scope is narrow.
4. For docs-only work, search for stale paths, contradictions, and duplicate guidance instead of running app tests only.
5. For CMS workflow changes, verify route behavior that users would notice, not only helper tests.
6. Record what was verified and what remains unverified.

## Verification
- Commands must match task scope.
- Failures should be investigated or reported, not ignored.
- Final response must separate completed verification from skipped verification.

## Output Expectations
- Clear statement of command set used.
- Clear statement of unverified risk, if any.
