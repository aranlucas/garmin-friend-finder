import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import sqlite3 from "sqlite3";
import { open, type Database } from "sqlite";
import type { Session } from "next-auth";

let db: Database;
let session: Session | null;
let databaseAccesses: number;

// Auth.js is external; every query still runs against real, isolated SQLite.
mock.module("../src/auth.ts", { exports: { auth: async () => session } });
mock.module("../src/lib/db.ts", {
  exports: {
    getDb: async () => {
      databaseAccesses += 1;
      return db;
    },
  },
});

const { GET, POST } = await import("../src/app/api/friends/route.ts");
const { getAllFriends, getFriendsWithLocations, shareMyLocation, LocationSharingError } =
  await import("../src/services/friends.ts");

const alice = { id: "github:101" };
const bob = { id: "github:202" };
const charlie = { id: "github:303" };

beforeEach(async () => {
  session = { user: alice, expires: "2099-01-01T00:00:00.000Z" };
  databaseAccesses = 0;
  db = await open({ filename: ":memory:", driver: sqlite3.Database });
  await db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE users (id TEXT PRIMARY KEY, short_name TEXT NOT NULL);
    CREATE TABLE locations (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      latitude REAL NOT NULL,
      longitude REAL NOT NULL
    );
  `);
  for (const [user, name] of [
    [alice, "A"],
    [bob, "B"],
    [charlie, "C"],
  ] as const) {
    await db.run("INSERT INTO users (id, short_name) VALUES (?, ?)", [user.id, name]);
  }
  await db.run("INSERT INTO locations VALUES (?, ?, ?)", [alice.id, 10, 20]);
  await db.run("INSERT INTO locations VALUES (?, ?, ?)", [bob.id, 0, 1]);
});

afterEach(async () => {
  await db.close();
});

function formRequest(values: Record<string, string | Blob | undefined> = { lat: "0", lon: "0" }) {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) form.set(key, value);
  }
  return new Request("http://localhost/api/friends", { method: "POST", body: form });
}

async function savedLocations() {
  return db.all("SELECT * FROM locations ORDER BY user_id");
}

for (const unauthenticated of [null, { expires: "2099-01-01" }, { user: {}, expires: "2099" }]) {
  test(`anonymous or incomplete session cannot list or update locations: ${JSON.stringify(unauthenticated)}`, async () => {
    session = unauthenticated;
    const original = await savedLocations();
    assert.equal((await GET()).status, 401);
    const request = formRequest({ id: bob.id, lat: "30", lon: "40" });
    const parseBody = mock.method(request, "formData");
    assert.equal((await POST(request)).status, 401);
    assert.equal(parseBody.mock.callCount(), 0);
    assert.equal(databaseAccesses, 0);
    assert.deepEqual(await savedLocations(), original);
  });
}

test("module rejects unauthenticated readers and writers before accessing SQLite", async () => {
  for (const viewer of [null, undefined, {}, { id: "" }, { id: "   " }]) {
    for (const action of [
      () => getAllFriends(viewer),
      () => getFriendsWithLocations(viewer),
      () => shareMyLocation(viewer, { latitude: 0, longitude: 0 }),
    ]) {
      await assert.rejects(action, (error) => {
        assert.ok(error instanceof LocationSharingError);
        assert.equal(error.code, "unauthorized");
        return true;
      });
    }
  }
  assert.equal(databaseAccesses, 0);
});

test("authenticated GET preserves all-friends sharing, including people without coordinates", async () => {
  const response = await GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  const friends = await response.json();
  assert.equal(friends.length, 3);
  assert.deepEqual(
    friends.find((friend: { id: string }) => friend.id === charlie.id),
    {
      id: charlie.id,
      short_name: "C",
      latitude: null,
      longitude: null,
    },
  );
  assert.equal((await getFriendsWithLocations(alice)).length, 2);
});

test("authenticated viewers need not own a registered location to read the shared list", async () => {
  session!.user = { id: "github:404" };
  const response = await GET();
  assert.equal(response.status, 200);
  assert.equal((await response.json()).length, 3);
});

test("a forged form id cannot change another user's location or self-exclusion", async () => {
  const response = await POST(formRequest({ id: bob.id, lat: "0", lon: "0" }));
  assert.equal(response.status, 200);
  const friends = await response.json();
  assert.equal(friends.length, 1);
  assert.equal(friends[0].id, bob.id);
  assert.equal(friends[0].latitude, 0);
  assert.equal(friends[0].longitude, 1);
  assert.equal(friends[0].bearing, 90);
  assert.ok(Math.abs(friends[0].distance - (20902231 * Math.PI) / 180) < 0.000001);
  assert.deepEqual(await savedLocations(), [
    { user_id: alice.id, latitude: 0, longitude: 0 },
    { user_id: bob.id, latitude: 0, longitude: 1 },
  ]);
});

test("POST does not require the old client-controlled id field", async () => {
  const response = await POST(formRequest());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
});

test("sharing creates and then updates only the authenticated user's location", async () => {
  session!.user = charlie;
  assert.equal((await POST(formRequest({ lat: "-30.5", lon: "40.25" }))).status, 200);
  assert.equal((await POST(formRequest({ lat: "32", lon: "-42" }))).status, 200);
  assert.deepEqual(await db.get("SELECT * FROM locations WHERE user_id = ?", [charlie.id]), {
    user_id: charlie.id,
    latitude: 32,
    longitude: -42,
  });
  assert.equal((await savedLocations()).length, 3);
});

test("an unregistered actor gets a typed not-found result without writing or listing locations", async () => {
  session!.user = { id: "github:404" };
  const original = await savedLocations();
  const response = await POST(formRequest({ id: alice.id, lat: "0", lon: "0" }));
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "user_not_found" });
  await assert.rejects(
    () => shareMyLocation(session?.user, { latitude: 0, longitude: 0 }),
    (error) => error instanceof LocationSharingError && error.code === "user_not_found",
  );
  assert.deepEqual(await savedLocations(), original);
});

for (const [lat, lon] of [
  ["0", "0"],
  ["90", "180"],
  ["-90", "-180"],
  [" +.5 ", "-1.2e2"],
]) {
  test(`valid coordinates round-trip: ${lat}, ${lon}`, async () => {
    assert.equal((await POST(formRequest({ lat, lon }))).status, 200);
    assert.deepEqual(await db.get("SELECT * FROM locations WHERE user_id = ?", [alice.id]), {
      user_id: alice.id,
      latitude: Number(lat),
      longitude: Number(lon),
    });
  });
}

for (const value of [
  "",
  " ",
  "NaN",
  "Infinity",
  "-Infinity",
  "1e999",
  "12x",
  "0x10",
  "0b10",
  "1,5",
]) {
  for (const field of ["lat", "lon"]) {
    test(`reject malformed ${field}: ${JSON.stringify(value)}`, async () => {
      const original = await savedLocations();
      const response = await POST(formRequest({ lat: "0", lon: "0", [field]: value }));
      assert.equal(response.status, 400);
      assert.equal(databaseAccesses, 0);
      assert.deepEqual(await savedLocations(), original);
    });
  }
}

for (const values of [
  { lat: "90.001", lon: "0" },
  { lat: "-90.001", lon: "0" },
  { lat: "0", lon: "180.001" },
  { lat: "0", lon: "-180.001" },
  { lat: "0" },
  { lon: "0" },
  { lat: new Blob(["0"]), lon: "0" },
  { lat: "0", lon: new Blob(["0"]) },
]) {
  test(`reject missing, out-of-range or file coordinates: ${JSON.stringify(values)}`, async () => {
    const original = await savedLocations();
    assert.equal((await POST(formRequest(values))).status, 400);
    assert.equal(databaseAccesses, 0);
    assert.deepEqual(await savedLocations(), original);
  });
}

for (const field of ["lat", "lon"]) {
  test(`reject duplicate ${field} fields`, async () => {
    const form = new FormData();
    form.set("lat", "0");
    form.set("lon", "0");
    form.append(field, "1");
    const response = await POST(
      new Request("http://localhost/api/friends", { method: "POST", body: form }),
    );
    assert.equal(response.status, 400);
    assert.equal(databaseAccesses, 0);
  });
}

test("malformed form encoding returns 400 rather than an uncaught exception", async () => {
  for (const headers of [
    { "Content-Type": "application/json" },
    { "Content-Type": "multipart/form-data" },
  ]) {
    const response = await POST(
      new Request("http://localhost/api/friends", { method: "POST", headers, body: "not a form" }),
    );
    assert.equal(response.status, 400);
  }
  assert.equal(databaseAccesses, 0);
});

test("direct module callers cannot bypass finite coordinate validation", async () => {
  for (const value of [NaN, Infinity, -Infinity, null, undefined, true, {}, [0]]) {
    for (const point of [
      { latitude: value, longitude: 0 },
      { latitude: 0, longitude: value },
    ]) {
      await assert.rejects(
        () => shareMyLocation(alice, point),
        (error) => error instanceof LocationSharingError && error.code === "invalid_coordinates",
      );
    }
  }
  assert.equal(databaseAccesses, 0);
});

test("database failures return a generic 500 without leaking exception details", async (context) => {
  const logged = context.mock.method(console, "error", () => {});
  await db.exec("DROP TABLE locations");
  for (const response of [await GET(), await POST(formRequest())]) {
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: "server error" });
  }
  assert.equal(logged.mock.callCount(), 2);
});

test("valid antipodal coordinates return a finite distance", async () => {
  await db.run("UPDATE locations SET latitude = ?, longitude = ? WHERE user_id = ?", [
    89.7673,
    -162.7,
    bob.id,
  ]);
  const friends = await shareMyLocation(alice, { latitude: -89.7673, longitude: 17.3 });
  assert.equal(friends.length, 1);
  assert.ok(Number.isFinite(friends[0].distance));
  assert.ok(Math.abs(friends[0].distance - 20902231 * Math.PI) < 1);
});
