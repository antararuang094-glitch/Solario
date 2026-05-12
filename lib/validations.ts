import { z } from "zod";

const teleponRegex = /^(\+62|62|0)8[1-9][0-9]{6,11}$/;

export const kalkulatorSchema = z.object({
  tagihanBulanan: z
    .number({ invalid_type_error: "Tagihan harus berupa angka" })
    .int()
    .min(50_000, "Tagihan minimal Rp 50.000")
    .max(500_000_000, "Tagihan terlalu besar"),
  kota: z.string().min(2, "Pilih kota"),
  golonganListrik: z.string().min(2, "Pilih golongan listrik"),
  tipeProperti: z.enum(["Rumah Tinggal", "Ruko/Toko", "Kantor/Gudang"]).optional(),
});

export const leadSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter").max(80),
  telepon: z
    .string()
    .regex(teleponRegex, "Nomor WhatsApp tidak valid (contoh: 08123456789)"),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  kota: z.string().min(2),
  provinsi: z.string().optional(),
  budgetRange: z.enum([
    "< 15 juta",
    "15-30 juta",
    "30-50 juta",
    "> 50 juta",
  ]),
  timeline: z.enum([
    "< 1 bulan",
    "1-3 bulan",
    "3-6 bulan",
    "masih riset",
  ]),
  tagihanListrik: z.number().int().min(0),
  estimasiHemat: z.number().int().min(0),
  sistemKwp: z.number().min(0),
});

export const installerSchema = z.object({
  namaPerusahaan: z.string().min(2, "Nama perusahaan minimal 2 karakter"),
  picNama: z.string().min(2, "Nama PIC minimal 2 karakter"),
  picTelepon: z
    .string()
    .regex(teleponRegex, "Nomor WhatsApp tidak valid"),
  picEmail: z.string().email("Email tidak valid").optional().or(z.literal("")),
  kota: z.string().min(2, "Pilih kota HQ"),
  provinsi: z.string().min(2, "Isi provinsi"),
  cakupanKota: z.string().min(2, "Isi cakupan kota"),
  kapasitasBulan: z.enum(["1-5 proyek", "5-10 proyek", "> 10 proyek"]),
  catatan: z.string().max(1000).optional().or(z.literal("")),
});

export const otpSendSchema = z.object({
  telepon: z.string().regex(teleponRegex, "Nomor WhatsApp tidak valid"),
});

export const otpVerifySchema = z.object({
  telepon: z.string().regex(teleponRegex, "Nomor WhatsApp tidak valid"),
  otp: z.string().length(6, "OTP harus 6 digit").regex(/^\d{6}$/, "OTP hanya angka"),
});

export const adminLoginSchema = z.object({
  username: z.string().min(1, "Username wajib"),
  password: z.string().min(1, "Password wajib"),
});

export const updateLeadSchema = z.object({
  status: z
    .enum([
      "Baru",
      "Dikirim ke Installer",
      "Dalam Proses",
      "Selesai",
      "Tidak Relevan",
    ])
    .optional(),
  installerTarget: z.string().max(120).optional().or(z.literal("")),
  catatan: z.string().max(2000).optional().or(z.literal("")),
});

export const updateInstallerSchema = z.object({
  status: z.enum(["Pending", "Aktif", "Tidak Aktif"]).optional(),
  catatan: z.string().max(2000).optional().or(z.literal("")),
});

export type KalkulatorInput = z.infer<typeof kalkulatorSchema>;
export type LeadInput = z.infer<typeof leadSchema>;
export type InstallerInput = z.infer<typeof installerSchema>;

export function normalizeTelepon(t: string): string {
  let s = t.replace(/[^\d+]/g, "");
  if (s.startsWith("+62")) s = "0" + s.slice(3);
  else if (s.startsWith("62")) s = "0" + s.slice(2);
  return s;
}
