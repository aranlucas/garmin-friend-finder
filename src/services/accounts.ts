import type { Database } from "sqlite";

export interface Account {
  id: string;
  short_name: string;
}

/**
 * Migration 003 consumes the user's codes in the same SQLite statement transaction.
 */
export function registerAccount(
  db: Database,
  code: string,
  shortName: string,
): Promise<Account | undefined> {
  return db.get<Account>(
    `INSERT INTO users (id, short_name)
     SELECT user_id, ? FROM verification_codes WHERE code = ?
     ON CONFLICT(id) DO NOTHING
     RETURNING id, short_name`,
    [shortName, code],
  );
}

export function findAccount(db: Database, id: string | null) {
  return db.get<Account>("SELECT id, short_name FROM users WHERE id = ?", [id]);
}

export async function issueVerificationCode(db: Database, id: string | null) {
  if (await findAccount(db, id)) {
    return;
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await db.run("INSERT INTO verification_codes (code, user_id) VALUES (?, ?)", [code, id]);

  return code;
}
