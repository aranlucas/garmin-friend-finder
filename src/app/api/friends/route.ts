import { NextResponse } from "next/server";
import type { Friend } from "@/types";
import db from "@/lib/db";

export async function GET() {
  const friends = await db.all<Friend[]>("SELECT * FROM friends");
  return NextResponse.json(friends);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { lat, lon, id } = body;

  if (!lat || !lon || !id) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const user: Friend = {
    id,
    name: id,
    short_name: id,
    latitude: Number(lat),
    longitude: Number(lon),
  };

  await db.run(
    `INSERT OR REPLACE INTO friends (id, name, short_name, latitude, longitude) 
     VALUES (?, ?, ?, ?, ?)`,
    [user.id, user.name, user.short_name, user.latitude, user.longitude]
  );

  const friends = await db.all<Friend[]>("SELECT * FROM friends");
  return NextResponse.json(friends);
}
