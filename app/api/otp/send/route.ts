import { NextRequest, NextResponse } from "next/server";
import { otpSendSchema, normalizeTelepon } from "@/lib/validations";
import { sendOtp, OtpRateLimitError } from "@/lib/otp-store";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = otpSendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validasi gagal" },
      { status: 400 }
    );
  }

  const telepon = normalizeTelepon(parsed.data.telepon);
  try {
    const { otp, expiresIn } = await sendOtp(telepon);
    return NextResponse.json({
      success: true,
      expiresIn,
      ...(process.env.NODE_ENV !== "production" ? { devOtp: otp } : {}),
    });
  } catch (err) {
    // Rate limit → 429 with Retry-After header
    if (err instanceof OtpRateLimitError) {
      return NextResponse.json(
        { error: err.message },
        {
          status: 429,
          headers: { "Retry-After": String(err.retryAfterSeconds) },
        }
      );
    }
    console.error("[POST /api/otp/send]", err);
    return NextResponse.json({ error: "Gagal kirim OTP" }, { status: 500 });
  }
}
