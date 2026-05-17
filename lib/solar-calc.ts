export interface KalkulatorInput {
  tagihanBulanan: number;
  kota: string;
  golonganListrik: string;
}

export interface KalkulatorOutput {
  estimasiKwhPerBulan: number;
  sistemKwpRekomendasi: number;
  biayaInstalasiMin: number;
  biayaInstalasiMax: number;
  produksiKwhPerBulan: number;
  hematPerBulan: number;
  hematPerTahun: number;
  paybackPeriodTahun: number;
  penghematanTotal25Tahun: number;
  co2DihemanKgPerTahun: number;
}

export const TARIF_PLN: Record<string, number> = {
  "R1-900": 1352,
  "R1-1300": 1444,
  "R1-2200": 1444,
  R2: 1699,
  R3: 1699,
  B1: 1115,
  B2: 1115,
};

export const PSH_KOTA: Record<string, number> = {
  Jakarta: 4.8,
  Surabaya: 5.2,
  Bandung: 4.5,
  Medan: 4.6,
  Makassar: 5.4,
  Bali: 5.5,
  Semarang: 5.0,
  Palembang: 4.7,
  Batam: 4.8,
  Yogyakarta: 4.9,
  default: 5.0,
};

export const GOLONGAN_OPTIONS = [
  { value: "R1-900", label: "R1 / 900 VA — Rumah tangga subsidi" },
  { value: "R1-1300", label: "R1 / 1.300 VA — Rumah tangga kecil" },
  { value: "R1-2200", label: "R1 / 2.200 VA — Rumah tangga menengah" },
  { value: "R2", label: "R2 / 3.500–5.500 VA — Rumah tangga besar" },
  { value: "R3", label: "R3 / >6.600 VA — Rumah tangga mewah" },
  { value: "B1", label: "B1 / Bisnis kecil — Warung, toko kecil" },
  { value: "B2", label: "B2 / Bisnis menengah — Ruko, kantor" },
];

export const KOTA_OPTIONS = [
  "Jakarta",
  "Surabaya",
  "Bandung",
  "Medan",
  "Makassar",
  "Bali",
  "Semarang",
  "Palembang",
  "Batam",
  "Yogyakarta",
  "Kota lainnya",
];

const BIAYA_PER_KWP_MIN = 10_000_000;
const BIAYA_PER_KWP_MAX = 15_000_000;
const PERFORMANCE_RATIO = 0.8;
const CO2_PER_KWH = 0.709;

// ── 25-year projection assumptions (single source of truth) ──
// PLN tariff has historically risen ~5%/year. Solar panels degrade ~0.5%/year.
// These constants drive both `penghematanTotal25Tahun` and `buatProyeksi25Tahun`
// so the totals on the hero card and on the projection chart never disagree.
export const KENAIKAN_TARIF_PLN = 0.05;
export const DEGRADASI_PANEL = 0.005;
export const PROYEKSI_TAHUN = 25;

export function hitungSolar(input: KalkulatorInput): KalkulatorOutput {
  const tarif = TARIF_PLN[input.golonganListrik] ?? 1444;
  const psh = PSH_KOTA[input.kota] ?? PSH_KOTA["default"];

  const kwhPerBulan = Math.round(input.tagihanBulanan / tarif);

  const sistemKwp = kwhPerBulan / (psh * 30 * PERFORMANCE_RATIO);
  const sistemKwpBulat = Math.ceil(sistemKwp * 2) / 2;

  const produksiKwh = sistemKwpBulat * psh * 30 * PERFORMANCE_RATIO;

  const kwhDihemat = Math.min(produksiKwh, kwhPerBulan);
  const hematPerBulan = Math.round(kwhDihemat * tarif);
  const hematPerTahun = hematPerBulan * 12;

  const biayaMin = Math.round(sistemKwpBulat * BIAYA_PER_KWP_MIN);
  const biayaMax = Math.round(sistemKwpBulat * BIAYA_PER_KWP_MAX);
  const biayaMid = (biayaMin + biayaMax) / 2;

  const payback = hematPerTahun > 0 ? biayaMid / hematPerTahun : 0;

  // Sum yearly savings over PROYEKSI_TAHUN with tariff escalation (+5%)
  // compounding panel degradation (-0.5%). Matches buatProyeksi25Tahun.
  let totalHemat = 0;
  for (let i = 0; i < PROYEKSI_TAHUN; i++) {
    const tariffMul = Math.pow(1 + KENAIKAN_TARIF_PLN, i);
    const degMul = Math.pow(1 - DEGRADASI_PANEL, i);
    totalHemat += hematPerTahun * tariffMul * degMul;
  }

  const co2Hemat = Math.round(kwhDihemat * 12 * CO2_PER_KWH);

  return {
    estimasiKwhPerBulan: kwhPerBulan,
    sistemKwpRekomendasi: sistemKwpBulat,
    biayaInstalasiMin: biayaMin,
    biayaInstalasiMax: biayaMax,
    produksiKwhPerBulan: Math.round(produksiKwh),
    hematPerBulan,
    hematPerTahun,
    paybackPeriodTahun: Math.round(payback * 10) / 10,
    penghematanTotal25Tahun: Math.round(totalHemat),
    co2DihemanKgPerTahun: co2Hemat,
  };
}

/**
 * 25-year cumulative savings projection — single source of truth used by
 * both the calculator UI chart and the hero card total. Models PLN tariff
 * escalation (+5%/yr) compounded with panel degradation (-0.5%/yr).
 *
 * Returns an array with entry per year 0..25 inclusive, where `hemat` is
 * the cumulative savings up to and including that year and `biaya` is the
 * flat installation cost (constant across years for break-even visualization).
 */
export function buatProyeksi25Tahun(
  hematPerTahun: number,
  biayaInstalasi: number
): Array<{ tahun: number; hemat: number; biaya: number }> {
  const data: Array<{ tahun: number; hemat: number; biaya: number }> = [];
  let kumulatif = 0;
  for (let year = 0; year <= PROYEKSI_TAHUN; year++) {
    if (year > 0) {
      const tariffMul = Math.pow(1 + KENAIKAN_TARIF_PLN, year - 1);
      const degMul = Math.pow(1 - DEGRADASI_PANEL, year - 1);
      kumulatif += hematPerTahun * tariffMul * degMul;
    }
    data.push({
      tahun: year,
      hemat: Math.round(kumulatif),
      biaya: biayaInstalasi,
    });
  }
  return data;
}
