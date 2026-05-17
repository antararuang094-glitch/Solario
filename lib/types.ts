/**
 * Shared serialized types for admin surfaces.
 *
 * These mirror the Prisma models but with `Date` fields serialized to
 * `string` (because they're shipped to the browser via server props /
 * JSON responses). Kept in one place so the dashboard server page,
 * dashboard client component, and the AdminLeadTable component all
 * speak the same shape.
 */

export interface Lead {
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

export interface Installer {
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
