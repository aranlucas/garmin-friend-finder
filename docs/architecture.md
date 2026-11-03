# Architecture and API contracts

## Access and privacy limits

GitHub sign-in gates the dashboard, but the account and friend APIs do not authenticate or
authorize requests. The dashboard reads all stored locations, without a group filter.
A GitHub session has no database relationship to a device ID. Until ownership and sharing
checks exist, this prototype should not hold private location data on a public deployment.
The [roadmap](../ROADMAP.md#chosen-access-model) defines the intended invited-group boundary.

Registration and friend routes return generic storage errors. Their
[diagnostic logger](../src/lib/server-errors.ts) omits request values, exception messages
and stacks that may contain account or location data; preserve that boundary when adding diagnostics.
The account code-issuance/status routes still lack standardized error handling.

## HTTP API

These are current contracts, including limitations; they are not an authorization design.

| Method and path                    | Input                                      | Response and failures                                                                                                                                                                                                                                                                          |
| ---------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/account`                 | Query `id`                                 | 200 `{}` when the account has a short name; otherwise 204. Input validation and standardized database-error handling are still missing.                                                                                                                                                        |
| `POST /api/account`                | Form `id`                                  | 200 `{}` for an existing account, otherwise 201 `{ code }`. Six-digit codes currently have no expiry/attempt limits, use `Math.random`, and may collide. Malformed form data or storage errors currently escape this route.                                                                    |
| `POST /api/account/register`       | JSON `{ code: string, shortName: string }` | 200 `{ id, short_name }`; 400 for malformed JSON or wrong field types; 404 for missing/already-used codes or an existing user; 500 with a generic message and sanitized diagnostic for storage failures. String length/whitespace limits remain to be added.                                   |
| `GET /api/friends`                 | None                                       | All account IDs/names with coordinates or null coordinates; 500 `{ error: "database error" }` on storage failure. No group filter or pagination currently exists.                                                                                                                              |
| `POST /api/friends`                | Form `id`, `lat`, `lon`                    | Validates nonempty ID and finite latitude/longitude in `[-90, 90]` / `[-180, 180]`. Stores the location and returns other located friends with `bearing` in degrees `[0, 360)` and `distance` in feet. Invalid input is 400; storage failures and missing users currently produce generic 500. |
| `GET/POST /api/auth/[...nextauth]` | Auth.js protocol                           | Delegated to the configured Auth.js handlers. No custom OAuth/session protocol is implemented here.                                                                                                                                                                                            |

## Registration atomicity

The database connection is shared across requests. A handler must not open a connection-wide
transaction and then yield between statements: another request can join that transaction,
fail to start its own, or have its already-acknowledged write rolled back by the first handler.

Registration uses `INSERT ... SELECT ... ON CONFLICT(id) DO NOTHING RETURNING id, short_name`.
Migration 003 installs an `AFTER INSERT` trigger that deletes all pending codes for the new
user. The insert and trigger execute in one SQLite statement transaction. If code deletion
fails, the insert rolls back too. A user-ID index keeps code consumption from scanning every
pending code.

Inserting a new user through any SQL caller consumes that user's pending codes. Existing
stale codes for accounts created before this migration cannot overwrite those accounts
and return no registration result.

The deployed SQLite library must support `RETURNING` (SQLite 3.35 or newer). See
[local setup and migration rules](../README.md#try-it-locally) for startup requirements.
The [database tests](../test/db.test.ts) and [API tests](../test/api.test.ts) cover
registration contention, rollback and retry, including independent connections.

## Database initialization and recovery

[Database initialization](../src/lib/db.ts) enables foreign keys and applies migrations before
sharing the connection. Failed initialization closes the connection and clears the shared
promise, so a later request can retry after the underlying configuration or schema problem
is corrected. Preserve existing data and migration history when fixing initialization;
do not reset the database to bypass an error.
