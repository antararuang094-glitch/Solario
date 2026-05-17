import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/auth";

const querySchema = z.object({
  status: z
    .enum([
      "Baru",
      "Dikirim ke Installer",
      "Dalam Proses",
      "Selesai",
      "Tidak Relevan",
    ])
    .optional(),
  kota: z.string().min(1).max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(req: NextRequest) {
  const session = await isAdminSession();
  if (!session.valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    kota: searchParams.get("kota") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Parameter tidak valid" },
      { status: 400 }
    );
  }
  const { status, kota, page, limit } = parsed.data;

  const where: Record<string, string> = {};
  if (status) where.status = status;
  if (kota) where.kota = kota;

  try {
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);
    return NextResponse.json({ leads, total, page, limit });
  } catch (err) {
    console.error("[GET /api/admin/leads]", err);
    return NextResponse.json(
      { error: "Gagal memuat data leads" },
      { status: 500 }
    );
  }
}
