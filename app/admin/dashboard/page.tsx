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

  const [leads, installers] = await Promise.all([
    prisma.lead.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.installer.findMany({ orderBy: { createdAt: "desc" } }),
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
