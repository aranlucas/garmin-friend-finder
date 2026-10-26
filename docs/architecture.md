# Architecture and API contracts

This is a Next.js location-sharing prototype with GitHub sign-in, a local SQLite database,
and a client-side Leaflet map. It does not connect to Garmin devices or periodically refresh
locations. A successful GitHub sign-in currently has no database relationship to a device ID.

## Request and data flow

```text
GitHub OAuth → Auth.js session → dashboard → friend queries → Leaflet map
device ID → verification code → registration → users row
id + latitude + longitude → location upsert → other locations + distance/bearing
```

The dashboard checks the session before reading locations. The account and friend API routes
currently do not authenticate or authorize requests. The sign-in UI does not protect those
URLs. Until a device-ownership and sharing policy is implemented, this prototype should not
hold private location data on a public deployment.

## Modules

| Module                                                                         | Responsibility and contract                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/auth.ts`                                                                  | Configures Auth.js with GitHub. Exports `auth`, `handlers`, `signIn`, and `signOut` from the library. Auth.js owns OAuth/session handling; it does not currently own device records.                                                                                                                                         |
| `src/lib/db.ts`                                                                | `openDatabase(filename)` opens SQLite, enables foreign keys and applies numbered migrations before returning. It closes failed initialization attempts. `getDb()` shares the pending initialization promise per process and clears it after failure so callers can retry.                                                    |
| `src/services/accounts.ts`                                                     | `registerAccount(db, code, shortName)` inserts from a pending verification code in one SQL statement and returns `{ id, short_name }`. It returns `undefined` for missing codes or a conflicting existing user; other database failures reject. The connection must have current migrations applied.                         |
| `src/services/friends.ts`                                                      | `getAllFriends()` uses a left join, so accounts without a location return null coordinates. `getFriendsWithLocations()` returns only located accounts. `updateFriendLocation(userId, latitude, longitude)` checks existence then upserts; it rejects missing IDs and database errors. Validation belongs to its HTTP caller. |
| `src/lib/geo.ts`                                                               | `calculateBearing` returns degrees normalized to `[0, 360)`; `calculateDistance` returns great-circle distance in feet. Both accept latitude/longitude in degrees. Callers validate finite coordinates and geographic bounds. Distance clamps floating-point roundoff at antipodal points.                                   |
| `src/lib/server-errors.ts`                                                     | `reportServerError(event, error)` writes a structured event and a bounded error class to stderr. It omits request values, exception messages and stacks that may contain account/location data.                                                                                                                              |
| `src/types/index.ts`                                                           | Shared friend coordinates and bearing records. The `Friend` type describes located records; the left-join service's nullable return annotation remains a type-contract gap.                                                                                                                                                  |
| `src/app/dashboard/page.tsx`                                                   | Checks the session, reads located friends, renders the list and passes data to the browser map. The page is dynamic; it is a snapshot, not a live subscription.                                                                                                                                                              |
| `src/components/map-wrapper.tsx`                                               | Loads the map only in the browser with a loading fallback.                                                                                                                                                                                                                                                                   |
| `src/components/friends-map.tsx`                                               | Builds initial geographic bounds, places markers and displays names in React popups. Empty data centers on Seattle. Tiles come from OpenStreetMap.                                                                                                                                                                           |
| `src/app/account/register/page.tsx`                                            | Submits code/name JSON, prevents repeat clicks while pending, displays HTTP/network errors, and navigates home on success.                                                                                                                                                                                                   |
| `src/components/main-nav.tsx`                                                  | Renders Auth.js session state and sign-out recovery.                                                                                                                                                                                                                                                                         |
| `src/components/sign-in.tsx`                                                   | Chooses sign-in or device-registration navigation from the server session.                                                                                                                                                                                                                                                   |
| `src/components/session-provider.tsx`, `theme-provider.tsx`, `mode-toggle.tsx` | Thin Auth.js/next-themes providers and theme controls.                                                                                                                                                                                                                                                                       |
| `src/components/home-page-view.tsx`, `src/app/page.tsx`                        | Landing content and server-rendered sign-in action. Some feature copy describes future capabilities beyond the implemented prototype.                                                                                                                                                                                        |
| `src/app/layout.tsx`, `loading.tsx`, `error.tsx`                               | Root navigation/providers, loading UI, and retry UI that exposes a safe error digest instead of exception details.                                                                                                                                                                                                           |
| `src/components/ui/`                                                           | Styled Base UI buttons, inputs, menus and navigation, with class-variance-authority variants. Library primitives own interaction behavior.                                                                                                                                                                                   |
| `src/lib/utils.ts`                                                             | Exports the `clsx`/`tailwind-merge` class helper; current generated UI components import the separate `cn` package. Consolidate only after tracing callers and generator configuration.                                                                                                                                      |

## HTTP API

These are current contracts, including limitations; they are not an authorization design.

| Method and path                    | Input                                      | Response and failures                                                                                                                                                                                                                                                               |
| ---------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/account`                 | Query `id`                                 | 200 `{}` when the account has a short name; otherwise 204. Input validation and standardized database-error handling are still missing.                                                                                                                                             |
| `POST /api/account`                | Form `id`                                  | 200 `{}` for an existing account, otherwise 201 `{ code }`. Six-digit codes currently have no expiry/attempt limits, use `Math.random`, and may collide. Malformed form data or storage errors currently escape this route.                                                         |
| `POST /api/account/register`       | JSON `{ code: string, shortName: string }` | 200 `{ id, short_name }`; 400 for malformed JSON or wrong field types; 404 for missing/already-used codes or an existing user; 500 with a generic message and sanitized diagnostic for storage failures. String length/whitespace limits remain to be added.                        |
| `GET /api/friends`                 | None                                       | All account IDs/names with coordinates or null coordinates; 500 `{ error: "database error" }` on storage failure. No group filter or pagination currently exists.                                                                                                                   |
| `POST /api/friends`                | Form `id`, `lat`, `lon`                    | Validates nonempty ID and finite latitude/longitude in `[-90, 90]` / `[-180, 180]`. Stores the location and returns other located friends with `bearing` in degrees and `distance` in feet. Invalid input is 400; storage failures and missing users currently produce generic 500. |
| `GET/POST /api/auth/[...nextauth]` | Auth.js protocol                           | Delegated to the configured Auth.js handlers. No custom OAuth/session protocol is implemented here.                                                                                                                                                                                 |

## Registration atomicity

The database connection is shared across requests. A handler must not open a connection-wide
transaction and then yield between statements: another request can join that transaction,
fail to start its own, or have its already-acknowledged write rolled back by the first handler.

Registration uses `INSERT ... SELECT ... ON CONFLICT(id) DO NOTHING RETURNING id, short_name`.
Migration 003 installs an `AFTER INSERT` trigger that deletes all pending codes for the new
user. The insert and trigger execute in one SQLite statement transaction. If code deletion
fails, the insert rolls back too. A user-ID index keeps code consumption from scanning every
pending code. No application mutex or custom transaction queue is needed.

Keep migrations 001 and 002 unchanged. Version 003 preserves existing rows while adding the
index and trigger. Inserting a new user through any SQL caller now consumes that user's
pending codes. Existing stale codes for accounts created before this migration cannot
overwrite those accounts and return no registration result.

The deployed SQLite library must support `RETURNING` (SQLite 3.35 or newer). The pinned
`sqlite3` install is exercised by the tests. The migration runner remains responsible for
serialized startup when several processes share one database; the account operation itself
is covered using two independently opened connections.

## Verification and remaining coverage

Run the repository's existing commands:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

Vitest's node project exercises real temporary SQLite databases, migrations, API validation,
geographic calculations and sanitized errors. Its jsdom project exercises registration,
navigation, landing content and error recovery. Registration tests cover concurrent codes,
same-code contention, writes from unrelated requests, rollback after code-consumption failure,
retries, stale codes and independent database connections.

Native Oxlint enforces classic per-function complexity at most 9 and nesting at most 3 in
`src/`. Registration's route score fell from 7 to 5; the single-statement service scores 1.
The change removes explicit rollback/commit branches and a post-commit read. It moves the
atomicity guarantee into SQLite; it does not remove the business requirement to consume codes.

Highest-priority missing coverage is the eventual access policy: unauthenticated callers,
other owners/groups, device credential rotation/revocation and private-response caching.
Further cases should cover code expiry/rate limits/collision retry, body-size limits, zero
coordinates in the dashboard, map updates, stale locations, and a complete sign-in/register/
location/read browser flow. No live OAuth, Garmin device, deployed database, or map-provider
verification is implied by the local tests.
