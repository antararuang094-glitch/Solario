import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatRupiah(n: number): string {
  if (!Number.isFinite(n)) return "Rp 0";
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export function formatRupiahShort(n: number): string {
  if (!Number.isFinite(n)) return "Rp 0";
  const absN = Math.abs(n);
  if (absN >= 1_000_000_000) return "Rp " + (n / 1_000_000_000).toFixed(1) + " M";
  if (absN >= 1_000_000) return "Rp " + (n / 1_000_000).toFixed(1) + " jt";
  if (absN >= 1_000) return "Rp " + (n / 1_000).toFixed(0) + " rb";
  return "Rp " + n.toLocaleString("id-ID");
}

export function parseRupiahInput(s: string): number {
  const digits = s.replace(/[^\d]/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10);
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Strip any non-digit character from a string. Centralised here so the
 * many places that parse phone numbers / Rupiah inputs / OTP digits
 * agree on one implementation.
 */
export function stripDigits(s: string): string {
  return s.replace(/\D/g, "");
}

/**
 * Build a `https://wa.me/<international>` URL from an Indonesian phone
 * number that may use any of `+62`, `62`, or `0` prefixes.
 */
export function buildWaUrl(telepon: string): string {
  let t = stripDigits(telepon);
  if (t.startsWith("0")) t = "62" + t.slice(1);
  // If number already starts with 62 (or any other country code), leave it.
  return `https://wa.me/${t}`;
}
