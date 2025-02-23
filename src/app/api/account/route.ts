import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function GET(request: NextRequest) {
  // get user id from NEXT query params
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("id");

  // Check if user exists
  const user = await db.get("SELECT id, short_name FROM users WHERE id = ?", [
    userId,
  ]);

  if (user?.short_name) {
    return NextResponse.json({}, { status: 200 });
  }

  return new Response(null, {
    status: 204,
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const userId = formData.get("id");
  // Check if user exists
  const user = await db.get("SELECT id FROM users WHERE id = ?", [userId]);

  if (user) {
    return NextResponse.json({}, { status: 200 });
  }

  // Generate and store new code
  const code = generateCode();
  await db.run("INSERT INTO verification_codes (code, user_id) VALUES (?, ?)", [
    code,
    userId,
  ]);

  return NextResponse.json({ code }, { status: 201 });
}
