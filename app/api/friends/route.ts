import { NextResponse } from "next/server";
import type { Friend } from "@/types";
import db from "@/lib/db";
import { updateLocations, getFriends } from "@/lib/friend-utils";

export async function GET() {
  const locations = updateLocations();
  return NextResponse.json(locations);
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

  db.set(`friend:${id}`, user);

  const friendsDb = db.get<string[]>("friends") || [];

  if (!friendsDb.includes(id)) {
    db.set("friends", [...friendsDb, id]);
  }

  return NextResponse.json(getFriends(user));
}
