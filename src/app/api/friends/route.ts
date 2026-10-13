import { NextResponse } from "next/server";
import { calculateBearing, calculateDistance } from "@/lib/geo";
import { getAllFriends, getFriendsWithLocations, updateFriendLocation } from "@/services/friends";

export async function GET() {
  try {
    const friends = await getAllFriends();

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

  if (
    typeof lat !== "string" ||
    !lat ||
    typeof lon !== "string" ||
    !lon ||
    typeof id !== "string" ||
    !id
  ) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  try {
    await updateFriendLocation(id, Number(lat), Number(lon));

    const friends = await getFriendsWithLocations();
    const otherFriends = friends.filter((friend) => friend.id !== id);
    const currentLocation = { latitude: Number(lat), longitude: Number(lon) };

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
    console.error("Database error:", error);

    return NextResponse.json({ error: "database error" }, { status: 500 });
  }
}
