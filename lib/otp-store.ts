import { prisma } from "./prisma";

// ── Configuration ──
const TTL_SECONDS = 120; // OTP valid 2 menit
const MAX_ATTEMPTS = 3; // Max wrong attempts per OTP session
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 menit
const RATE_LIMIT_MAX_OTP = 3; // Max 3 OTP per nomor per 10 menit
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 detik antar request OTP

/**
 * Thrown by sendOtp when rate limit hit. Carries HTTP status + retry hint.
 */
export class OtpRateLimitError extends Error {
  public readonly retryAfterSeconds: number;
  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = "OtpRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function generateOtp(): string {
  // Use crypto for proper randomness (Web Crypto, Edge-safe)
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  // arr[0] / 2^32 ∈ [0, 1) → mapped to [100000, 999999]
  return Math.floor(100000 + (arr[0] / 4_294_967_296) * 900000).toString();
}

/**
 * Sends OTP. Enforces two rate limits via DB:
 *  1. Hard limit: max RATE_LIMIT_MAX_OTP (3) OTP per phone per 10 minutes
 *  2. Cooldown: minimum RESEND_COOLDOWN_MS (30s) between consecutive sends
 *
 * Throws OtpRateLimitError on violation — route handler returns 429.
 */
export async function sendOtp(telepon: string): Promise<{
  otp: string;
  expiresIn: number;
}> {
  const now = Date.now();

  // Rate limit 1: total OTP count in window
  const recentCount = await prisma.oTPSession.count({
    where: {
      telepon,
      createdAt: { gte: new Date(now - RATE_LIMIT_WINDOW_MS) },
    },
  });
  if (recentCount >= RATE_LIMIT_MAX_OTP) {
    throw new OtpRateLimitError(
      "Terlalu banyak permintaan OTP untuk nomor ini. Coba lagi dalam 10 menit.",
      Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
    );
  }

  // Rate limit 2: cooldown between sends
  const lastOtp = await prisma.oTPSession.findFirst({
    where: { telepon },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (lastOtp) {
    const elapsed = now - lastOtp.createdAt.getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      throw new OtpRateLimitError(
        `Tunggu ${wait} detik sebelum kirim ulang OTP.`,
        wait
      );
    }
  }

  // All clear — generate and persist
  const otp = generateOtp();
  const expiresAt = new Date(now + TTL_SECONDS * 1000);
  await prisma.oTPSession.create({
    data: { telepon, otp, expiresAt },
  });

  if (process.env.NODE_ENV !== "production") {
    console.log(`[OTP] Untuk ${telepon}: ${otp} (expire dalam ${TTL_SECONDS}s)`);
  }

  return { otp, expiresIn: TTL_SECONDS };
}

/**
 * Verifies OTP. Brute-force protection enforced via DB:
 *  - Tracks attempts via OTPSession.attempts field (persistent across
 *    Vercel function instances, unlike in-memory Map)
 *  - After MAX_ATTEMPTS (3) wrong tries, session is locked. User must
 *    request new OTP.
 */
export async function verifyOtp(
  telepon: string,
  otp: string
): Promise<{ verified: boolean; error?: string }> {
  const session = await prisma.oTPSession.findFirst({
    where: { telepon, verified: false },
    orderBy: { createdAt: "desc" },
  });

  if (!session) {
    return {
      verified: false,
      error: "OTP tidak ditemukan. Kirim ulang OTP.",
    };
  }

  if (session.expiresAt < new Date()) {
    return {
      verified: false,
      error: "OTP sudah kedaluwarsa. Kirim ulang OTP.",
    };
  }

  // Brute-force guard — already locked?
  if (session.attempts >= MAX_ATTEMPTS) {
    return {
      verified: false,
      error: "Terlalu banyak percobaan salah. Kirim ulang OTP baru.",
    };
  }

  // Wrong OTP — increment attempts atomically
  if (session.otp !== otp) {
    const updated = await prisma.oTPSession.update({
      where: { id: session.id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    });
    const remaining = MAX_ATTEMPTS - updated.attempts;
    if (remaining <= 0) {
      return {
        verified: false,
        error: "Terlalu banyak percobaan salah. Kirim ulang OTP baru.",
      };
    }
    return {
      verified: false,
      error: `OTP salah. Sisa ${remaining} percobaan.`,
    };
  }

  // Correct OTP — mark verified
  await prisma.oTPSession.update({
    where: { id: session.id },
    data: { verified: true },
  });
  return { verified: true };
}

/**
 * Returns true if phone has a verified OTP session within the last 15 minutes.
 * Used by /api/leads to enforce that submissions are tied to a verified phone.
 */
export async function isPhoneVerified(telepon: string): Promise<boolean> {
  const recent = await prisma.oTPSession.findFirst({
    where: {
      telepon,
      verified: true,
      createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return !!recent;
}

/**
 * Invalidates all verified OTP sessions for a phone. Call this AFTER
 * successful lead creation to prevent replay (same verified OTP being
 * used to submit multiple leads).
 */
export async function consumeVerifiedOtp(telepon: string): Promise<void> {
  await prisma.oTPSession.updateMany({
    where: { telepon, verified: true },
    data: { verified: false },
  });
}
