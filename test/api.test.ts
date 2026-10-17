import sqlite3 from "sqlite3";
import { type Database, open } from "sqlite";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";
import { POST as register } from "@/app/api/account/register/route";
import { GET as getFriends, POST as updateLocation } from "@/app/api/friends/route";
import { calculateDistance } from "@/lib/geo";

let database: Database;

let previousPromise: Promise<Database> | undefined;

beforeEach(async () => {
  previousPromise = globalThis.dbPromise;
  database = await open({ filename: ":memory:", driver: sqlite3.Database });
  globalThis.dbPromise = Promise.resolve(database);
  await database.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY, short_name TEXT NOT NULL);
    CREATE TABLE locations (user_id TEXT PRIMARY KEY, latitude REAL, longitude REAL);
    CREATE TABLE verification_codes (code TEXT PRIMARY KEY, user_id TEXT NOT NULL);
    INSERT INTO verification_codes VALUES ('valid-code', 'new-user');
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

  test("rolls back failed registration and emits a sanitized diagnostic", async () => {
    await database.run("INSERT INTO users VALUES ('new-user', 'Existing')");
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
