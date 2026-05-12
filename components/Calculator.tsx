"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  GOLONGAN_OPTIONS,
  KOTA_OPTIONS,
  hitungSolar,
  buatProyeksi25Tahun,
  type KalkulatorOutput,
} from "@/lib/solar-calc";
import { kalkulatorSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatRupiah, formatRupiahShort, parseRupiahInput } from "@/lib/utils";
import { LeadForm } from "@/components/LeadForm";
import {
  ArrowRight,
  Building2,
  Home,
  Leaf,
  Lock,
  Sun,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from "recharts";

type FormData = {
  tagihanBulanan: number;
  kota: string;
  golonganListrik: string;
  tipeProperti?: "Rumah Tinggal" | "Ruko/Toko" | "Kantor/Gudang";
};

const TIPE_PROPERTI = [
  { value: "Rumah Tinggal", icon: Home },
  { value: "Ruko/Toko", icon: Building2 },
  { value: "Kantor/Gudang", icon: Warehouse },
] as const;

export function Calculator() {
  const [tagihanDisplay, setTagihanDisplay] = React.useState("");
  const [hasil, setHasil] = React.useState<KalkulatorOutput | null>(null);
  const [inputState, setInputState] = React.useState<FormData | null>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const leadFormRef = React.useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(kalkulatorSchema),
    defaultValues: {
      tagihanBulanan: 0,
      kota: "Jakarta",
      golonganListrik: "R1-1300",
      tipeProperti: "Rumah Tinggal",
    },
  });

  const tipePropertiWatch = watch("tipeProperti");

  const onSubmit = (data: FormData) => {
    const out = hitungSolar({
      tagihanBulanan: data.tagihanBulanan,
      kota: data.kota,
      golonganListrik: data.golonganListrik,
    });
    setHasil(out);
    setInputState(data);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleTagihanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseRupiahInput(e.target.value);
    setTagihanDisplay(num > 0 ? num.toLocaleString("id-ID") : "");
    setValue("tagihanBulanan", num, { shouldValidate: true });
  };

  const scrollToLead = () => {
    leadFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-10">
      {/* ── Form Card ── */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm p-6 sm:p-8 space-y-6"
      >
        <div>
          <Label htmlFor="tagihanBulanan">Tagihan listrik rata-rata per bulan</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-subtext text-[15px] font-medium">
              Rp
            </span>
            <Input
              id="tagihanBulanan"
              inputMode="numeric"
              placeholder="3.000.000"
              value={tagihanDisplay}
              onChange={handleTagihanChange}
              className="pl-11 h-12 text-base"
              error={!!errors.tagihanBulanan}
            />
          </div>
          <p className="mt-1.5 text-xs text-subtext">
            Lihat di tagihan PLN bulan lalu — angka totalnya saja
          </p>
          <FieldError message={errors.tagihanBulanan?.message} />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <Label htmlFor="kota">Kota</Label>
            <Select id="kota" {...register("kota")} error={!!errors.kota} className="h-12">
              {KOTA_OPTIONS.map((k) => (
                <option key={k} value={k === "Kota lainnya" ? "default" : k}>
                  {k}
                </option>
              ))}
            </Select>
            <FieldError message={errors.kota?.message} />
          </div>

          <div>
            <Label htmlFor="golonganListrik">Golongan listrik PLN</Label>
            <Select
              id="golonganListrik"
              {...register("golonganListrik")}
              error={!!errors.golonganListrik}
              className="h-12"
            >
              {GOLONGAN_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </Select>
            <FieldError message={errors.golonganListrik?.message} />
          </div>
        </div>

        <div>
          <Label>Tipe properti</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {TIPE_PROPERTI.map((t) => {
              const Icon = t.icon;
              const isActive = tipePropertiWatch === t.value;
              return (
                <label
                  key={t.value}
                  className={
                    "flex items-center gap-2.5 h-12 px-4 rounded-xl border cursor-pointer text-sm font-medium transition-colors " +
                    (isActive
                      ? "bg-[#f0fdf4] border-[#16a34a] text-[#0a3d2e]"
                      : "border-[#e5e7eb] text-ink hover:bg-surface")
                  }
                >
                  <input
                    type="radio"
                    value={t.value}
                    {...register("tipeProperti")}
                    className="sr-only"
                  />
                  <Icon className={"w-4 h-4 " + (isActive ? "text-[#16a34a]" : "text-subtext")} />
                  <span>{t.value}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-[#e5e7eb]/60">
          <p className="inline-flex items-center gap-1.5 text-xs text-subtext">
            <Lock className="w-3.5 h-3.5" />
            Data tidak dijual, tidak ada email spam.
          </p>
          <Button
            type="submit"
            size="lg"
            loading={isSubmitting}
            className="bg-[#0a3d2e] hover:bg-[#07291f] h-12 px-7 text-[15px]"
          >
            Hitung Sekarang
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* ── Results ── */}
      {hasil && inputState ? (
        <div ref={resultsRef} className="space-y-6 scroll-mt-20">
          {/* HUGE dark green hero result card */}
          <div className="relative overflow-hidden rounded-2xl bg-[#0a3d2e] text-white p-7 sm:p-10 shadow-[0_30px_80px_-32px_rgba(10,61,46,0.45)]">
            <div
              className="absolute top-0 right-0 w-[420px] h-[420px] -translate-y-1/4 translate-x-1/4 rounded-full opacity-60 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(34,197,94,0.25) 0%, rgba(34,197,94,0) 60%)",
              }}
            />
            <div className="relative">
              <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200/80">
                <Sun className="w-3.5 h-3.5" />
                Hasil untuk {inputState.kota === "default" ? "Kota Anda" : inputState.kota}
                <span className="text-white/30">·</span>
                {inputState.golonganListrik}
                <span className="text-white/30">·</span>
                {inputState.tipeProperti}
              </div>
              <p className="mt-5 text-base text-white/70 font-medium">
                Kamu bisa hemat tagihan listrik
              </p>
              <h2 className="mt-1 text-5xl sm:text-7xl lg:text-[88px] font-bold tracking-[-0.03em] text-white leading-none">
                {formatRupiah(hasil.hematPerBulan)}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-white/65">
                setiap bulan
                <span className="mx-2 text-white/30">·</span>
                {formatRupiahShort(hasil.hematPerTahun).replace("Rp ", "Rp ")} per tahun
              </p>
            </div>

            <div className="relative mt-9 pt-7 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-white/10">
              <ResultStat label="Balik Modal" value={`${hasil.paybackPeriodTahun}`} suffix="tahun" />
              <ResultStat label="Sistem yang Cocok" value={`${hasil.sistemKwpRekomendasi}`} suffix="kWp" />
              <ResultStat
                label="Biaya Instalasi"
                value={formatRupiahShort((hasil.biayaInstalasiMin + hasil.biayaInstalasiMax) / 2)}
                hint={`(${formatRupiahShort(hasil.biayaInstalasiMin)} – ${formatRupiahShort(hasil.biayaInstalasiMax)})`}
              />
            </div>
          </div>

          {/* Side-by-side: Projection chart + Detail breakdown */}
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 sm:p-7 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-ink">Proyeksi 25 tahun</h3>
                  <p className="mt-1 text-xs text-subtext">
                    Garis hijau = total hemat kumulatif · garis abu = biaya instalasi
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold whitespace-nowrap">
                  <TrendingUp className="w-3 h-3" />
                  BEP {hasil.paybackPeriodTahun} tahun
                </span>
              </div>
              <div className="mt-4 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={buatProyeksi25Tahun(
                      hasil.hematPerTahun,
                      (hasil.biayaInstalasiMin + hasil.biayaInstalasiMax) / 2
                    )}
                    margin={{ top: 16, right: 12, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="tahun"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => (v === 0 ? "0" : `${v}${v === 25 ? " thn" : ""}`)}
                    />
                    <YAxis hide />
                    <ChartTooltip
                      formatter={(value: number) => formatRupiah(value)}
                      labelFormatter={(t) => `Tahun ke-${t}`}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <ReferenceLine
                      x={hasil.paybackPeriodTahun}
                      stroke="#d97706"
                      strokeDasharray="4 4"
                      strokeOpacity={0.6}
                      label={{
                        value: `BEP · ${hasil.paybackPeriodTahun} thn`,
                        fill: "#d97706",
                        fontSize: 10,
                        fontWeight: 600,
                        position: "top",
                      }}
                    />
                    <ReferenceLine
                      y={(hasil.biayaInstalasiMin + hasil.biayaInstalasiMax) / 2}
                      stroke="#cbd5e1"
                      strokeDasharray="4 4"
                      label={{
                        value: "Biaya instalasi",
                        fill: "#94a3b8",
                        fontSize: 10,
                        position: "insideTopRight",
                      }}
                    />
                    <ReferenceDot
                      x={hasil.paybackPeriodTahun}
                      y={(hasil.biayaInstalasiMin + hasil.biayaInstalasiMax) / 2}
                      r={5}
                      fill="#d97706"
                      stroke="#fff"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="kumulatifHemat"
                      stroke="#0a3d2e"
                      strokeWidth={2.5}
                      dot={false}
                      fill="url(#savingsGradient)"
                    />
                    <defs>
                      <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0a3d2e" stopOpacity={0.08} />
                        <stop offset="100%" stopColor="#0a3d2e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 sm:p-7 shadow-sm">
              <h3 className="text-lg font-bold text-ink">Detail perhitungan</h3>
              <dl className="mt-5 space-y-4">
                <DetailRow
                  label="Konsumsi listrik"
                  value={`${hasil.estimasiKwhPerBulan.toLocaleString("id-ID")} kWh/bulan`}
                />
                <DetailRow
                  label="Produksi panel"
                  value={`${hasil.produksiKwhPerBulan.toLocaleString("id-ID")} kWh/bulan`}
                />
                <DetailRow
                  label="Total hemat 25 thn"
                  value={formatRupiahShort(hasil.penghematanTotal25Tahun)}
                  emphasis
                />
                <DetailRow
                  label={
                    <span className="inline-flex items-center gap-1.5">
                      <Leaf className="w-3.5 h-3.5 text-[#16a34a]" />
                      CO₂ dikurangi
                    </span>
                  }
                  value={`${hasil.co2DihemanKgPerTahun.toLocaleString("id-ID")} kg/tahun`}
                />
              </dl>
            </div>
          </div>

          {/* Lead CTA card */}
          <div className="rounded-2xl border border-[#e5e7eb] bg-surface/60 p-6 sm:p-7">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-ink">
                  Mau penawaran nyata dari installer di {inputState.kota === "default" ? "kotamu" : inputState.kota}?
                </h3>
                <p className="mt-1 text-sm text-subtext max-w-xl">
                  Kami sambungkan kamu ke installer terverifikasi di kotamu. Tidak ada biaya, tidak ada keharusan.
                </p>
              </div>
              <Button
                type="button"
                onClick={scrollToLead}
                className="bg-[#0a3d2e] hover:bg-[#07291f] h-11 px-6 shrink-0"
              >
                Hubungkan saya
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Lead form section */}
          <div
            ref={leadFormRef}
            className="rounded-2xl border border-[#16a34a]/25 bg-[#f0fdf4]/40 p-6 sm:p-8 scroll-mt-20"
          >
            <h3 className="text-xl font-bold text-ink">Form Pendaftaran</h3>
            <p className="mt-1 text-sm text-subtext mb-5">
              Isi data di bawah — kami verifikasi nomor WhatsApp lalu hubungkan kamu dengan installer terpercaya.
            </p>
            <LeadForm
              kota={inputState.kota === "default" ? "" : inputState.kota}
              tagihanListrik={inputState.tagihanBulanan}
              estimasiHemat={hasil.hematPerBulan}
              sistemKwp={hasil.sistemKwpRekomendasi}
            />
          </div>

          <p className="text-xs text-subtext text-center max-w-2xl mx-auto">
            <span className="font-medium">Disclaimer:</span> estimasi berdasarkan tarif PLN 2024, PSH rata-rata kota, dan performance ratio 80%. Hasil aktual bisa bervariasi ±10%.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ResultStat({
  label,
  value,
  suffix,
  hint,
}: {
  label: string;
  value: string;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div className="px-0 sm:px-6 first:pl-0 last:pr-0 py-4 sm:py-0 first:pt-0 last:pb-0">
      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200/70">
        {label}
      </p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight tabular-nums">
          {value}
        </span>
        {suffix ? (
          <span className="text-sm text-white/60 font-medium">{suffix}</span>
        ) : null}
      </div>
      {hint ? <p className="mt-1 text-xs text-white/50 tabular-nums">{hint}</p> : null}
    </div>
  );
}

function DetailRow({
  label,
  value,
  emphasis,
}: {
  label: React.ReactNode;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 pb-3 border-b border-dashed border-[#e5e7eb] last:border-0 last:pb-0">
      <dt className="text-sm text-subtext">{label}</dt>
      <dd
        className={
          "text-sm font-bold tabular-nums " +
          (emphasis ? "text-[#0a3d2e] text-base" : "text-ink")
        }
      >
        {value}
      </dd>
    </div>
  );
}
