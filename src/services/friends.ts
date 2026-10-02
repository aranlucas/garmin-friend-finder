import { getDb } from "@/lib/db";
import { calculateBearing, calculateDistance } from "@/lib/geo";
import type { Friend, FriendWithOptionalLocation } from "@/types";

// Callers must obtain the viewer from auth(), never from request fields.
type Viewer = { id?: string } | null | undefined;

type LocationErrorCode = "unauthorized" | "invalid_coordinates" | "user_not_found";

export class LocationSharingError extends Error {
  constructor(public readonly code: LocationErrorCode) {
    super(code);
    this.name = "LocationSharingError";
  }
}

function requireUserId(viewer: Viewer): string {
  if (typeof viewer?.id !== "string" || viewer.id.trim() === "") {
    throw new LocationSharingError("unauthorized");
  }
  return viewer.id;
}

function parseCoordinate(value: unknown, limit: number): number {
  // Reject empty fields, files, JS-only number syntax, and partial numbers.
  if (typeof value === "string") {
    const text = value.trim();
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) {
      throw new LocationSharingError("invalid_coordinates");
    }
    value = Number(text);
  }
  if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > limit) {
    throw new LocationSharingError("invalid_coordinates");
  }
  return value;
}

// Preserve the prototype's policy: every signed-in viewer can see all friends.
export async function getAllFriends(viewer: Viewer): Promise<FriendWithOptionalLocation[]> {
  requireUserId(viewer);
  const db = await getDb();
  return db.all<FriendWithOptionalLocation[]>(`
    SELECT
      u.id,
      u.short_name,
      l.latitude,
      l.longitude
    FROM users u
    LEFT JOIN locations l ON u.id = l.user_id
  `);
}

export async function getFriendsWithLocations(viewer: Viewer): Promise<Friend[]> {
  requireUserId(viewer);
  const db = await getDb();
  return db.all<Friend[]>(`
    SELECT
      u.id,
      u.short_name,
      l.latitude,
      l.longitude
    FROM locations l
    INNER JOIN users u ON l.user_id = u.id
  `);
}

export async function shareMyLocation(
  viewer: Viewer,
  point: { latitude: unknown; longitude: unknown },
): Promise<(Friend & { bearing: number; distance: number })[]> {
  const userId = requireUserId(viewer);
  const latitude = parseCoordinate(point.latitude, 90);
  const longitude = parseCoordinate(point.longitude, 180);
  const db = await getDb();

  // One statement checks existence and updates only the authenticated owner.
  const result = await db.run(
    `INSERT INTO locations (user_id, latitude, longitude)
     SELECT id, ?, ? FROM users WHERE id = ?
     ON CONFLICT(user_id) DO UPDATE SET
       latitude = excluded.latitude, longitude = excluded.longitude`,
    [latitude, longitude, userId],
  );
  if (result.changes === 0) {
    throw new LocationSharingError("user_not_found");
  }

  const friends = await getFriendsWithLocations(viewer);
  return friends
    .filter((friend) => friend.id !== userId)
    .map((friend) => ({
      ...friend,
      bearing: calculateBearing(latitude, longitude, friend.latitude, friend.longitude),
      distance: calculateDistance(latitude, longitude, friend.latitude, friend.longitude),
    }));
}
