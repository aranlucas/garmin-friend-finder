import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface VerificationCodeRow {
  user_id: string;
}

interface RegisteredUser {
  id: string;
  short_name: string;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || !("code" in body) || !("shortName" in body)) {
      return NextResponse.json({ error: "Invalid registration data" }, { status: 400 });
    }
    const { code, shortName } = body;
    if (typeof code !== "string" || typeof shortName !== "string") {
      return NextResponse.json({ error: "Invalid registration data" }, { status: 400 });
    }
    const db = await getDb();

    await db.run("BEGIN TRANSACTION");

    try {
      // First verify the code exists and get the associated user_id
      const verificationResult = await db.get<VerificationCodeRow>(
        "SELECT user_id FROM verification_codes WHERE code = ?",
        [code],
      );

      console.log("verificationResult", verificationResult);

      if (!verificationResult) {
        await db.run("ROLLBACK");

        return NextResponse.json({ error: "Invalid verification code" }, { status: 404 });
      }

      // Create a new user
      const updateResult = await db.run("INSERT INTO users (id, short_name) VALUES (?, ?)", [
        verificationResult.user_id,
        shortName,
      ]);

      if (updateResult.changes === 0) {
        await db.run("ROLLBACK");

        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Delete the used verification code
      await db.run("DELETE FROM verification_codes WHERE code = ?", [code]);

      await db.run("COMMIT");

      const user = await db.get<RegisteredUser>("SELECT id, short_name FROM users WHERE id = ?", [
        verificationResult.user_id,
      ]);

      return NextResponse.json(user);
    } catch (error) {
      await db.run("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }
}
