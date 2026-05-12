import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { installerSchema, normalizeTelepon } from "@/lib/validations";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = installerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validasi gagal", issues: parsed.error.issues },
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
    return NextResponse.json({ id: installer.id, success: true });
  } catch (err) {
    console.error("[POST /api/installer]", err);
    return NextResponse.json({ error: "Gagal menyimpan installer" }, { status: 500 });
  }
}
