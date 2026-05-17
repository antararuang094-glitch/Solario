import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/auth";

const querySchema = z.object({
  status: z.enum(["Pending", "Aktif", "Tidak Aktif"]).optional(),
});

export async function GET(req: NextRequest) {
  const session = await isAdminSession();
  if (!session.valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Parameter tidak valid" },
      { status: 400 }
    );
  }

  const where: Record<string, string> = {};
  if (parsed.data.status) where.status = parsed.data.status;

  try {
    const installers = await prisma.installer.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ installers });
  } catch (err) {
    console.error("[GET /api/admin/installer]", err);
    return NextResponse.json(
      { error: "Gagal memuat data installer" },
      { status: 500 }
    );
  }
}
