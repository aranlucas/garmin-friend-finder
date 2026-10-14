import { NextResponse } from "next/server";
import { calculateBearing, calculateDistance } from "@/lib/geo";
import { reportServerError } from "@/lib/server-errors";
import { getAllFriends, getFriendsWithLocations, updateFriendLocation } from "@/services/friends";
import { z } from "zod";

const coordinateSchema = z.string().trim().min(1).transform(Number).pipe(z.number());

const locationSchema = z.object({
  id: z.string().min(1),
  lat: coordinateSchema.pipe(z.number().min(-90).max(90)),
  lon: coordinateSchema.pipe(z.number().min(-180).max(180)),
});

export async function GET() {
  try {
    const friends = await getAllFriends();

    return NextResponse.json(friends);
  } catch (error) {
    reportServerError(
      "friends_failed",
      error instanceof Error ? error : new Error("Non-error value thrown"),
    );

    return NextResponse.json({ error: "database error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);

  const location = locationSchema.safeParse({
    id: formData?.get("id"),
    lat: formData?.get("lat"),
    lon: formData?.get("lon"),
  });

  if (!location.success) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const { id, lat, lon } = location.data;

  try {
    await updateFriendLocation(id, lat, lon);

    const friends = await getFriendsWithLocations();
    const otherFriends = friends.filter((friend) => friend.id !== id);
    const currentLocation = { latitude: lat, longitude: lon };

    const friendsWithBearing = otherFriends.map((friend) => ({
      ...friend,
      bearing: calculateBearing(
        currentLocation.latitude,
        currentLocation.longitude,
        friend.latitude,
        friend.longitude,
      ),
      distance: calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        friend.latitude,
        friend.longitude,
      ),
    }));

    return NextResponse.json(friendsWithBearing);
  } catch (error) {
    reportServerError(
      "friends_failed",
      error instanceof Error ? error : new Error("Non-error value thrown"),
    );

    return NextResponse.json({ error: "database error" }, { status: 500 });
  }
}
