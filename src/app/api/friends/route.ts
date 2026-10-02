import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAllFriends, LocationSharingError, shareMyLocation } from "@/services/friends";

function errorResponse(error: unknown) {
  if (error instanceof LocationSharingError) {
    const status = {
      unauthorized: 401,
      invalid_coordinates: 400,
      user_not_found: 404,
    }[error.code];
    return NextResponse.json({ error: error.code }, { status });
  }
  console.error("Location sharing error:", error);
  return NextResponse.json({ error: "server error" }, { status: 500 });
}

export async function GET() {
  try {
    const session = await auth();
    const friends = await getAllFriends(session?.user);
    return NextResponse.json(friends, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }
    if (formData.getAll("lat").length !== 1 || formData.getAll("lon").length !== 1) {
      return NextResponse.json({ error: "invalid_coordinates" }, { status: 400 });
    }

    // The legacy id field is deliberately ignored; only the session owns a location.
    const friends = await shareMyLocation(session.user, {
      latitude: formData.get("lat"),
      longitude: formData.get("lon"),
    });
    return NextResponse.json(friends, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
