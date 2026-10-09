import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "vitest";
import { getDb } from "../src/lib/db";

test("getDb reuses the process-wide connection promise", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "garmin-db-test-"));
  const previousDirectory = process.cwd();
  const previousPromise = globalThis.__dbPromise;

  process.chdir(directory);
  globalThis.__dbPromise = undefined;

  try {
    const first = getDb();

    assert.equal(getDb(), first);

    const database = await first;

    assert.equal(getDb(), first);
    assert.deepEqual(await database.get("SELECT 1 AS value"), { value: 1 });
    await database.close();
  } finally {
    globalThis.__dbPromise = previousPromise;
    process.chdir(previousDirectory);
    await rm(directory, { recursive: true, force: true });
  }
});
