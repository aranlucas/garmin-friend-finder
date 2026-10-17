import { spawnSync, execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "vitest";

const fixtures: string[] = [];

afterEach(() => {
  for (const directory of fixtures.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "friend-finder-init-"));
  fixtures.push(directory);
  mkdirSync(join(directory, "db"));
  copyFileSync(new URL("../package.json", import.meta.url), join(directory, "package.json"));
  copyFileSync(new URL("../db/schema.sql", import.meta.url), join(directory, "db/schema.sql"));

  return directory;
}

function query(directory: string, sql: string) {
  return execFileSync("sqlite3", ["friends.db", sql], { cwd: directory, encoding: "utf8" }).trim();
}

function initialize(directory: string) {
  return spawnSync("pnpm", ["run", "init-db"], {
    cwd: directory,
    encoding: "utf8",
    timeout: 10_000,
  });
}

test("native initializer creates the documented schema and safely repeats", () => {
  const directory = fixture();
  const first = initialize(directory);
  expect(first.error).toBeUndefined();
  expect(first.status).toBe(0);
  expect(first.stdout).toContain("Database initialized successfully");
  expect(query(directory, "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")).toBe(
    "locations\nusers\nverification_codes",
  );
  expect(query(directory, "SELECT id || ':' || short_name FROM users")).toBe("006-B4314-00:LA");
  query(directory, "INSERT INTO users(id, short_name) VALUES ('keep', 'KEEP')");
  const second = initialize(directory);
  expect(second.error).toBeUndefined();
  expect(second.status).toBe(0);
  expect(query(directory, "SELECT id || ':' || short_name FROM users ORDER BY id")).toBe(
    "006-B4314-00:LA\nkeep:KEEP",
  );
  expect(query(directory, "PRAGMA foreign_key_list(locations)")).toContain("users|user_id|id");
  expect(query(directory, "PRAGMA foreign_key_list(verification_codes)")).toContain(
    "users|user_id|id",
  );
});

test("native initializer propagates SQL failure and preserves existing data", () => {
  const directory = fixture();
  query(
    directory,
    "CREATE TABLE users(id TEXT PRIMARY KEY); INSERT INTO users(id) VALUES ('keep')",
  );
  const result = initialize(directory);
  expect(result.error).toBeUndefined();
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("short_name");
  expect(result.stdout).not.toContain("Database initialized successfully");
  expect(query(directory, "SELECT id FROM users")).toBe("keep");
  expect(query(directory, "PRAGMA integrity_check")).toBe("ok");
});

test("native initializer rolls back changes made before a seed failure", () => {
  const directory = fixture();
  query(
    directory,
    `CREATE TABLE users(id TEXT PRIMARY KEY, short_name TEXT NOT NULL);
     INSERT INTO users(id, short_name) VALUES ('keep', 'KEEP');
     CREATE TRIGGER reject_sample BEFORE INSERT ON users
     WHEN NEW.id = '006-B4314-00'
     BEGIN
       UPDATE users SET short_name = 'MUTATED' WHERE id = 'keep';
       SELECT RAISE(FAIL, 'fixture seed denied');
     END;`,
  );
  const result = initialize(directory);
  expect(result.error).toBeUndefined();
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("fixture seed denied");
  expect(result.stdout).not.toContain("Database initialized successfully");
  expect(query(directory, "SELECT id || ':' || short_name FROM users")).toBe("keep:KEEP");
});
