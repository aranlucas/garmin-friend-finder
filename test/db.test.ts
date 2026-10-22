import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sqlite3 from "sqlite3";
import { Database, open } from "sqlite";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { getDb } from "@/lib/db";

let directory: string;

let filename: string;

let previousPromise: Promise<Database> | undefined;

const connections = new Set<Database>();

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "garmin-db-test-"));
  filename = path.join(directory, "friends.db");
  previousPromise = globalThis.dbPromise;
  globalThis.dbPromise = undefined;
  vi.stubEnv("DATABASE_PATH", filename);
  vi.stubEnv("SEED_DEMO_DATA", "false");
});

afterEach(async () => {
  await Promise.all([...connections].map((db) => db.close()));
  connections.clear();
  globalThis.dbPromise = previousPromise;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  await rm(directory, { recursive: true, force: true });
});

async function connect() {
  const db = await getDb();
  connections.add(db);

  return db;
}

async function rawConnection() {
  const db = await open({ filename, driver: sqlite3.Database });
  connections.add(db);

  return db;
}

async function close(db: Database) {
  await db.close();
  connections.delete(db);
  globalThis.dbPromise = undefined;
}

test("concurrent callers share a connection that is migrated before use, without demo data", async () => {
  const first = getDb();
  const second = getDb();

  expect(second).toBe(first);
  const [db, shared] = await Promise.all([first, second]);
  connections.add(db);

  expect(shared).toBe(db);
  expect(getDb()).toBe(first);
  expect(await db.all("SELECT id FROM migrations ORDER BY id")).toEqual([{ id: 1 }, { id: 2 }]);
  expect(await db.all("SELECT * FROM users")).toEqual([]);
  expect(await db.all("SELECT * FROM locations")).toEqual([]);
  expect(await db.all("SELECT * FROM verification_codes")).toEqual([]);
});

test("reopening an initialized database preserves records and applied migration history", async () => {
  const db = await connect();
  await db.exec(`
    INSERT INTO users VALUES ('keep', 'KEEP');
    INSERT INTO locations VALUES ('keep', 47, -122);
    INSERT INTO verification_codes (code, user_id, created_at)
    VALUES ('pending', 'new-user', '2026-01-01 12:00:00');
  `);
  const migrations = await db.all("SELECT * FROM migrations ORDER BY id");
  await close(db);

  const reopened = await connect();

  expect(await reopened.all("SELECT * FROM migrations ORDER BY id")).toEqual(migrations);
  expect(await reopened.all("SELECT * FROM users")).toEqual([{ id: "keep", short_name: "KEEP" }]);
  expect(await reopened.all("SELECT * FROM locations")).toEqual([
    { user_id: "keep", latitude: 47, longitude: -122 },
  ]);
  expect(await reopened.all("SELECT * FROM verification_codes")).toEqual([
    { code: "pending", user_id: "new-user", created_at: "2026-01-01 12:00:00" },
  ]);
});

test("adopts the old initializer's schema while preserving pending verification codes", async () => {
  const legacy = await rawConnection();
  await legacy.exec(
    await readFile(new URL("../db/migrations/001-initial.sql", import.meta.url), "utf8"),
  );
  await legacy.exec(`
    INSERT INTO users VALUES ('006-B4314-00', 'CUSTOM');
    INSERT INTO locations VALUES ('006-B4314-00', 47, -122);
    INSERT INTO verification_codes (code, user_id, created_at)
    VALUES ('pending', 'new-user', '2026-01-01 12:00:00');
  `);
  await close(legacy);

  const db = await connect();

  expect(await db.all("SELECT * FROM users")).toEqual([
    { id: "006-B4314-00", short_name: "CUSTOM" },
  ]);
  expect(await db.all("SELECT * FROM locations")).toEqual([
    { user_id: "006-B4314-00", latitude: 47, longitude: -122 },
  ]);
  expect(await db.all("SELECT * FROM verification_codes")).toEqual([
    { code: "pending", user_id: "new-user", created_at: "2026-01-01 12:00:00" },
  ]);
  expect(await db.all("PRAGMA foreign_key_check")).toEqual([]);
  expect(await db.all("PRAGMA foreign_key_list(verification_codes)")).toEqual([]);
});

test("enforces location foreign keys on every opened application connection", async () => {
  const db = await connect();

  expect(await db.get("PRAGMA foreign_keys")).toEqual({ foreign_keys: 1 });
  await expect(db.run("INSERT INTO locations VALUES ('missing', 0, 0)")).rejects.toThrow(
    "FOREIGN KEY constraint failed",
  );
  await db.run("INSERT INTO users VALUES ('keep', 'KEEP')");
  await db.run("INSERT INTO locations VALUES ('keep', 0, 0)");
  await expect(db.run("DELETE FROM users WHERE id = 'keep'")).rejects.toThrow(
    "FOREIGN KEY constraint failed",
  );
  await close(db);

  const reopened = await connect();
  await expect(reopened.run("INSERT INTO locations VALUES ('missing', 0, 0)")).rejects.toThrow(
    "FOREIGN KEY constraint failed",
  );
});

test("migration failure rolls back changes, closes the connection, and allows retry", async () => {
  const legacy = await rawConnection();
  await legacy.exec(`
    CREATE TABLE verification_codes (code TEXT PRIMARY KEY, user_id TEXT NOT NULL);
    INSERT INTO verification_codes VALUES ('keep', 'pending-user');
  `);
  await close(legacy);
  const closeSpy = vi.spyOn(Database.prototype, "close");

  await expect(getDb()).rejects.toThrow("created_at");

  expect(closeSpy).toHaveBeenCalledOnce();
  expect(globalThis.dbPromise).toBeUndefined();
  const db = await rawConnection();
  expect(await db.all("SELECT * FROM verification_codes")).toEqual([
    { code: "keep", user_id: "pending-user" },
  ]);
  expect(
    await db.all("SELECT name FROM sqlite_master WHERE name = 'pending_verification_codes'"),
  ).toEqual([]);
  expect(await db.all("SELECT id FROM migrations")).toEqual([{ id: 1 }]);

  await db.exec("ALTER TABLE verification_codes ADD COLUMN created_at DATETIME");
  await close(db);

  const retried = await connect();
  expect(await retried.all("SELECT id FROM migrations ORDER BY id")).toEqual([
    { id: 1 },
    { id: 2 },
  ]);
  expect(await retried.all("SELECT * FROM verification_codes")).toEqual([
    { code: "keep", user_id: "pending-user", created_at: null },
  ]);
});

test("an open failure clears the shared promise so configuration can be corrected", async () => {
  vi.stubEnv("DATABASE_PATH", path.join(directory, "missing", "friends.db"));
  await expect(getDb()).rejects.toThrow("SQLITE_CANTOPEN");
  expect(globalThis.dbPromise).toBeUndefined();

  vi.stubEnv("DATABASE_PATH", filename);
  const db = await connect();
  expect(await db.all("SELECT * FROM users")).toEqual([]);
});

test("development demo seeding is opt-in and preserves edits and dependent locations", async () => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("SEED_DEMO_DATA", "true");
  const db = await connect();

  expect(await db.all("SELECT * FROM users")).toEqual([{ id: "006-B4314-00", short_name: "LA" }]);
  await db.exec(`
    UPDATE users SET short_name = 'CUSTOM';
    INSERT INTO locations VALUES ('006-B4314-00', 47, -122);
  `);
  await close(db);

  const reopened = await connect();
  expect(await reopened.all("SELECT * FROM users")).toEqual([
    { id: "006-B4314-00", short_name: "CUSTOM" },
  ]);
  expect(await reopened.all("SELECT * FROM locations")).toEqual([
    { user_id: "006-B4314-00", latitude: 47, longitude: -122 },
  ]);
});

test("production ignores the demo seed setting", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("SEED_DEMO_DATA", "true");
  const db = await connect();

  expect(await db.all("SELECT * FROM users")).toEqual([]);
});
