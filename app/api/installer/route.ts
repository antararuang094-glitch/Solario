import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { installerSchema, normalizeTelepon } from "@/lib/validations";
import { check as rateLimitCheck, getClientIp } from "@/lib/rate-limit";

// 3 installer submissions per IP per hour. This is a public POST so we
// need *some* defense against spam; legitimate signups are rare per IP.
const INSTALLER_MAX = 3;
const INSTALLER_WINDOW_MS = 60 * 60 * 1000;

function flatIssues(
  issues: { path: (string | number)[]; message: string }[]
): { field: string; message: string }[] {
  return issues.map((i) => ({
    field: i.path.join(".") || "_root",
    message: i.message,
  }));
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimitCheck(`installer:${ip}`, INSTALLER_MAX, INSTALLER_WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak pendaftaran dari koneksi ini. Coba lagi nanti." },
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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = installerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Validasi gagal",
        issues: flatIssues(parsed.error.issues),
      },
      { status: 400 }
    );
  }

  const data = parsed.data;
  try {
    const installer = await prisma.installer.create({
      data: {
        namaPerusahaan: data.namaPerusahaan.trim(),
        picNama: data.picNama.trim(),
        picTelepon: normalizeTelepon(data.picTelepon),
        picEmail: data.picEmail && data.picEmail.length > 0 ? data.picEmail : null,
        kota: data.kota,
        provinsi: data.provinsi.trim(),
        cakupanKota: data.cakupanKota.trim(),
        kapasitasBulan: data.kapasitasBulan,
        catatan: data.catatan && data.catatan.length > 0 ? data.catatan : null,
      },
    });
    return NextResponse.json({ success: true, id: installer.id });
  } catch (err) {
    console.error("[POST /api/installer]", err);
    return NextResponse.json(
      { error: "Gagal menyimpan installer" },
      { status: 500 }
    );
  }
}
