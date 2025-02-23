import db from "@/lib/db";
import type { Friend } from "@/types";

export async function getAllFriends(): Promise<Friend[]> {
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

export async function getFriendsWithLocations(): Promise<Friend[]> {
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

export async function updateFriendLocation(
  userId: string,
  latitude: number,
  longitude: number
) {
  // First check if user exists
  const user = await db.get("SELECT id FROM users WHERE id = ?", [userId]);
  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  return db.run(
    `INSERT OR REPLACE INTO locations (user_id, latitude, longitude) 
     VALUES (?, ?, ?)`,
    [userId, latitude, longitude]
  );
}
