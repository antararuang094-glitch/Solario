import { prisma } from "./prisma";

const MAX_ATTEMPTS = 3;
const TTL_SECONDS = 120;

const recentAttempts = new Map<string, { count: number; until: number }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtp(telepon: string): Promise<{
  otp: string;
  expiresIn: number;
}> {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000);

  await prisma.oTPSession.create({
    data: { telepon, otp, expiresAt },
  });

  if (process.env.NODE_ENV !== "production") {
    console.log(`[OTP] Untuk ${telepon}: ${otp} (expire dalam ${TTL_SECONDS}s)`);
  }

  return { otp, expiresIn: TTL_SECONDS };
}

export async function verifyOtp(
  telepon: string,
  otp: string
): Promise<{ verified: boolean; error?: string }> {
  const block = recentAttempts.get(telepon);
  if (block && block.until > Date.now()) {
    const remaining = Math.ceil((block.until - Date.now()) / 1000);
    return { verified: false, error: `Terlalu banyak percobaan. Coba lagi dalam ${remaining}s.` };
  }

  const session = await prisma.oTPSession.findFirst({
    where: { telepon, verified: false },
    orderBy: { createdAt: "desc" },
  });

  if (!session) {
    return { verified: false, error: "OTP tidak ditemukan. Kirim ulang OTP." };
  }

  if (session.expiresAt < new Date()) {
    return { verified: false, error: "OTP sudah kedaluwarsa. Kirim ulang." };
  }

  if (session.otp !== otp) {
    await prisma.oTPSession.update({
      where: { id: session.id },
      data: { attempts: { increment: 1 } },
    });

    const prev = recentAttempts.get(telepon) ?? { count: 0, until: 0 };
    prev.count += 1;
    if (prev.count >= MAX_ATTEMPTS) {
      prev.until = Date.now() + 5 * 60 * 1000;
      recentAttempts.set(telepon, prev);
      return {
        verified: false,
        error: "Terlalu banyak percobaan. Diblokir selama 5 menit.",
      };
    }
    recentAttempts.set(telepon, prev);
    return { verified: false, error: "OTP salah" };
  }

  await prisma.oTPSession.update({
    where: { id: session.id },
    data: { verified: true },
  });
  recentAttempts.delete(telepon);
  return { verified: true };
}

export async function isPhoneVerified(telepon: string): Promise<boolean> {
  const recent = await prisma.oTPSession.findFirst({
    where: {
      telepon,
      verified: true,
      createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
  });
  return !!recent;
}
