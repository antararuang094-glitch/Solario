import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leadSchema, normalizeTelepon } from "@/lib/validations";
import { isPhoneVerified, consumeVerifiedOtp } from "@/lib/otp-store";
import { notifyAdminNewLead } from "@/lib/email";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validasi gagal", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const telepon = normalizeTelepon(data.telepon);

  const verified = await isPhoneVerified(telepon);
  if (!verified) {
    return NextResponse.json(
      { error: "Nomor WhatsApp belum diverifikasi. Kirim & verifikasi OTP dulu." },
      { status: 400 }
    );
  }

  try {
    const lead = await prisma.lead.create({
      data: {
        nama: data.nama.trim(),
        telepon,
        teleponVerified: true,
        email: data.email && data.email.length > 0 ? data.email : null,
        kota: data.kota,
        provinsi: data.provinsi ?? null,
        budgetRange: data.budgetRange,
        timeline: data.timeline,
        tagihanListrik: data.tagihanListrik,
        estimasiHemat: data.estimasiHemat,
        sistemKwp: data.sistemKwp,
      },
    });

    // Invalidate the verified OTP so it can't be replayed for another lead
    await consumeVerifiedOtp(telepon);

    // Bust stats cache so landing page reflects new lead count
    revalidateTag("site-stats");

    notifyAdminNewLead({
      nama: lead.nama,
      telepon: lead.telepon,
      kota: lead.kota,
      budgetRange: lead.budgetRange,
      tagihanListrik: lead.tagihanListrik,
      estimasiHemat: lead.estimasiHemat,
    }).catch((err) => console.error("[email]", err));

    return NextResponse.json({ id: lead.id, success: true });
  } catch (err) {
    console.error("[POST /api/leads]", err);
    return NextResponse.json({ error: "Gagal menyimpan lead" }, { status: 500 });
  }
}
