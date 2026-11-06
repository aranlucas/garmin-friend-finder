# Untangle decision log

## Scope and evidence (before edits)

- Exact skill fetched from https://raw.githubusercontent.com/caldoai/skills/main/skills/untangle-codebase/SKILL.md on 2026-11-05. Comments and Tests both selected by the user; tests are the final cleanup phase.
- Worktree started clean on `refactor/untangle-codebase-20261106`. No other projects or checkouts are modified.
- Inventory: Next App Router pages and three domain API routes; Auth.js GitHub session integration; SQLite initialization, three migrations and seed; account/friend services; geography and safe diagnostics; Leaflet map; Base UI primitives; seven test files; CI, tooling configuration, README, architecture and roadmap. All tracked source, tests, SQL, configuration and documentation inspected, plus asset references.
- Git evidence: recent #53 established atomic registration; #56 pruned documentation; #57 pruned tests. Preserve those contracts rather than rebuilding them.
- Read-only inventory subagent independently reviewed all four problem classes and confirmed the decisions below.

## Baseline failures (separate from refactor failures)

- `pnpm test`: 55 passed, one sign-out retry UI test timed out at 5 seconds. Auth.js logs the intentionally simulated connection failure. Investigate at test cleanup; retain retry coverage.
- Baseline typecheck passed. Baseline lint failed because Tailwind design-system precomputation exceeded 60 seconds on this constrained machine; formatting was not reached in that command chain. Build pending.

## Design decisions and complete justified work list

1. Own account persistence in the account service, keeping HTTP translation in routes.
   - Hidden link: status/code issuance SQL and generation live in the account route, registration SQL in services/accounts.
   - Keep the current six-digit generation and status semantics; security/product policy changes are outside this behavior-preserving refactor.
2. Express located friends separately from account listings and remove dead bearing type.
   - Hidden link: LEFT JOIN returns null coordinates while shared Friend claims numbers.
   - Special case: dashboard truthiness rejects zero, even though its query guarantees location. Located consumers should render all numeric coordinates.
   - Keep geography as domain math; no new general-purpose implementation or dependency is needed.
3. Let native SQLite foreign keys enforce location ownership and use native upsert.
   - Needless link: friend writes first query users then write, duplicating the enforced database constraint; missing users already map to generic 500.
4. Own map loading and errors in the client entry point.
   - Surplus: dashboard and wrapper Suspense repeat next/dynamic loading; dashboard and map duplicate error handling.
   - Hidden link: bounds computation currently occurs outside the map error boundary. Move boundary above dynamic rendering and keep SSR disabled.
5. Remove verified surplus together with its configuration/CSS references.
   - Unused generated dropdown variants and navigation popup infrastructure.
   - Unused local class-name utility duplicates installed `cn`; align generator alias with existing imports.
   - Unreferenced starter/deployment assets, unused login themes and accordion animation CSS.
   - Keep client provider entry points: they establish required RSC boundaries, not arbitrary pass-through wrappers.
6. Remove implementation-restating comments; keep privacy, numerical roundoff, units and migration/transaction rationale. Released migrations remain unchanged.
7. LAST: maintain behavior-based tests.
   - SQL-substring concurrency pause couples regression coverage to query spelling. Replace with a deterministic pause on completed database operation without parsing SQL.
   - Diagnose sign-out test timeout without dropping retry behavior.
   - Add contract coverage for account status, null/unlocated listings, location replacement and dashboard zero coordinates. Each catches plausible boundary/type regressions with literal expected outputs.
   - Keep contention, rollback, migration, privacy and recovery tests. Existing radius-based expectations test the documented spherical model; changing the model is outside scope.

## Intentional special cases retained

Development-only opt-in seeding; failed initialization retry and cleanup; atomic registration trigger; antipodal floating-point clamp; empty-map Seattle fallback; Leaflet SSR exclusion; dashboard authentication redirect; bounded diagnostic error classes. These represent current requirements. Documented authorization/code expiry/validation limitations remain roadmap work, not speculative refactor additions.

## Implementation and validation

Structural work and final test cleanup implemented. Final CI validation pending.

### Final implementation evidence

- Added account status/existing-code issuance, nullable listings, repeated coordinate updates and dashboard zero-coordinate regressions, with literal expected records/display text.
- Retained all meaningful prior tests. Concurrency interleaving no longer parses SQL text; sign-out test retains its real Auth.js integration; timeouts were resource-related, so its original coverage is preserved.
- Removed unused diagnostic event, transport types from persistence, direct class utility dependencies and unused UI options. Fixed two transient syntax errors introduced during cleanup before formatting/typecheck.
- Before the latest CI-only constraint, typecheck passed and 59 tests passed in a single-worker run with 60-second CLI timeouts. Default-timeout attempts failed under machine load (including worker startup); these are not a claim that default checks passed. No tests will be run locally after the constraint; no owned test process remains.
- CI workflow inspection found unsupported nested `parallel` steps. Replaced with native sequential GitHub Actions steps so formatting, lint, typecheck, all Vitest tests and production build actually execute on PRs.
- Final reviewer pending; CI will be authoritative for merge. Existing privacy/access limitations remain as documented in architecture and roadmap.

- Final independent whole-repository review found no worthwhile structural or behavioral issues remaining; prior findings resolved and retained special cases justified above.

- Pre-commit static checks caught transport parsing and test-mock policy issues. Account route now uses existing Zod boundary parsing. Dashboard rendering test documents narrowly scoped mocks for external authentication/storage/Leaflet; no production injection seam was added solely for tests.
