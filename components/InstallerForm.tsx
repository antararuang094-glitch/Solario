"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { installerSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { KOTA_OPTIONS } from "@/lib/solar-calc";
import { useToast } from "@/components/ui/toast";
import { Check } from "lucide-react";

type FormData = z.infer<typeof installerSchema>;

export function InstallerForm() {
  const { toast } = useToast();
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(installerSchema),
    defaultValues: {
      namaPerusahaan: "",
      picNama: "",
      picTelepon: "",
      picEmail: "",
      kota: "Jakarta",
      provinsi: "DKI Jakarta",
      cakupanKota: "",
      kapasitasBulan: "1-5 proyek",
      catatan: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/installer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        toast(result.error || "Gagal mendaftar", "error");
        return;
      }
      setSuccess(true);
      reset();
      toast("Pendaftaran terkirim. Tim kami akan menghubungi Anda.", "success");
    } catch {
      toast("Koneksi error", "error");
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-[#16a34a]/30 bg-[#f0fdf4] p-8 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-[#16a34a] flex items-center justify-center mb-4">
          <Check className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-ink">Terima kasih, pendaftaran Anda terkirim!</h3>
        <p className="mt-2 text-sm text-subtext max-w-md mx-auto">
          Tim Solario akan meninjau data Anda dalam 1×24 jam dan menghubungi via WhatsApp untuk proses verifikasi.
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setSuccess(false)}
          className="mt-5"
        >
          Daftarkan installer lain
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="namaPerusahaan">Nama perusahaan</Label>
        <Input
          id="namaPerusahaan"
          placeholder="PT/CV Surya Energi"
          {...register("namaPerusahaan")}
          error={!!errors.namaPerusahaan}
        />
        <FieldError message={errors.namaPerusahaan?.message} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="picNama">Nama PIC</Label>
          <Input id="picNama" placeholder="Nama lengkap" {...register("picNama")} error={!!errors.picNama} />
          <FieldError message={errors.picNama?.message} />
        </div>
        <div>
          <Label htmlFor="picTelepon">No. WhatsApp PIC</Label>
          <Input
            id="picTelepon"
            type="tel"
            placeholder="08123456789"
            {...register("picTelepon")}
            error={!!errors.picTelepon}
          />
          <FieldError message={errors.picTelepon?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="picEmail">Email PIC (opsional)</Label>
        <Input
          id="picEmail"
          type="email"
          placeholder="pic@perusahaan.com"
          {...register("picEmail")}
          error={!!errors.picEmail}
        />
        <FieldError message={errors.picEmail?.message} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="kota-installer">Kota HQ</Label>
          <Select id="kota-installer" {...register("kota")} error={!!errors.kota}>
            {KOTA_OPTIONS.filter((k) => k !== "Kota lainnya").map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
            <option value="Kota lainnya">Kota lainnya</option>
          </Select>
          <FieldError message={errors.kota?.message} />
        </div>
        <div>
          <Label htmlFor="provinsi">Provinsi</Label>
          <Input
            id="provinsi"
            placeholder="contoh: Jawa Barat"
            {...register("provinsi")}
            error={!!errors.provinsi}
          />
          <FieldError message={errors.provinsi?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="cakupanKota">Kota-kota yang dapat dilayani</Label>
        <Input
          id="cakupanKota"
          placeholder="contoh: Jakarta, Bekasi, Tangerang, Depok"
          {...register("cakupanKota")}
          error={!!errors.cakupanKota}
        />
        <p className="text-xs text-subtext mt-1">Pisahkan dengan koma.</p>
        <FieldError message={errors.cakupanKota?.message} />
      </div>

      <div>
        <Label htmlFor="kapasitasBulan">Kapasitas proyek per bulan</Label>
        <Select
          id="kapasitasBulan"
          {...register("kapasitasBulan")}
          error={!!errors.kapasitasBulan}
        >
          <option value="1-5 proyek">1–5 proyek</option>
          <option value="5-10 proyek">5–10 proyek</option>
          <option value="> 10 proyek">&gt; 10 proyek</option>
        </Select>
        <FieldError message={errors.kapasitasBulan?.message} />
      </div>

      <div>
        <Label htmlFor="catatan">Pesan/informasi tambahan (opsional)</Label>
        <Textarea
          id="catatan"
          placeholder="Pengalaman, sertifikasi, area spesialisasi, dll."
          {...register("catatan")}
        />
      </div>

      <Button
        type="submit"
        size="lg"
        loading={isSubmitting}
        disabled={isSubmitting}
        className="w-full sm:w-auto"
      >
        {isSubmitting ? "Mengirim..." : "Daftar Sekarang — Gratis"}
      </Button>
      <p className="text-xs text-subtext leading-relaxed">
        Tim kami akan menghubungi dalam 1×24 jam untuk verifikasi. Tidak ada biaya pendaftaran.
      </p>
    </form>
  );
}
