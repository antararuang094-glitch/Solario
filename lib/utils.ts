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
