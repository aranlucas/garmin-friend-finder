import type { Database } from "sqlite";

export interface RegisteredUser {
  id: string;
  short_name: string;
}

/**
 * Register a pending code atomically, returning undefined for absent or already-owned codes.
 * Migration 003 consumes the user's codes in the same SQLite statement transaction.
 * Storage failures propagate to the route's sanitized error boundary.
 */
export function registerAccount(
  db: Database,
  code: string,
  shortName: string,
): Promise<RegisteredUser | undefined> {
  return db.get<RegisteredUser>(
    `INSERT INTO users (id, short_name)
     SELECT user_id, ? FROM verification_codes WHERE code = ?
     ON CONFLICT(id) DO NOTHING
     RETURNING id, short_name`,
    [shortName, code],
  );
}
