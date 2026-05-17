"use client";

import * as React from "react";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatDate, formatRupiah, formatRupiahShort, buildWaUrl } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { ChevronDown, ChevronUp, MessageCircle, Search } from "lucide-react";
import type { Lead, Installer } from "@/lib/types";

const STATUS_OPTIONS = [
  "Baru",
  "Dikirim ke Installer",
  "Dalam Proses",
  "Selesai",
  "Tidak Relevan",
];

function statusColor(s: string): string {
  switch (s) {
    case "Baru":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "Dikirim ke Installer":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Dalam Proses":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "Selesai":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Tidak Relevan":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function AdminLeadTable({ initialLeads }: { initialLeads: Lead[] }) {
  const { toast } = useToast();
  const [leads, setLeads] = React.useState<Lead[]>(initialLeads);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("Semua");
  const [kotaFilter, setKotaFilter] = React.useState("Semua");
  const [expanded, setExpanded] = React.useState<number | null>(null);

  const kotaOptions = React.useMemo(() => {
    const set = new Set(leads.map((l) => l.kota));
    return ["Semua", ...Array.from(set).sort()];
  }, [leads]);

  const filtered = React.useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== "Semua" && l.status !== statusFilter) return false;
      if (kotaFilter !== "Semua" && l.kota !== kotaFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !l.nama.toLowerCase().includes(q) &&
          !l.telepon.includes(q)
        )
          return false;
      }
      return true;
    });
  }, [leads, search, statusFilter, kotaFilter]);

  const stats = React.useMemo(() => {
    const baru = leads.filter((l) => l.status === "Baru").length;
    const dikirim = leads.filter((l) => l.status === "Dikirim ke Installer").length;
    const selesai = leads.filter((l) => l.status === "Selesai").length;
    const total = leads.length;
    const konversi = total > 0 ? Math.round((selesai / total) * 100) : 0;
    return { total, baru, dikirim, selesai, konversi };
  }, [leads]);

  const updateLead = async (
    id: number,
    payload: { status?: string; installerTarget?: string; catatan?: string }
  ) => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        toast(err.error || "Gagal update", "error");
        return;
      }
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...payload } : l))
      );
      toast("Lead diperbarui", "success");
    } catch {
      toast("Koneksi error", "error");
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatBox label="Total" value={stats.total} />
        <StatBox label="Baru" value={stats.baru} accent="amber" />
        <StatBox label="Dikirim" value={stats.dikirim} accent="blue" />
        <StatBox label="Selesai" value={stats.selesai} accent="emerald" />
        <StatBox label="Rate Konversi" value={`${stats.konversi}%`} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtext" />
          <Input
            placeholder="Cari nama atau nomor telepon"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:w-56"
        >
          <option value="Semua">Semua Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select
          value={kotaFilter}
          onChange={(e) => setKotaFilter(e.target.value)}
          className="sm:w-44"
        >
          {kotaOptions.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface text-subtext text-xs uppercase tracking-wide">
              <th className="px-3 py-3 text-left font-medium">ID</th>
              <th className="px-3 py-3 text-left font-medium">Nama</th>
              <th className="px-3 py-3 text-left font-medium">Telepon</th>
              <th className="px-3 py-3 text-left font-medium">Kota</th>
              <th className="px-3 py-3 text-left font-medium">Budget</th>
              <th className="px-3 py-3 text-left font-medium">Timeline</th>
              <th className="px-3 py-3 text-right font-medium">Tagihan</th>
              <th className="px-3 py-3 text-right font-medium">Hemat/bln</th>
              <th className="px-3 py-3 text-left font-medium">Status</th>
              <th className="px-3 py-3 text-left font-medium">Tanggal</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-10 text-center text-subtext">
                  Belum ada lead yang cocok dengan filter.
                </td>
              </tr>
            ) : null}
            {filtered.map((l) => (
              <React.Fragment key={l.id}>
                <tr className="hover:bg-surface/50">
                  <td className="px-3 py-3 text-subtext">#{l.id}</td>
                  <td className="px-3 py-3 font-medium text-ink">
                    {l.nama}
                    {l.teleponVerified ? (
                      <span
                        className="ml-2 inline-block w-2 h-2 rounded-full bg-accent-deep"
                        title="Telepon terverifikasi"
                      />
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    <a
                      href={buildWaUrl(l.telepon)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-accent-deep hover:underline"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      {l.telepon}
                    </a>
                  </td>
                  <td className="px-3 py-3">{l.kota}</td>
                  <td className="px-3 py-3">{l.budgetRange}</td>
                  <td className="px-3 py-3">{l.timeline}</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    {formatRupiahShort(l.tagihanListrik)}
                  </td>
                  <td className="px-3 py-3 text-right whitespace-nowrap text-accent-deep font-medium">
                    {formatRupiahShort(l.estimasiHemat)}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs border ${statusColor(l.status)}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-subtext text-xs whitespace-nowrap">
                    {formatDate(l.createdAt)}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      {expanded === l.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {expanded === l.id ? "Tutup" : "Kelola"}
                    </button>
                  </td>
                </tr>
                {expanded === l.id ? (
                  <tr className="bg-surface/40">
                    <td colSpan={11} className="px-4 py-4">
                      <div className="grid sm:grid-cols-3 gap-4 max-w-4xl">
                        <div>
                          <label
                            htmlFor={`lead-status-${l.id}`}
                            className="text-xs font-medium uppercase tracking-wide text-subtext mb-1.5 block"
                          >
                            Status
                          </label>
                          <Select
                            id={`lead-status-${l.id}`}
                            value={l.status}
                            onChange={(e) => updateLead(l.id, { status: e.target.value })}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <label
                            htmlFor={`lead-installer-${l.id}`}
                            className="text-xs font-medium uppercase tracking-wide text-subtext mb-1.5 block"
                          >
                            Installer Target
                          </label>
                          <Input
                            id={`lead-installer-${l.id}`}
                            defaultValue={l.installerTarget ?? ""}
                            placeholder="Nama installer"
                            onBlur={(e) => {
                              if (e.target.value !== (l.installerTarget ?? "")) {
                                updateLead(l.id, { installerTarget: e.target.value });
                              }
                            }}
                          />
                        </div>
                        <div>
                          <span className="text-xs font-medium uppercase tracking-wide text-subtext mb-1.5 block">
                            Detail Lead
                          </span>
                          <div className="text-xs text-subtext space-y-0.5">
                            <p>Sistem: <b>{l.sistemKwp} kWp</b></p>
                            <p>Tagihan: <b>{formatRupiah(l.tagihanListrik)}/bln</b></p>
                            <p>Hemat: <b className="text-accent-deep">{formatRupiah(l.estimasiHemat)}/bln</b></p>
                            {l.email ? <p>Email: {l.email}</p> : null}
                          </div>
                        </div>
                        <div className="sm:col-span-3">
                          <label
                            htmlFor={`lead-catatan-${l.id}`}
                            className="text-xs font-medium uppercase tracking-wide text-subtext mb-1.5 block"
                          >
                            Catatan
                          </label>
                          <Textarea
                            id={`lead-catatan-${l.id}`}
                            defaultValue={l.catatan ?? ""}
                            placeholder="Catatan tentang lead ini"
                            onBlur={(e) => {
                              if (e.target.value !== (l.catatan ?? "")) {
                                updateLead(l.id, { catatan: e.target.value });
                              }
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const INSTALLER_STATUS = ["Pending", "Aktif", "Tidak Aktif"];

export function AdminInstallerTable({ initialInstallers }: { initialInstallers: Installer[] }) {
  const { toast } = useToast();
  const [installers, setInstallers] = React.useState<Installer[]>(initialInstallers);

  const updateInstaller = async (id: number, payload: { status?: string }) => {
    try {
      const res = await fetch(`/api/admin/installer/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        toast(err.error || "Gagal update", "error");
        return;
      }
      setInstallers((prev) => prev.map((i) => (i.id === id ? { ...i, ...payload } : i)));
      toast("Installer diperbarui", "success");
    } catch {
      toast("Koneksi error", "error");
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface text-subtext text-xs uppercase tracking-wide">
            <th className="px-3 py-3 text-left font-medium">ID</th>
            <th className="px-3 py-3 text-left font-medium">Perusahaan</th>
            <th className="px-3 py-3 text-left font-medium">PIC</th>
            <th className="px-3 py-3 text-left font-medium">Telepon</th>
            <th className="px-3 py-3 text-left font-medium">Kota</th>
            <th className="px-3 py-3 text-left font-medium">Cakupan</th>
            <th className="px-3 py-3 text-left font-medium">Kapasitas</th>
            <th className="px-3 py-3 text-left font-medium">Status</th>
            <th className="px-3 py-3 text-left font-medium">Daftar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {installers.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-3 py-10 text-center text-subtext">
                Belum ada installer yang mendaftar.
              </td>
            </tr>
          ) : null}
          {installers.map((i) => (
            <tr key={i.id} className="hover:bg-surface/50">
              <td className="px-3 py-3 text-subtext">#{i.id}</td>
              <td className="px-3 py-3 font-medium text-ink">{i.namaPerusahaan}</td>
              <td className="px-3 py-3">{i.picNama}</td>
              <td className="px-3 py-3">
                <a
                  href={buildWaUrl(i.picTelepon)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-deep hover:underline"
                >
                  {i.picTelepon}
                </a>
              </td>
              <td className="px-3 py-3">{i.kota}</td>
              <td className="px-3 py-3 max-w-[200px] truncate" title={i.cakupanKota}>{i.cakupanKota}</td>
              <td className="px-3 py-3">{i.kapasitasBulan}</td>
              <td className="px-3 py-3">
                <Select
                  value={i.status}
                  onChange={(e) => updateInstaller(i.id, { status: e.target.value })}
                  className="h-11 text-sm"
                  aria-label={`Status installer ${i.namaPerusahaan}`}
                >
                  {INSTALLER_STATUS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </td>
              <td className="px-3 py-3 text-subtext text-xs whitespace-nowrap">
                {formatDate(i.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: "amber" | "blue" | "emerald";
}) {
  const valueClass =
    accent === "amber"
      ? "text-amber-700"
      : accent === "blue"
      ? "text-blue-700"
      : accent === "emerald"
      ? "text-emerald-700"
      : "text-ink";
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-subtext">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}
