import { getDb } from "@/lib/db";
import type { Friend, LocatedFriend } from "@/types";

export async function getAllFriends(): Promise<Friend[]> {
  const db = await getDb();

  return db.all<Friend[]>(`
    SELECT 
      u.id,
      u.short_name,
      l.latitude,
      l.longitude
    FROM users u
    LEFT JOIN locations l ON u.id = l.user_id
  `);
}

export async function getFriendsWithLocations(): Promise<LocatedFriend[]> {
  const db = await getDb();

  return db.all<LocatedFriend[]>(`
    SELECT 
      u.id,
      u.short_name,
      l.latitude,
      l.longitude
    FROM locations l
    INNER JOIN users u ON l.user_id = u.id
  `);
}

export async function updateFriendLocation(userId: string, latitude: number, longitude: number) {
  const db = await getDb();

  return db.run(
    `INSERT INTO locations (user_id, latitude, longitude)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET latitude = excluded.latitude, longitude = excluded.longitude`,
    [userId, latitude, longitude],
  );
}
