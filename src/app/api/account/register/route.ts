import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { reportServerError } from "@/lib/server-errors";
import { z } from "zod";

const registrationSchema = z.object({
  code: z.string(),
  shortName: z.string(),
});

interface VerificationCodeRow {
  user_id: string;
}

interface RegisteredUser {
  id: string;
  short_name: string;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const registration = registrationSchema.safeParse(body);

    if (!registration.success) {
      return NextResponse.json({ error: "Invalid registration data" }, { status: 400 });
    }

    const { code, shortName } = registration.data;

    const db = await getDb();

    await db.run("BEGIN TRANSACTION");

    try {
      // First verify the code exists and get the associated user_id
      const verificationResult = await db.get<VerificationCodeRow>(
        "SELECT user_id FROM verification_codes WHERE code = ?",
        [code],
      );

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
    reportServerError(
      "registration_failed",
      error instanceof Error ? error : new Error("Non-error value thrown"),
    );

    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }
}
