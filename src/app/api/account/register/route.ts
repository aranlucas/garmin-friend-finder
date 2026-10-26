import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { reportServerError } from "@/lib/server-errors";
import { registerAccount } from "@/services/accounts";
import { z } from "zod";

const registrationSchema = z.object({
  code: z.string(),
  shortName: z.string(),
});

/** Validate registration JSON and translate the atomic account result to the HTTP contract. */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const registration = registrationSchema.safeParse(body);

    if (!registration.success) {
      return NextResponse.json({ error: "Invalid registration data" }, { status: 400 });
    }

    const { code, shortName } = registration.data;

    const db = await getDb();

    const user = await registerAccount(db, code, shortName);

    if (!user) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    reportServerError(
      "registration_failed",
      error instanceof Error ? error : new Error("Non-error value thrown"),
    );

    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }
}
