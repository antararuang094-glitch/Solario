import { NextRequest, NextResponse } from "next/server";
import { otpVerifySchema, normalizeTelepon } from "@/lib/validations";
import { verifyOtp } from "@/lib/otp-store";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = otpVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validasi gagal" },
      { status: 400 }
    );
  }

  const telepon = normalizeTelepon(parsed.data.telepon);
  const result = await verifyOtp(telepon, parsed.data.otp);

  if (!result.verified) {
    return NextResponse.json(
      { verified: false, error: result.error ?? "OTP salah" },
      { status: 400 }
    );
  }

  return NextResponse.json({ verified: true });
}
