import { randomInt } from "node:crypto";
import type { Database } from "sqlite";

interface VerificationCode {
  code: string;
}

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

  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomInt(100000, 1000000).toString();

    // Collision attempts must be sequential: stop as soon as one code is allocated.
    // oxlint-disable-next-line eslint/no-await-in-loop
    const result = await db.get<VerificationCode>(
      `INSERT INTO verification_codes (code, user_id)
       SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = ?)
       ON CONFLICT(code) DO NOTHING RETURNING code`,
      [code, id, id],
    );

    if (result) {
      return result.code;
    }

    // No result can mean the device registered during issuance, rather than a collision.
    // oxlint-disable-next-line eslint/no-await-in-loop
    if (await findAccount(db, id)) {
      return;
    }
  }

  throw new Error("Verification code allocation exhausted");
}
