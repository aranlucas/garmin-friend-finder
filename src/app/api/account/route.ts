import { z } from "zod";
import { getDb } from "@/lib/db";
import { reportServerError } from "@/lib/server-errors";
import { findAccount, issueVerificationCode } from "@/services/accounts";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const idSchema = z.string().refine((id) => id.trim().length > 0);

export async function GET(request: NextRequest) {
  const id = idSchema.safeParse(request.nextUrl.searchParams.get("id"));

  if (!id.success) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  try {
    const user = await findAccount(await getDb(), id.data);

    return user ? NextResponse.json({}, { status: 200 }) : new Response(null, { status: 204 });
  } catch (error) {
    return accountError(error instanceof Error ? error : new Error("Non-error value thrown"));
  }
}

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const id = idSchema.safeParse(formData?.get("id"));

  if (!id.success) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  try {
    const code = await issueVerificationCode(await getDb(), id.data);

    return code === undefined
      ? NextResponse.json({}, { status: 200 })
      : NextResponse.json({ code }, { status: 201 });
  } catch (error) {
    return accountError(error instanceof Error ? error : new Error("Non-error value thrown"));
  }
}

function accountError(error: Error) {
  reportServerError("account_failed", error);

  return NextResponse.json({ error: "database error" }, { status: 500 });
}
