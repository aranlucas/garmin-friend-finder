# Correctness and reliability audit — 2026-11-06

Baseline: remote default `9f3ec07b41af6ff94126b5913686714cde7b5ee8`, after the merged untangle pass. No pre-existing worktree edits. Tests and builds run only in CI.

## Inventory and boundaries

- Next.js pages: landing/sign-in, public device registration, session-gated dashboard. Auth.js owns OAuth/session handling; device IDs have no GitHub ownership relationship.
- HTTP: account status/code issuance, code-based registration, friend listing/location upsert; Auth.js protocol handlers.
- SQLite: users, pending codes, locations; migrations preserve old databases, enforce location foreign keys, and atomically consume codes using an insert trigger. One shared initialization promise retries after failure.
- Location reads include all users; POST excludes the caller and computes bearing/degrees and distance/feet. Dashboard filters unlocated users before rendering Leaflet markers.
- CI currently runs formatting, lint, typecheck, Vitest (real SQLite and jsdom), and production build. No real-browser journey exists.

Reviewed every source module, migrations/seed, tests, configs, README, architecture, roadmap, CI, and prior decision log. Existing tests cover registration races, rollback and retry across shared/independent connections, malformed location input, numerical edge cases, init recovery, UI failure/retry, and sanitized diagnostics.

## Confirmed findings (before implementation)

1. **Medium, high confidence: malformed account requests escape as server failures.** `src/app/api/account/route.ts` accepts nullable/missing IDs; missing form ID reaches a NOT NULL constraint, files throw Zod exceptions, malformed bodies reject `formData()`. Expected: invalid input returns 400 without storage writes. Storage failures also escape without the sanitized error contract used by adjacent endpoints. Add explicit validation and generic 500 diagnostics.
2. **Medium, high confidence: successful registration can make a device permanently appear unregistered.** `src/app/api/account/register/route.ts` accepts empty short names; registration inserts a user and consumes every code, while account GET tests short-name truthiness and returns 204. POST then returns 200 for the existing user, so no fresh code can fix it. Reject blank names before consuming a code; status should recognize even a legacy blank-name account by existence.
3. **Medium, high confidence: code collisions fail valid issuance.** `src/services/accounts.ts` chooses one of 900,000 codes and inserts once; an occupied primary key raises an error, despite unused codes. Use Node crypto randomInt and bounded collision retries, preserving six digits and existing codes. Do not retry unrelated storage failures.

## Rejected hypotheses and deliberate limits

- API authentication/group isolation is a documented prototype limitation and roadmap design, not a regression to solve by inventing device ownership or changing public APIs. It remains unsafe for private public-deployment data.
- Code expiry/rate limits are documented absent; adding a lifetime would invent a policy. Crypto randomness improves generation without changing code shape.
- Registration already uses one atomic SQL statement/trigger; no manual multi-request transaction rewrite is warranted. Coordinate finite/range validation, zero coordinates, antipodal distance, repeated location writes, and database retry are already covered.
- Auth.js handles sessions, dashboard checks auth before loading locations; no custom session implementation is needed. Static dashboard/map intentionally has no refresh. No external fetch/retry/cancellation loop or subscription requires cleanup.
- Missing-device location updates currently return a generic 500 and are covered as such; changing that public contract is outside these fixes.

## Validation plan and framework applicability

Add SQLite-backed regression tests for the findings and demonstrate failures on baseline source in CI, followed by the full fixed suite/build. Preserve all existing tests. Add real published `e2e` and `@e2e-dev/web`, pinned in the lockfile, using deterministic locators without model credentials. Exercise actual browser registration failure, correction and success against the built Next server and disposable SQLite, then confirm account status, code consumption and location persistence over HTTP. OAuth and private production services are excluded; existing auth-boundary tests remain.

Sources inspected: upstream tester-army/e2e README; published npm metadata (`e2e` 0.23.0, `@e2e-dev/web` 0.15.5, Node ^22.22.3 or >=24.8); quickstart, CI and GitHub Actions docs fetched 2026-11-06. Manual config overrides the interactive/local-run suggestions per user policy. Execution evidence and independent review will be recorded after CI.

## Independent review

The independent reviewer caught an unsupported e2e matcher (replaced with parsed saved-record equality) and a concrete code-issuance race: registration can commit between the initial existence lookup and code insert, leaving a fresh unusable code after the registration trigger ran. The insert now atomically checks account absence; no-result allocation checks whether registration won before retrying a collision. A deterministic interleaving regression pauses the lookup, registers the device, then resumes issuance and requires 200 semantics/no pending codes. This extends finding 3 without manual shared transactions.

Local static lint and typecheck passed before this review follow-up; all behavior execution remains CI-only. Existing branch protection requires conversation resolution and linear history, with zero mandatory approving reviews. CI evidence is pending.
