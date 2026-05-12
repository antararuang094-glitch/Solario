import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await isAdminSession();
  if (!session.valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;

  const where: Record<string, string> = {};
  if (status) where.status = status;

  const installers = await prisma.installer.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ installers });
}
