import { z } from "zod";
import { getDb } from "@/lib/db";
import { findAccount, issueVerificationCode } from "@/services/accounts";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await findAccount(await getDb(), request.nextUrl.searchParams.get("id"));

  return user?.short_name
    ? NextResponse.json({}, { status: 200 })
    : new Response(null, { status: 204 });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = z.string().nullable().parse(formData.get("id"));
  const code = await issueVerificationCode(await getDb(), id);

  return code === undefined
    ? NextResponse.json({}, { status: 200 })
    : NextResponse.json({ code }, { status: 201 });
}
