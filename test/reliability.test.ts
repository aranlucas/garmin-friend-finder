import * as crypto from "node:crypto";
import { type Database } from "sqlite";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/account/route";
import { POST as register } from "@/app/api/account/register/route";
import { openDatabase } from "@/lib/db";
import { issueVerificationCode } from "@/services/accounts";

let database: Database;
let previousPromise: Promise<Database> | undefined;

beforeEach(async () => {
  previousPromise = globalThis.dbPromise;
  database = await openDatabase(":memory:");
  globalThis.dbPromise = Promise.resolve(database);
});

afterEach(async () => {
  globalThis.dbPromise = previousPromise;
  await database.close();
  vi.restoreAllMocks();
});

// Expected results follow the account protocol: malformed input cannot allocate codes,
// registration must leave a usable account, and collisions cannot replace another device's code.
test("missing, blank, file and malformed account IDs return 400 without allocating codes", async () => {
  const file = new FormData();
  file.set("id", new File(["private"], "id.txt"));

  for (const body of [new FormData(), new URLSearchParams({ id: "   " }), file, "invalid"]) {
    // Each response is checked before the next request uses the shared fixture.
    // oxlint-disable-next-line eslint/no-await-in-loop
    const response = await POST(
      new Request("http://localhost/api/account", { method: "POST", body }),
    );

    expect(response.status).toBe(400);
  }

  expect((await GET(new NextRequest("http://localhost/api/account"))).status).toBe(400);
  expect(await database.all("SELECT * FROM verification_codes")).toEqual([]);
});

test("blank names cannot consume registration codes", async () => {
  await database.run("INSERT INTO verification_codes (code, user_id) VALUES ('123456', 'device')");

  for (const shortName of ["", "   "]) {
    // Each response is checked before the next request uses the shared fixture.
    // oxlint-disable-next-line eslint/no-await-in-loop
    const response = await register(
      new Request("http://localhost/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "123456", shortName }),
      }),
    );

    expect(response.status).toBe(400);
  }

  expect(await database.all("SELECT id FROM users")).toEqual([]);
  expect(await database.get("SELECT code FROM verification_codes")).toEqual({ code: "123456" });
});

test("legacy accounts with empty names still report registered", async () => {
  await database.run("INSERT INTO users VALUES ('legacy', '')");
  expect((await GET(new NextRequest("http://localhost/api/account?id=legacy"))).status).toBe(200);
});

test("account storage failures return generic errors and sanitized diagnostics", async () => {
  await database.exec("DROP TABLE verification_codes");
  const diagnostic = vi.spyOn(process.stderr, "write").mockReturnValue(true);

  const response = await POST(
    new Request("http://localhost/api/account", {
      method: "POST",
      body: new URLSearchParams({ id: "private-device" }),
    }),
  );

  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "database error" });
  expect(diagnostic).toHaveBeenCalledWith(
    `${JSON.stringify({ level: "error", event: "account_failed", error: "Error" })}\n`,
  );
});

test("code collisions retry without consuming or replacing existing codes", async () => {
  await database.run("INSERT INTO verification_codes (code, user_id) VALUES ('123456', 'first')");
  vi.spyOn(Math, "random").mockReturnValue((123456 - 100000) / 900000);
  vi.spyOn(crypto, "randomInt")
    .mockImplementationOnce(() => 123456)
    .mockImplementationOnce(() => 654321);
  expect(await issueVerificationCode(database, "second")).toBe("654321");
  expect(await database.all("SELECT code, user_id FROM verification_codes ORDER BY code")).toEqual([
    { code: "123456", user_id: "first" },
    { code: "654321", user_id: "second" },
  ]);
});

test("persistent code collisions terminate without altering pending codes", async () => {
  await database.run("INSERT INTO verification_codes (code, user_id) VALUES ('123456', 'first')");
  const random = vi.spyOn(crypto, "randomInt").mockImplementation(() => 123456);
  await expect(issueVerificationCode(database, "second")).rejects.toThrow(
    "Verification code allocation exhausted",
  );
  expect(random).toHaveBeenCalledTimes(10);
  expect(await database.all("SELECT code, user_id FROM verification_codes")).toEqual([
    { code: "123456", user_id: "first" },
  ]);
});

test("registration racing issuance cannot leave a stale new code", async () => {
  await database.run("INSERT INTO verification_codes (code, user_id) VALUES ('123456', 'racing')");
  const lookup = Promise.withResolvers<void>();
  const resume = Promise.withResolvers<void>();
  const get = database.get.bind(database);
  let paused = false;
  vi.spyOn(database, "get").mockImplementation(async (...args) => {
    const result = await get<unknown>(...args);

    if (!paused) {
      paused = true;
      lookup.resolve();
      await resume.promise;
    }

    return result;
  });
  const issuance = issueVerificationCode(database, "racing");

  try {
    await lookup.promise;
    await database.run("INSERT INTO users VALUES ('racing', 'Racer')");
  } finally {
    resume.resolve();
  }

  expect(await issuance).toBeUndefined();
  expect(await database.all("SELECT * FROM verification_codes")).toEqual([]);
});
