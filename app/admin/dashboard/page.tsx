import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/auth";
import { AdminDashboardClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await isAdminSession();
  if (!session.valid) {
    redirect("/admin");
  }

  // Cap initial SSR payload at the 200 most recent of each entity.
  // The admin UI fetches more via /api/admin/* with proper pagination,
  // but the first page should never balloon when the tables grow.
  const [leads, installers] = await Promise.all([
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.installer.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
  ]);

  const serializableLeads = leads.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }));
  const serializableInstallers = installers.map((i) => ({
    ...i,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }));

  return (
    <AdminDashboardClient
      leads={serializableLeads}
      installers={serializableInstallers}
      username={session.username ?? "admin"}
    />
  );
}
