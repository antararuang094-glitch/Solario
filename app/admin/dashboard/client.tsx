"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminLeadTable, AdminInstallerTable } from "@/components/AdminLeadTable";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { Lead, Installer } from "@/lib/types";

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
  const { toast } = useToast();
  const [tab, setTab] = React.useState<"leads" | "installer">("leads");
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (!res.ok) {
        toast("Gagal logout. Coba lagi.", "error");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      toast("Koneksi error saat logout", "error");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <img
              src="/solario-icon.png"
              alt=""
              aria-hidden="true"
              className="w-9 h-9 object-contain -ml-1"
            />
            <span className="font-semibold text-ink">
              Solario<span className="text-accent-deep">.id</span>
            </span>
            <span className="ml-2 text-xs text-subtext border-l border-border pl-2">Admin</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-subtext hidden sm:inline">Halo, <b className="text-ink">{username}</b></span>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleLogout}
              loading={loggingOut}
            >
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

        <div className="border-b border-border mb-6">
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
          ? "border-accent-deep text-primary"
          : "border-transparent text-subtext hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}
