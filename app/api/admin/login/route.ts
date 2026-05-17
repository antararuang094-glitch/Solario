import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminLoginSchema } from "@/lib/validations";
import {
  checkCredentials,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth";
import { check as rateLimitCheck, getClientIp } from "@/lib/rate-limit";

// 5 failed-or-success login attempts per IP per 15 minutes
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/**
 * Constant-time-ish "delay regardless of outcome" so failed-login replies
 * don't reveal a fast path. ~250ms is enough to mask the credential check
 * cost differential without harming legitimate UX noticeably.
 */
async function consistentDelay(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 250));
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimitCheck(`login:${ip}`, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS);
  if (!limit.allowed) {
    await consistentDelay();
    return NextResponse.json(
      {
        error:
          "Terlalu banyak percobaan login. Coba lagi dalam beberapa menit.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    await consistentDelay();
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    await consistentDelay();
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validasi gagal" },
      { status: 400 }
    );
  }

  const { username, password } = parsed.data;
  if (!checkCredentials(username, password)) {
    await consistentDelay();
    return NextResponse.json(
      { error: "Username atau password salah" },
      { status: 401 }
    );
  }

  let token: string;
  try {
    token = await createSessionToken(username);
  } catch (err) {
    console.error("[POST /api/admin/login]", err);
    await consistentDelay();
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
