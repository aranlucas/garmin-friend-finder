import { NextResponse } from "next/server";
import type { Friend } from "@/types";
import db from "@/lib/db";
import { calculateBearing } from "@/lib/geo";

export async function GET() {
  try {
    const friends = await db.all<Friend[]>("SELECT * FROM friends");
    return NextResponse.json(friends);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "database error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const lat = formData.get("lat");
  const lon = formData.get("lon");
  const id = formData.get("id");

  if (!lat || !lon || !id) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const user: Friend = {
    id: id.toString(),
    name: id.toString(),
    short_name: id.toString(),
    latitude: Number(lat),
    longitude: Number(lon),
  };

  await db.run(
    `INSERT OR REPLACE INTO friends (id, name, short_name, latitude, longitude) 
     VALUES (?, ?, ?, ?, ?)`,
    [user.id, user.name, user.short_name, user.latitude, user.longitude]
  );

  const friends = await db.all<Friend[]>("SELECT * FROM friends");

  const friendsWithBearing = friends.map((friend) => ({
    ...friend,
    bearing: calculateBearing(
      user.latitude,
      user.longitude,
      friend.latitude,
      friend.longitude
    ),
    distance: 20,
  }));

  return NextResponse.json(friendsWithBearing);
}
