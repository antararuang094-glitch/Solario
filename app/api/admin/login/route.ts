import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  adminLoginSchema,
} from "@/lib/validations";
import {
  checkCredentials,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validasi gagal" },
      { status: 400 }
    );
  }

  const { username, password } = parsed.data;
  if (!checkCredentials(username, password)) {
    return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
  }

  let token: string;
  try {
    token = await createSessionToken(username);
  } catch (err) {
    console.error("[POST /api/admin/login]", err);
    return NextResponse.json(
      { error: "Server tidak dikonfigurasi dengan benar. Hubungi admin." },
      { status: 500 }
    );
  }

  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return NextResponse.json({ success: true });
}
