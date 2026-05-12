import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateLeadSchema } from "@/lib/validations";
import { isAdminSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await isAdminSession();
  if (!session.valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validasi gagal" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (data.status !== undefined) updateData.status = data.status;
  if (data.installerTarget !== undefined)
    updateData.installerTarget = data.installerTarget || null;
  if (data.catatan !== undefined) updateData.catatan = data.catatan || null;

  try {
    const updated = await prisma.lead.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, lead: updated });
  } catch (err) {
    console.error("[PATCH /api/leads/:id]", err);
    return NextResponse.json({ error: "Gagal update" }, { status: 500 });
  }
}
