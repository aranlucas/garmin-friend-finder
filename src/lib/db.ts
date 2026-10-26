import { readFile } from "node:fs/promises";
import path from "node:path";
import sqlite3 from "sqlite3";
import { type Database, open } from "sqlite";

declare global {
  var dbPromise: Promise<Database> | undefined;
}

/** Open and migrate a database before use; close failed initialization attempts. */
export async function openDatabase(filename: string): Promise<Database> {
  const db = await open({
    filename,
    driver: sqlite3.Database,
  });

  try {
    await db.exec("PRAGMA foreign_keys = ON");
    await db.migrate({ migrationsPath: path.join(process.cwd(), "db/migrations") });

    if (process.env.NODE_ENV === "development" && process.env.SEED_DEMO_DATA === "true") {
      await db.exec(await readFile(path.join(process.cwd(), "db/seed.sql"), "utf8"));
    }

    return db;
  } catch (error) {
    await db.close();
    throw error;
  }
}

/** Share initialized storage per process, allowing a later request to retry initialization failures. */
export function getDb(): Promise<Database> {
  globalThis.dbPromise ??= openDatabase(process.env.DATABASE_PATH ?? "./friends.db").catch(
    (error) => {
      globalThis.dbPromise = undefined;
      throw error;
    },
  );

  return globalThis.dbPromise;
}
