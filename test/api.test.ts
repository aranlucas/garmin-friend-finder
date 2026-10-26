import { type Database } from "sqlite";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";
import { POST as createVerificationCode } from "@/app/api/account/route";
import { POST as register } from "@/app/api/account/register/route";
import { GET as getFriends, POST as updateLocation } from "@/app/api/friends/route";
import { calculateDistance } from "@/lib/geo";
import { openDatabase } from "@/lib/db";

let database: Database;

let previousPromise: Promise<Database> | undefined;

beforeEach(async () => {
  previousPromise = globalThis.dbPromise;
  database = await openDatabase(":memory:");
  globalThis.dbPromise = Promise.resolve(database);
  await database.exec(`
    INSERT INTO verification_codes (code, user_id) VALUES ('valid-code', 'new-user');
    INSERT INTO users VALUES ('current-user', 'Current'), ('other-user', 'Other');
    INSERT INTO locations VALUES ('other-user', 0, 1);
  `);
});

afterEach(async () => {
  globalThis.dbPromise = previousPromise;
  await database.close();
  vi.restoreAllMocks();
});

function registrationRequest(body: string): Request {
  return new Request("http://localhost/api/account/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

function locationRequest(id: string, lat: string, lon: string): Request {
  return new Request("http://localhost/api/friends", {
    method: "POST",
    body: new URLSearchParams({ id, lat, lon }),
  });
}

describe("registration boundary", () => {
  test("issues a code before its user exists and completes registration", async () => {
    const issued = await createVerificationCode(
      new Request("http://localhost/api/account", {
        method: "POST",
        body: new URLSearchParams({ id: "pending-user" }),
      }),
    );

    const { code } = z.object({ code: z.string() }).parse(await issued.json());

    expect(issued.status).toBe(201);
    expect(await database.get("SELECT id FROM users WHERE id = 'pending-user'")).toBeUndefined();

    const response = await register(
      registrationRequest(JSON.stringify({ code, shortName: "Pending" })),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: "pending-user", short_name: "Pending" });
    expect(
      await database.get("SELECT code FROM verification_codes WHERE code = ?", code),
    ).toBeUndefined();
  });
  test.each([
    "null",
    "[]",
    "{}",
    '"string"',
    '{"code":"valid-code"}',
    '{"shortName":"Name"}',
    '{"code":123,"shortName":"Name"}',
    '{"code":"valid-code","shortName":null}',
    "{invalid json",
  ])("rejects invalid JSON input %s without consuming the code", async (body) => {
    const response = await register(registrationRequest(body));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid registration data" });
    expect(await database.get("SELECT code FROM verification_codes")).toEqual({
      code: "valid-code",
    });
  });

  test("registers a user and consumes the verification code once", async () => {
    const body = JSON.stringify({ code: "valid-code", shortName: "Trail friend" });
    const response = await register(registrationRequest(body));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: "new-user", short_name: "Trail friend" });
    expect(await database.all("SELECT * FROM verification_codes")).toEqual([]);

    const repeated = await register(registrationRequest(body));

    expect(repeated.status).toBe(404);
    expect(await repeated.json()).toEqual({ error: "Invalid verification code" });
  });

  test("independent registrations can share the connection concurrently", async () => {
    await database.run(
      "INSERT INTO verification_codes (code, user_id) VALUES ('second-code', 'second-user')",
    );

    const responses = await Promise.all([
      register(registrationRequest(JSON.stringify({ code: "valid-code", shortName: "First" }))),
      register(registrationRequest(JSON.stringify({ code: "second-code", shortName: "Second" }))),
    ]);

    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(await database.all("SELECT * FROM verification_codes")).toEqual([]);
    expect(
      await database.all(
        "SELECT id, short_name FROM users WHERE id IN ('new-user', 'second-user') ORDER BY id",
      ),
    ).toEqual([
      { id: "new-user", short_name: "First" },
      { id: "second-user", short_name: "Second" },
    ]);
  });

  test("a code can only win one concurrent registration", async () => {
    const responses = await Promise.all([
      register(registrationRequest(JSON.stringify({ code: "valid-code", shortName: "First" }))),
      register(registrationRequest(JSON.stringify({ code: "valid-code", shortName: "Second" }))),
    ]);

    expect(
      responses.map((response) => response.status).toSorted((left, right) => left - right),
    ).toEqual([200, 404]);
    expect(await database.all("SELECT * FROM verification_codes")).toEqual([]);
    const winner = responses.find((response) => response.status === 200);
    expect(winner).toBeDefined();
    expect(await database.get("SELECT id, short_name FROM users WHERE id = 'new-user'")).toEqual(
      await winner?.json(),
    );
  });

  test("an invalid registration cannot roll back another request's successful location update", async () => {
    const reachedLookup = Promise.withResolvers<void>();
    const continueRegistration = Promise.withResolvers<void>();
    const get = database.get.bind(database);

    vi.spyOn(database, "get").mockImplementation(async (...args) => {
      const result = await get<unknown>(...args);

      if (z.string().parse(args[0]).includes("FROM verification_codes")) {
        reachedLookup.resolve();
        await continueRegistration.promise;
      }

      return result;
    });

    const response = register(
      registrationRequest(JSON.stringify({ code: "missing-code", shortName: "Missing" })),
    );

    try {
      await reachedLookup.promise;
      expect((await updateLocation(locationRequest("current-user", "12", "34"))).status).toBe(200);
    } finally {
      continueRegistration.resolve();
      await response;
    }

    expect((await response).status).toBe(404);
    expect(await database.get("SELECT * FROM locations WHERE user_id = 'current-user'")).toEqual({
      user_id: "current-user",
      latitude: 12,
      longitude: 34,
    });
  });

  test("registering a user invalidates every pending code for that user", async () => {
    await database.run(
      "INSERT INTO verification_codes (code, user_id) VALUES ('second-code', 'new-user')",
    );

    const first = await register(
      registrationRequest(JSON.stringify({ code: "valid-code", shortName: "First" })),
    );

    const second = await register(
      registrationRequest(JSON.stringify({ code: "second-code", shortName: "Second" })),
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(404);
    expect(await database.all("SELECT * FROM verification_codes")).toEqual([]);
    expect(await database.get("SELECT short_name FROM users WHERE id = 'new-user'")).toEqual({
      short_name: "First",
    });
  });

  test("rolls back failed registration and emits a sanitized diagnostic", async () => {
    await database.exec(`
      CREATE TRIGGER reject_registration BEFORE INSERT ON users
      WHEN NEW.id = 'new-user'
      BEGIN
        SELECT RAISE(ABORT, 'Private database failure');
      END;
    `);
    const diagnostic = vi.spyOn(process.stderr, "write").mockReturnValue(true);

    const response = await register(
      registrationRequest(JSON.stringify({ code: "valid-code", shortName: "Private name" })),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Failed to register" });
    expect(await database.get("SELECT code FROM verification_codes")).toEqual({
      code: "valid-code",
    });
    expect(diagnostic).toHaveBeenCalledWith(
      `${JSON.stringify({ level: "error", event: "registration_failed", error: "Error" })}\n`,
    );
  });

  test("a code-consumption failure rolls back the inserted user and allows retry", async () => {
    await database.exec(`
      CREATE TRIGGER reject_code_consumption BEFORE DELETE ON verification_codes
      BEGIN
        SELECT RAISE(ABORT, 'Private code-consumption failure');
      END;
    `);
    vi.spyOn(process.stderr, "write").mockReturnValue(true);
    const body = JSON.stringify({ code: "valid-code", shortName: "Pending" });

    expect((await register(registrationRequest(body))).status).toBe(500);
    expect(await database.get("SELECT id FROM users WHERE id = 'new-user'")).toBeUndefined();
    expect(await database.get("SELECT code FROM verification_codes")).toEqual({
      code: "valid-code",
    });

    await database.exec("DROP TRIGGER reject_code_consumption");
    expect((await register(registrationRequest(body))).status).toBe(200);
  });

  test("a stale code cannot overwrite an existing account", async () => {
    await database.run(
      "INSERT INTO verification_codes (code, user_id) VALUES ('stale-code', 'current-user')",
    );

    const response = await register(
      registrationRequest(JSON.stringify({ code: "stale-code", shortName: "Replacement" })),
    );

    expect(response.status).toBe(404);
    expect(await database.get("SELECT short_name FROM users WHERE id = 'current-user'")).toEqual({
      short_name: "Current",
    });
  });
});

describe("friend location boundary", () => {
  test.each([
    ["", "0", "0"],
    ["current-user", "", "0"],
    ["current-user", "0", ""],
    ["current-user", " ", "0"],
    ["current-user", "NaN", "0"],
    ["current-user", "0", "Infinity"],
    ["current-user", "91", "0"],
    ["current-user", "-91", "0"],
    ["current-user", "0", "181"],
    ["current-user", "0", "-181"],
  ])("rejects invalid coordinates %s / %s / %s", async (id, lat, lon) => {
    const response = await updateLocation(locationRequest(id, lat, lon));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "bad request" });
    expect(await database.all("SELECT * FROM locations WHERE user_id = 'current-user'")).toEqual(
      [],
    );
  });

  test("rejects missing fields", async () => {
    const response = await updateLocation(
      new Request("http://localhost/api/friends", { method: "POST", body: new FormData() }),
    );

    expect(response.status).toBe(400);
  });

  test.each(["id", "lat", "lon"])("rejects file values for %s", async (field) => {
    const body = new FormData();
    body.set("id", "current-user");
    body.set("lat", "0");
    body.set("lon", "0");
    body.set(field, new File(["0"], "coordinate.txt"));

    const response = await updateLocation(
      new Request("http://localhost/api/friends", { method: "POST", body }),
    );

    expect(response.status).toBe(400);
  });

  test("rejects an unsupported request body", async () => {
    const response = await updateLocation(
      new Request("http://localhost/api/friends", { method: "POST", body: "not form data" }),
    );

    expect(response.status).toBe(400);
  });

  test("stores zero coordinates and returns other friends with distance and bearing", async () => {
    const response = await updateLocation(locationRequest("current-user", "0", "0"));

    expect(response.status).toBe(200);
    expect(await database.get("SELECT * FROM locations WHERE user_id = 'current-user'")).toEqual({
      user_id: "current-user",
      latitude: 0,
      longitude: 0,
    });
    expect(await response.json()).toEqual([
      {
        id: "other-user",
        short_name: "Other",
        latitude: 0,
        longitude: 1,
        bearing: 90,
        distance: calculateDistance(0, 0, 0, 1),
      },
    ]);
    expect((await getFriends()).status).toBe(200);
  });

  test.each([
    ["-90", "-180"],
    ["90", "180"],
    ["-12.5", "150.25"],
  ])("accepts finite coordinates %s / %s", async (lat, lon) => {
    expect((await updateLocation(locationRequest("current-user", lat, lon))).status).toBe(200);
  });

  test("returns a finite JSON distance for antipodal friends", async () => {
    await database.run("UPDATE locations SET latitude = 58, longitude = 180");

    const response = await updateLocation(locationRequest("current-user", "-58", "0"));
    const friends = z.array(z.object({ distance: z.number() })).parse(await response.json());

    expect(response.status).toBe(200);
    expect(friends).toHaveLength(1);
    expect(friends[0].distance).toBeCloseTo(Math.PI * 20902231, 3);
  });

  test("returns a sanitized error when a user does not exist", async () => {
    const diagnostic = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    const response = await updateLocation(locationRequest("private-missing-id", "0", "0"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "database error" });
    expect(diagnostic).toHaveBeenCalledWith(
      `${JSON.stringify({ level: "error", event: "friends_failed", error: "Error" })}\n`,
    );
  });
});
