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
import { useToast } from "@/components/ui/toast";
import { useCountUp } from "@/lib/hooks/useCountUp";
import {
  ArrowRight,
  Building2,
  Calculator as CalculatorIcon,
  Calendar,
  CheckCircle2,
  Download,
  Home,
  Leaf,
  Lock,
  Sparkles,
  TrendingUp,
  Wallet,
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

const TENOR_OPTIONS = [12, 24, 36, 48, 60] as const;
type Tenor = (typeof TENOR_OPTIONS)[number];
const BUNGA_FLAT_PER_BULAN = 0.008; // 0.8% flat
// PLN tariff escalation and panel degradation now live in lib/solar-calc.ts
// as KENAIKAN_TARIF_PLN / DEGRADASI_PANEL so the hero card total
// (`penghematanTotal25Tahun`) and the chart projection share one formula.
const CALCULATING_DURATION_MS = 1500; // total loading state duration
const COUNTUP_DURATION_MS = 1300; // count-up animation duration

// useCountUp lives in lib/hooks/useCountUp.ts so both the calculator and
// the landing page can share the same easeOutCubic animation.

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
  const [calculating, setCalculating] = React.useState(false);
  const [paymentMode, setPaymentMode] = React.useState<"cash" | "cicil">("cash");
  const [dpPercent, setDpPercent] = React.useState(20);
  const [tenor, setTenor] = React.useState<Tenor>(24);
  const [pdfLoading, setPdfLoading] = React.useState(false);
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const leadFormRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Track in-flight submit timers so we can clear them on unmount and avoid
  // "Can't perform a state update on an unmounted component" warnings.
  const submitTimersRef = React.useRef<number[]>([]);
  React.useEffect(() => {
    return () => {
      submitTimersRef.current.forEach((id) => window.clearTimeout(id));
      submitTimersRef.current = [];
    };
  }, []);

  // ── Animated values for result hero card ──
  const hematAnimated = useCountUp(hasil?.hematPerBulan ?? 0);
  const hematTahunAnimated = useCountUp(hasil?.hematPerTahun ?? 0);
  const paybackAnimated = useCountUp(hasil?.paybackPeriodTahun ?? 0, COUNTUP_DURATION_MS, 1);
  const sistemAnimated = useCountUp(hasil?.sistemKwpRekomendasi ?? 0, COUNTUP_DURATION_MS, 1);
  const biayaMidAnimated = useCountUp(
    hasil ? Math.round((hasil.biayaInstalasiMin + hasil.biayaInstalasiMax) / 2) : 0
  );

  // ── Proyeksi 25 tahun (sourced from lib/solar-calc.ts to avoid drift with
  //    `hasil.penghematanTotal25Tahun`, which uses the same formula) ──
  const projeksi25 = React.useMemo(() => {
    if (!hasil) return [];
    const biayaInstalasi = Math.round(
      (hasil.biayaInstalasiMin + hasil.biayaInstalasiMax) / 2
    );
    return buatProyeksi25Tahun(hasil.hematPerTahun, biayaInstalasi);
  }, [hasil]);

  // ── BEP year (linear interpolation between data points) ──
  const bepYear = React.useMemo<number | null>(() => {
    if (projeksi25.length === 0) return null;
    for (let i = 1; i < projeksi25.length; i++) {
      const prev = projeksi25[i - 1];
      const curr = projeksi25[i];
      if (prev.hemat < curr.biaya && curr.hemat >= curr.biaya) {
        const t = (curr.biaya - prev.hemat) / (curr.hemat - prev.hemat);
        return Math.round((prev.tahun + t) * 10) / 10;
      }
    }
    return null;
  }, [projeksi25]);

  const finalProfit = React.useMemo(() => {
    if (projeksi25.length === 0) return 0;
    const last = projeksi25[projeksi25.length - 1];
    return last.hemat - last.biaya;
  }, [projeksi25]);

  // ── Financing calculations ──
  const financing = React.useMemo(() => {
    if (!hasil) return null;
    const biayaTotal = Math.round(
      (hasil.biayaInstalasiMin + hasil.biayaInstalasiMax) / 2
    );
    if (paymentMode === "cash") {
      return { mode: "cash" as const, biayaTotal };
    }
    const dp = Math.round((biayaTotal * dpPercent) / 100);
    const pokok = biayaTotal - dp;
    const bungaTotal = pokok * BUNGA_FLAT_PER_BULAN * tenor;
    const totalCicilan = pokok + bungaTotal;
    const cicilanPerBulan = Math.round(totalCicilan / tenor);
    const totalBayar = Math.round(dp + totalCicilan);
    const cashFlowMonthly = hasil.hematPerBulan - cicilanPerBulan;
    return {
      mode: "cicil" as const,
      biayaTotal,
      dp,
      pokok: Math.round(pokok),
      bungaTotal: Math.round(bungaTotal),
      cicilanPerBulan,
      totalBayar,
      cashFlowMonthly,
      tenor,
      dpPercent,
    };
  }, [hasil, paymentMode, dpPercent, tenor]);

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
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setInputState(data);

    const trackTimer = (id: number) => {
      submitTimersRef.current.push(id);
    };

    if (reduced) {
      setHasil(out);
      setCalculating(false);
      trackTimer(
        window.setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50)
      );
      return;
    }

    // Show calculating state, scroll into view, then reveal result after delay
    setHasil(null);
    setCalculating(true);
    trackTimer(
      window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80)
    );
    trackTimer(
      window.setTimeout(() => {
        setHasil(out);
        setCalculating(false);
      }, CALCULATING_DURATION_MS)
    );
  };

  const handleTagihanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseRupiahInput(e.target.value);
    setTagihanDisplay(num > 0 ? num.toLocaleString("id-ID") : "");
    setValue("tagihanBulanan", num, { shouldValidate: true });
  };

  const scrollToLead = () => {
    leadFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── Download PDF (jsPDF, client-side) ──
  const handleDownloadPDF = async () => {
    if (!hasil || !inputState) return;
    setPdfLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const M = 40;
      const PRIMARY: [number, number, number] = [10, 61, 46];
      const ACCENT: [number, number, number] = [22, 163, 74];
      const INK: [number, number, number] = [15, 23, 42];
      const MUTED: [number, number, number] = [100, 116, 139];
      const LINE: [number, number, number] = [226, 232, 240];
      const SOFT_BG: [number, number, number] = [240, 253, 244];

      const now = new Date();
      const dateStr = now.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      // ─ Helper: render section title ─
      const sectionTitle = (title: string, top: number) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...PRIMARY);
        doc.text(title, M, top + 9);
        return top + 18;
      };

      // ─ Helper: render zebra-striped key/value table ─
      const renderTable = (
        rows: Array<[string, string]>,
        top: number,
        rowH = 20
      ) => {
        doc.setFontSize(10);
        rows.forEach((row, i) => {
          const rowTop = top + i * rowH;
          doc.setFillColor(i % 2 === 0 ? 248 : 255, 250, 252);
          doc.rect(M, rowTop, W - 2 * M, rowH, "F");
          const textBaseline = rowTop + rowH * 0.66;
          doc.setTextColor(...MUTED);
          doc.setFont("helvetica", "normal");
          doc.text(row[0], M + 10, textBaseline);
          doc.setTextColor(...INK);
          doc.setFont("helvetica", "bold");
          doc.text(row[1], W - M - 10, textBaseline, { align: "right" });
        });
        return top + rows.length * rowH;
      };

      // ─ Header brand strip ─
      doc.setFillColor(...PRIMARY);
      doc.rect(0, 0, W, 76, "F");

      // Green dot
      doc.setFillColor(...ACCENT);
      doc.circle(M + 10, 32, 8, "F");

      // "Solario" + ".id" with accurate spacing using getTextWidth
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      const brandX = M + 26;
      const brandY = 37;
      doc.text("Solario", brandX, brandY);
      const solarioWidth = doc.getTextWidth("Solario");
      doc.setFontSize(13);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(187, 247, 208);
      doc.text(".id", brandX + solarioWidth + 1, brandY);

      // Subtitle
      doc.setFontSize(9);
      doc.setTextColor(220, 252, 231);
      doc.text("Kalkulator Solar #1 Indonesia", brandX, brandY + 14);

      // Date right-aligned
      doc.setFontSize(9);
      doc.setTextColor(220, 252, 231);
      doc.text(`Dibuat: ${dateStr}`, W - M, brandY, { align: "right" });

      // ─ Title ─
      let y = 110;
      doc.setTextColor(...INK);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Laporan Estimasi Solar Panel", M, y);
      y += 8;
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.5);
      doc.line(M, y + 6, W - M, y + 6);
      y += 26;

      // ─ Ringkasan Input ─
      y = sectionTitle("Ringkasan Input", y);
      y = renderTable(
        [
          ["Kota", inputState.kota === "default" ? "Lainnya" : inputState.kota],
          ["Golongan PLN", inputState.golonganListrik],
          ["Tipe Properti", inputState.tipeProperti ?? "-"],
          ["Tagihan Listrik", `${formatRupiah(inputState.tagihanBulanan)} / bulan`],
        ],
        y
      );
      y += 20;

      // ─ Hasil Kalkulasi (highlight card) ─
      doc.setFillColor(...PRIMARY);
      doc.roundedRect(M, y, W - 2 * M, 100, 10, 10, "F");
      doc.setTextColor(187, 247, 208);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("HEMAT TAGIHAN LISTRIK", M + 18, y + 22);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.text(formatRupiah(hasil.hematPerBulan), M + 18, y + 54);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(187, 247, 208);
      doc.text(
        `setiap bulan  |  ${formatRupiah(hasil.hematPerTahun)} per tahun`,
        M + 18,
        y + 74
      );
      doc.text(
        `BEP ${bepYear ?? "-"} tahun  |  Sistem ${hasil.sistemKwpRekomendasi} kWp`,
        M + 18,
        y + 88
      );
      y += 116;

      // ─ Detail Hasil ─
      y = sectionTitle("Detail Perhitungan", y);
      y = renderTable(
        [
          ["Konsumsi listrik", `${hasil.estimasiKwhPerBulan.toLocaleString("id-ID")} kWh/bulan`],
          ["Produksi panel", `${hasil.produksiKwhPerBulan.toLocaleString("id-ID")} kWh/bulan`],
          ["Ukuran sistem", `${hasil.sistemKwpRekomendasi} kWp`],
          ["Biaya instalasi", `${formatRupiah(hasil.biayaInstalasiMin)} - ${formatRupiah(hasil.biayaInstalasiMax)}`],
          ["Hemat 25 tahun (akumulasi)", formatRupiah(projeksi25[25]?.hemat ?? 0)],
          ["CO2 dikurangi", `${hasil.co2DihemanKgPerTahun.toLocaleString("id-ID")} kg/tahun`],
        ],
        y
      );
      y += 20;

      // ─ Proyeksi 25 tahun (table with column headers) ─
      y = sectionTitle("Proyeksi Hemat (tarif PLN +5% per tahun)", y);

      // Header row (taller, with explicit text positioning)
      const headerH = 22;
      doc.setFillColor(...SOFT_BG);
      doc.rect(M, y, W - 2 * M, headerH, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...PRIMARY);
      const headerBaseline = y + headerH * 0.65;
      doc.text("TAHUN", M + 10, headerBaseline);
      doc.text("AKUMULASI HEMAT", M + 110, headerBaseline);
      doc.text("STATUS", W - M - 10, headerBaseline, { align: "right" });
      y += headerH;

      // Data rows
      const milestoneYears = [1, 3, 5, 10, 25];
      const projRowH = 20;
      doc.setFontSize(10);
      milestoneYears.forEach((yr, i) => {
        const d = projeksi25.find((p) => p.tahun === yr);
        if (!d) return;
        const rowTop = y + i * projRowH;
        doc.setFillColor(i % 2 === 0 ? 255 : 248, 250, 252);
        doc.rect(M, rowTop, W - 2 * M, projRowH, "F");
        const baseline = rowTop + projRowH * 0.66;
        doc.setTextColor(...INK);
        doc.setFont("helvetica", "normal");
        doc.text(`Tahun ${yr}`, M + 10, baseline);
        doc.setFont("helvetica", "bold");
        doc.text(formatRupiah(d.hemat), M + 110, baseline);
        doc.setFont("helvetica", "normal");
        const bepReached = d.hemat >= d.biaya;
        doc.setTextColor(...(bepReached ? ACCENT : MUTED));
        doc.text(
          bepReached ? "Sudah balik modal" : "Belum balik modal",
          W - M - 10,
          baseline,
          { align: "right" }
        );
      });
      y += milestoneYears.length * projRowH + 20;

      // ─ Financing (if cicil) ─
      if (financing && financing.mode === "cicil") {
        if (y > 680) {
          doc.addPage();
          y = 60;
        }
        y = sectionTitle("Rincian Cicilan", y);
        y = renderTable(
          [
            [`Uang Muka (${financing.dpPercent}%)`, formatRupiah(financing.dp)],
            ["Pokok pinjaman", formatRupiah(financing.pokok)],
            ["Bunga (0,8% flat/bulan)", formatRupiah(financing.bungaTotal)],
            ["Tenor", `${financing.tenor} bulan`],
            ["Cicilan per bulan", formatRupiah(financing.cicilanPerBulan)],
            ["Total dibayar", formatRupiah(financing.totalBayar)],
            [
              "Cash flow per bulan",
              `${financing.cashFlowMonthly >= 0 ? "+" : ""}${formatRupiah(financing.cashFlowMonthly)}`,
            ],
          ],
          y
        );
        y += 20;
      }

      // ─ Footer ─
      const footerY = doc.internal.pageSize.getHeight() - 50;
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.5);
      doc.line(M, footerY - 12, W - M, footerY - 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(
        "Laporan ini dibuat oleh Solario.id — Platform Kalkulator Solar #1 Indonesia",
        W / 2,
        footerY,
        { align: "center" }
      );
      doc.text(
        "Estimasi berdasarkan tarif PLN 2024, PSH rata-rata kota, performance ratio 80%. Hasil aktual bisa bervariasi ±10%.",
        W / 2,
        footerY + 12,
        { align: "center" }
      );

      const kotaSlug = inputState.kota.toLowerCase().replace(/\s+/g, "-");
      const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      doc.save(`solario-laporan-${kotaSlug}-${ts}.pdf`);
    } catch (err) {
      console.error("[PDF generation]", err);
      toast("Gagal membuat PDF. Silakan coba lagi.", "error");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* ── Form Card ── */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl border border-border bg-white shadow-sm p-6 sm:p-8 space-y-6"
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
                      ? "bg-accent-soft border-accent-deep text-primary"
                      : "border-border text-ink hover:bg-surface")
                  }
                >
                  <input
                    type="radio"
                    value={t.value}
                    {...register("tipeProperti")}
                    className="sr-only"
                  />
                  <Icon className={"w-4 h-4 " + (isActive ? "text-accent-deep" : "text-subtext")} />
                  <span>{t.value}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-border/60">
          <p className="inline-flex items-center gap-1.5 text-xs text-subtext">
            <Lock className="w-3.5 h-3.5" />
            Data tidak dijual, tidak ada email spam.
          </p>
          <Button
            type="submit"
            size="lg"
            loading={isSubmitting}
            className="bg-primary hover:bg-primary-deep h-12 px-7 text-[15px]"
          >
            Hitung Sekarang
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* ── Calculating state (1.5s loading dengan messaging) ── */}
      {calculating && inputState ? (
        <div ref={resultsRef} className="scroll-mt-20">
          <CalculatingCard
            kota={inputState.kota === "default" ? "kotamu" : inputState.kota}
          />
        </div>
      ) : null}

      {/* ── Results ── */}
      {hasil && inputState && !calculating ? (
        <div ref={resultsRef} className="space-y-6 scroll-mt-20">
          {/* HUGE dark green hero result card */}
          <div className="relative overflow-hidden rounded-2xl bg-primary text-white p-7 sm:p-10 shadow-[0_30px_80px_-32px_rgba(10,61,46,0.45)]">
            <div
              className="absolute top-0 right-0 w-[420px] h-[420px] -translate-y-1/4 translate-x-1/4 rounded-full opacity-60 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(34,197,94,0.25) 0%, rgba(34,197,94,0) 60%)",
              }}
            />
            <div className="relative">
              <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200/80">
                <img
                  src="/solario-icon.png"
                  alt=""
                  aria-hidden="true"
                  className="w-5 h-5 object-contain brightness-0 invert opacity-90"
                />
                Hasil untuk {inputState.kota === "default" ? "Kota Anda" : inputState.kota}
                <span className="text-white/30">·</span>
                {inputState.golonganListrik}
                <span className="text-white/30">·</span>
                {inputState.tipeProperti}
              </div>
              <p className="mt-5 text-base text-white/70 font-medium">
                Kamu bisa hemat tagihan listrik
              </p>
              <h2 className="mt-1 text-5xl sm:text-7xl lg:text-[88px] font-bold tracking-[-0.03em] text-white leading-none tabular-nums">
                {formatRupiah(hematAnimated)}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-white/65">
                setiap bulan
                <span className="mx-2 text-white/30">·</span>
                {formatRupiahShort(hematTahunAnimated)} per tahun
              </p>
            </div>

            <div className="relative mt-9 pt-7 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-white/10">
              <ResultStat
                label="Balik Modal"
                value={paybackAnimated.toFixed(1).replace(".", ",")}
                suffix="tahun"
              />
              <ResultStat
                label="Sistem yang Cocok"
                value={sistemAnimated.toFixed(1).replace(".", ",")}
                suffix="kWp"
              />
              <ResultStat
                label="Biaya Instalasi"
                value={formatRupiahShort(biayaMidAnimated)}
                hint={`(${formatRupiahShort(hasil.biayaInstalasiMin)} – ${formatRupiahShort(hasil.biayaInstalasiMax)})`}
              />
            </div>
          </div>

          {/* ── FITUR 1: Financing Calculator (Cash / Cicil) ── */}
          {financing ? (
            <div className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-soft text-primary flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-ink">
                    Mau beli cash atau cicil?
                  </h3>
                  <p className="mt-1 text-sm text-subtext">
                    Pilih skenario pembayaran — kami hitung cash flow bulanan untukmu.
                  </p>
                </div>
              </div>

              {/* Toggle */}
              <div className="mt-6 grid grid-cols-2 gap-2 p-1 bg-surface rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaymentMode("cash")}
                  className={
                    "py-3 px-4 rounded-lg font-semibold text-sm transition-all inline-flex items-center justify-center gap-2 " +
                    (paymentMode === "cash"
                      ? "bg-white text-primary shadow-sm"
                      : "text-subtext hover:text-ink")
                  }
                >
                  <Wallet className="w-4 h-4" />
                  Cash (bayar di muka)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode("cicil")}
                  className={
                    "py-3 px-4 rounded-lg font-semibold text-sm transition-all inline-flex items-center justify-center gap-2 " +
                    (paymentMode === "cicil"
                      ? "bg-white text-primary shadow-sm"
                      : "text-subtext hover:text-ink")
                  }
                >
                  <Calendar className="w-4 h-4" />
                  Cicil
                </button>
              </div>

              {/* Cash mode */}
              {financing.mode === "cash" ? (
                <div className="mt-6 rounded-xl bg-accent-soft border border-accent-border p-5 sm:p-6">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-accent-text">
                    Total Investasi
                  </p>
                  <p className="mt-2 text-3xl sm:text-4xl font-bold text-primary tracking-tight tabular-nums">
                    {formatRupiah(financing.biayaTotal)}
                  </p>
                  <p className="mt-3 text-sm text-accent-text/85 leading-relaxed">
                    Bayar sekali di muka → langsung hemat penuh{" "}
                    <b>{formatRupiah(hasil.hematPerBulan)}/bulan</b> dari bulan pertama. Balik modal dalam <b>{bepYear ?? hasil.paybackPeriodTahun} tahun</b>, sisanya pure profit.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  {/* DP slider */}
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <Label className="!mb-0">Uang muka (DP)</Label>
                      <span className="text-sm font-bold text-primary tabular-nums">
                        {dpPercent}% · {formatRupiahShort(financing.dp)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={50}
                      step={5}
                      value={dpPercent}
                      onChange={(e) => setDpPercent(Number(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none bg-border accent-primary cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-subtext mt-1.5 font-medium">
                      <span>10%</span>
                      <span>20%</span>
                      <span>30%</span>
                      <span>40%</span>
                      <span>50%</span>
                    </div>
                  </div>

                  {/* Tenor buttons */}
                  <div>
                    <Label>Tenor cicilan</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {TENOR_OPTIONS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTenor(t)}
                          className={
                            "py-2.5 rounded-lg text-sm font-semibold transition-colors " +
                            (tenor === t
                              ? "bg-primary text-white"
                              : "bg-surface border border-border text-ink hover:border-primary")
                          }
                        >
                          {t} bln
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-subtext">
                      Bunga flat 0,8% per bulan — estimasi. Hubungi installer untuk penawaran resmi.
                    </p>
                  </div>

                  {/* Cicil result card */}
                  <div className="relative overflow-hidden rounded-xl bg-primary text-white p-5 sm:p-6">
                    <div
                      className="absolute top-0 right-0 w-48 h-48 -translate-y-1/3 translate-x-1/3 rounded-full opacity-50 pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(34,197,94,0.3) 0%, rgba(34,197,94,0) 65%)",
                      }}
                    />
                    <div className="relative grid grid-cols-3 gap-3 sm:gap-5">
                      <div>
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-200/75">
                          DP
                        </p>
                        <p className="mt-1.5 text-base sm:text-lg lg:text-xl font-bold tabular-nums">
                          {formatRupiahShort(financing.dp)}
                        </p>
                      </div>
                      <div className="border-x border-white/10 px-3 sm:px-4">
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-200/75">
                          Cicilan / Bulan
                        </p>
                        <p className="mt-1.5 text-base sm:text-lg lg:text-xl font-bold tabular-nums">
                          {formatRupiahShort(financing.cicilanPerBulan)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-200/75">
                          Total Bayar
                        </p>
                        <p className="mt-1.5 text-base sm:text-lg lg:text-xl font-bold tabular-nums">
                          {formatRupiahShort(financing.totalBayar)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cash flow comparison */}
                  <div
                    className={
                      "rounded-xl p-4 sm:p-5 border-2 " +
                      (financing.cashFlowMonthly >= 0
                        ? "bg-accent-soft border-accent-deep/30"
                        : "bg-amber-50 border-amber-200")
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={
                          "w-9 h-9 rounded-full flex items-center justify-center shrink-0 " +
                          (financing.cashFlowMonthly >= 0
                            ? "bg-accent-deep text-white"
                            : "bg-amber-500 text-white")
                        }
                      >
                        {financing.cashFlowMonthly >= 0 ? (
                          <CheckCircle2 className="w-5 h-5" strokeWidth={2.2} />
                        ) : (
                          <TrendingUp className="w-5 h-5" strokeWidth={2.2} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={
                            "text-sm sm:text-base font-bold " +
                            (financing.cashFlowMonthly >= 0
                              ? "text-accent-text"
                              : "text-amber-800")
                          }
                        >
                          {financing.cashFlowMonthly >= 0
                            ? "Cash flow positif dari bulan pertama!"
                            : "Cicilan masih lebih besar dari hemat"}
                        </p>
                        <p className="mt-1.5 text-xs sm:text-sm text-ink/75 leading-relaxed">
                          Cicilan <b>{formatRupiah(financing.cicilanPerBulan)}/bln</b> vs hemat listrik <b>{formatRupiah(hasil.hematPerBulan)}/bln</b>
                          {" → "}
                          {financing.cashFlowMonthly >= 0 ? "kamu untung" : "kamu nombok"}{" "}
                          <b
                            className={
                              financing.cashFlowMonthly >= 0
                                ? "text-accent-text"
                                : "text-amber-800"
                            }
                          >
                            {financing.cashFlowMonthly >= 0 ? "+" : ""}
                            {formatRupiah(financing.cashFlowMonthly)}/bulan
                          </b>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* ── FITUR 2: Side-by-side: Interactive Projection Chart + Detail breakdown ── */}
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-ink">Proyeksi 25 tahun</h3>
                  <p className="mt-1 text-xs text-subtext leading-relaxed">
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-accent-deep" />
                      <span>Akumulasi hemat (tarif PLN +5%/tahun)</span>
                    </span>
                    <span className="mx-2 text-border">·</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                      <span>Biaya instalasi</span>
                    </span>
                  </p>
                </div>
                {bepYear !== null ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold whitespace-nowrap">
                    <TrendingUp className="w-3 h-3" />
                    BEP {bepYear} thn
                  </span>
                ) : null}
              </div>
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={projeksi25}
                    margin={{ top: 20, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="tahun"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => (v === 0 ? "0" : v === 25 ? "25 thn" : `${v}`)}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatRupiahShort(v).replace("Rp ", "")}
                      width={50}
                    />
                    <ChartTooltip
                      cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "3 3" }}
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const d = payload[0].payload as {
                          tahun: number;
                          hemat: number;
                          biaya: number;
                        };
                        const sisa = Math.max(0, d.biaya - d.hemat);
                        const surplus = Math.max(0, d.hemat - d.biaya);
                        return (
                          <div className="rounded-xl bg-white border border-border shadow-lg p-3 text-xs">
                            <p className="font-bold text-ink">Tahun ke-{d.tahun}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-accent-deep">
                                Total hemat: <b className="tabular-nums">{formatRupiahShort(d.hemat)}</b>
                              </p>
                              {sisa > 0 ? (
                                <p className="text-subtext">
                                  Sisa investasi: <b className="tabular-nums text-ink">{formatRupiahShort(sisa)}</b>
                                </p>
                              ) : (
                                <p className="text-accent-text">
                                  Surplus: <b className="tabular-nums">{formatRupiahShort(surplus)}</b>
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      }}
                    />
                    {bepYear !== null ? (
                      <ReferenceLine
                        x={bepYear}
                        stroke="#d97706"
                        strokeDasharray="4 4"
                        strokeOpacity={0.7}
                        label={{
                          value: `Balik Modal · ${bepYear} thn`,
                          fill: "#d97706",
                          fontSize: 10,
                          fontWeight: 700,
                          position: "top",
                        }}
                      />
                    ) : null}
                    <Line
                      type="monotone"
                      dataKey="biaya"
                      stroke="#dc2626"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      dot={false}
                      name="Biaya"
                      isAnimationActive
                    />
                    <Line
                      type="monotone"
                      dataKey="hemat"
                      stroke="#16a34a"
                      strokeWidth={2.75}
                      dot={false}
                      name="Hemat"
                      isAnimationActive
                    />
                    {bepYear !== null ? (
                      <ReferenceDot
                        x={bepYear}
                        y={(hasil.biayaInstalasiMin + hasil.biayaInstalasiMax) / 2}
                        r={6}
                        fill="#d97706"
                        stroke="#fff"
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {bepYear !== null && finalProfit > 0 ? (
                <div className="mt-4 rounded-xl bg-accent-soft border border-accent-border p-3.5">
                  <p className="text-sm text-accent-text leading-relaxed">
                    <span className="font-semibold">Di tahun ke-{bepYear}</span>, kamu sudah balik modal dan lanjut hemat{" "}
                    <b className="text-primary">{formatRupiahShort(finalProfit)}</b> hingga tahun ke-25.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm">
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
                  value={formatRupiahShort(projeksi25[25]?.hemat ?? hasil.penghematanTotal25Tahun)}
                  emphasis
                />
                <DetailRow
                  label={
                    <span className="inline-flex items-center gap-1.5">
                      <Leaf className="w-3.5 h-3.5 text-accent-deep" />
                      CO₂ dikurangi
                    </span>
                  }
                  value={`${hasil.co2DihemanKgPerTahun.toLocaleString("id-ID")} kg/tahun`}
                />
              </dl>
            </div>
          </div>

          {/* ── FITUR 3: Download PDF Report ── */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-white to-accent-soft/60 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-ink">Simpan untuk nanti</h4>
                  <p className="mt-1 text-sm text-subtext">
                    Unduh laporan lengkap dalam PDF — bisa di-print atau di-share ke installer.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleDownloadPDF}
                loading={pdfLoading}
                variant="secondary"
                className="shrink-0 border-primary text-primary hover:bg-primary hover:text-white whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Unduh PDF
              </Button>
            </div>
          </div>

          {/* Lead CTA card */}
          <div className="rounded-2xl border border-border bg-surface/60 p-6 sm:p-7">
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
                className="bg-primary hover:bg-primary-deep h-11 px-6 shrink-0"
              >
                Hubungkan saya
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Lead form section */}
          <div
            ref={leadFormRef}
            className="rounded-2xl border border-accent-deep/25 bg-accent-soft/40 p-6 sm:p-8 scroll-mt-20"
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
    <div className="flex items-baseline justify-between gap-3 pb-3 border-b border-dashed border-border last:border-0 last:pb-0">
      <dt className="text-sm text-subtext">{label}</dt>
      <dd
        className={
          "text-sm font-bold tabular-nums " +
          (emphasis ? "text-primary text-base" : "text-ink")
        }
      >
        {value}
      </dd>
    </div>
  );
}

// ── Calculating state card (shown 1.5s before result reveals) ──
function CalculatingCard({ kota }: { kota: string }) {
  const messages = React.useMemo(
    () => [
      "Membaca tagihan listrik kamu...",
      `Mencari Peak Sun Hours untuk ${kota}...`,
      "Menentukan ukuran sistem optimal...",
      "Menghitung ROI 25 tahun...",
    ],
    [kota]
  );
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setStep(messages.length - 1);
      return;
    }
    const stepDuration = CALCULATING_DURATION_MS / messages.length;
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, messages.length - 1));
    }, stepDuration);
    return () => clearInterval(id);
  }, [messages.length]);

  const progress = ((step + 1) / messages.length) * 100;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary text-white p-7 sm:p-10 shadow-[0_30px_80px_-32px_rgba(10,61,46,0.45)]">
      <div
        className="absolute top-0 right-0 w-[420px] h-[420px] -translate-y-1/4 translate-x-1/4 rounded-full opacity-60 pointer-events-none animate-pulse"
        style={{
          background:
            "radial-gradient(circle, rgba(34,197,94,0.3) 0%, rgba(34,197,94,0) 60%)",
          animationDuration: "2.4s",
        }}
      />
      <div className="relative">
        <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200/80">
          <span className="relative inline-flex w-4 h-4 items-center justify-center">
            <CalculatorIcon className="w-4 h-4 animate-pulse" style={{ animationDuration: "1s" }} />
          </span>
          Menghitung Estimasi
        </div>
        <div className="mt-6 min-h-[68px] sm:min-h-[80px]">
          <p
            key={step}
            className="text-xl sm:text-3xl font-bold tracking-tight text-white animate-fade-in"
          >
            {messages[step]}
          </p>
        </div>
        <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-white/55">
          <Sparkles className="w-3.5 h-3.5" />
          Tarif PLN 2024 · PSH NASA POWER · Performance ratio 80%
        </div>

        {/* Progress bar */}
        <div className="mt-7 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stat skeletons (mimics result card layout) */}
        <div className="relative mt-9 pt-7 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-white/10">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="px-0 sm:px-6 first:pl-0 last:pr-0 py-4 sm:py-0 first:pt-0 last:pb-0"
            >
              <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
              <div
                className="mt-3 h-7 w-28 rounded bg-white/15 animate-pulse"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
