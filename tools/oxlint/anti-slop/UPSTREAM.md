# Anti-slop provenance

- Source: https://github.com/dmmulroy/anti-slop
- Commit: c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b
- Source path: skills/install-anti-slop/assets/anti-slop/
- Installed path: tools/oxlint/anti-slop/
- Changes to vendored implementation: none.
- Root LICENSE copied from the same commit; nested Stylistic LICENSE and UPSTREAM.md preserved.
- Generic rules are enabled. Effect rules require a direct Effect dependency.

## Installation verification

- `oxlint` and `@oxlint/plugins` pinned together at 1.86.0, retaining the existing resolved Oxlint version.
- All 18 generic rules and native `oxc/no-accumulating-spread` are errors; no direct Effect dependency is present.
- Existing lint, format, typecheck and build checks are preserved; CI also exercises the database-cache regression test.
- Verified: pnpm 12.6.0 frozen-lockfile install, Oxlint, formatter check, TypeScript, database-cache test and Next production compilation.
- Readability fix/format second pass is stable; a filter/map negative probe verifies plugin loading.
- No authenticated Garmin activity or production database access was performed. Browser interaction was not exercised.
