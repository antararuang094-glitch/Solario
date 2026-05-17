import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { leadSchema, normalizeTelepon } from "@/lib/validations";
import { isPhoneVerified } from "@/lib/otp-store";
import { notifyAdminNewLead } from "@/lib/email";
import { CACHE_TAG as STATS_CACHE_TAG } from "@/lib/stats";

/**
 * Sanitize Zod issues for the client response — keep just `field` + `message`
 * so we don't leak internal validator names / paths.
 */
function flatIssues(
  issues: { path: (string | number)[]; message: string }[]
): { field: string; message: string }[] {
  return issues.map((i) => ({
    field: i.path.join(".") || "_root",
    message: i.message,
  }));
}

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
      {
        error: parsed.error.issues[0]?.message ?? "Validasi gagal",
        issues: flatIssues(parsed.error.issues),
      },
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

  let lead;
  try {
    // Create lead + invalidate the verified OTP atomically so a verified OTP
    // can never be replayed for a second lead, and a partial failure can
    // never leave the lead saved with an active OTP (or vice versa).
    lead = await prisma.$transaction(async (tx) => {
      const created = await tx.lead.create({
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
      await tx.oTPSession.updateMany({
        where: { telepon, verified: true },
        data: { verified: false },
      });
      return created;
    });
  } catch (err) {
    console.error("[POST /api/leads]", err);
    return NextResponse.json(
      { error: "Gagal menyimpan lead" },
      { status: 500 }
    );
  }

  // Bust stats cache so landing page reflects new lead count
  revalidateTag(STATS_CACHE_TAG);

  // Await the email send before returning. Slower (~500ms-2s extra) but
  // guarantees admin notification doesn't get dropped when Vercel kills the
  // function on response. Errors are caught & logged so SMTP issues never
  // surface to the form-submitter.
  try {
    await notifyAdminNewLead({
      nama: lead.nama,
      telepon: lead.telepon,
      kota: lead.kota,
      budgetRange: lead.budgetRange,
      tagihanListrik: lead.tagihanListrik,
      estimasiHemat: lead.estimasiHemat,
    });
  } catch (err) {
    console.error("[email/notifyAdminNewLead]", err);
  }

  return NextResponse.json({ success: true, id: lead.id });
}
