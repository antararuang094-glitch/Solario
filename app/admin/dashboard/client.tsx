"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminLeadTable, AdminInstallerTable } from "@/components/AdminLeadTable";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lead {
  id: number;
  nama: string;
  telepon: string;
  teleponVerified: boolean;
  email: string | null;
  kota: string;
  budgetRange: string;
  timeline: string;
  tagihanListrik: number;
  estimasiHemat: number;
  sistemKwp: number;
  status: string;
  installerTarget: string | null;
  catatan: string | null;
  createdAt: string;
}

interface Installer {
  id: number;
  namaPerusahaan: string;
  picNama: string;
  picTelepon: string;
  picEmail: string | null;
  kota: string;
  provinsi: string;
  cakupanKota: string;
  kapasitasBulan: string;
  status: string;
  catatan: string | null;
  createdAt: string;
}

export function AdminDashboardClient({
  leads,
  installers,
  username,
}: {
  leads: Lead[];
  installers: Installer[];
  username: string;
}) {
  const router = useRouter();
  const [tab, setTab] = React.useState<"leads" | "installer">("leads");

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-surface">
      <header className="border-b border-[#e5e7eb] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <img
              src="/solario-icon.png"
              alt=""
              aria-hidden="true"
              className="w-9 h-9 object-contain -ml-1"
            />
            <span className="font-semibold text-ink">
              Solario<span className="text-[#16a34a]">.id</span>
            </span>
            <span className="ml-2 text-xs text-subtext border-l border-[#e5e7eb] pl-2">Admin</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-subtext hidden sm:inline">Halo, <b className="text-ink">{username}</b></span>
            <Button size="sm" variant="secondary" onClick={handleLogout}>
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-ink">Dashboard</h1>
            <p className="mt-1 text-sm text-subtext">
              Kelola leads dan installer dari satu tempat.
            </p>
          </div>
        </div>

        <div className="border-b border-[#e5e7eb] mb-6">
          <div className="flex gap-1">
            <TabButton active={tab === "leads"} onClick={() => setTab("leads")}>
              Leads <span className="ml-1.5 text-xs text-subtext">({leads.length})</span>
            </TabButton>
            <TabButton active={tab === "installer"} onClick={() => setTab("installer")}>
              Installer <span className="ml-1.5 text-xs text-subtext">({installers.length})</span>
            </TabButton>
          </div>
        </div>

        {tab === "leads" ? (
          <AdminLeadTable initialLeads={leads} />
        ) : (
          <AdminInstallerTable initialInstallers={installers} />
        )}
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
        active
          ? "border-[#16a34a] text-[#0d3b2e]"
          : "border-transparent text-subtext hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}
