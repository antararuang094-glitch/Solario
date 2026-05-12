import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Solario.id — Kalkulator ROI Solar Panel untuk Indonesia",
  description:
    "Hitung estimasi penghematan dan balik modal solar panel dalam 60 detik. Gratis, akurat, tanpa daftar. Hubungkan dengan installer terverifikasi di kota Anda.",
  keywords: [
    "kalkulator solar panel",
    "solar panel indonesia",
    "ROI solar",
    "hemat tagihan listrik",
    "installer solar",
  ],
  openGraph: {
    title: "Solario.id — Hitung Hemat Solar Panel dalam 60 Detik",
    description:
      "Kalkulator ROI solar panel gratis untuk pasar Indonesia.",
    url: "https://solario.id",
    siteName: "Solario.id",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={inter.variable}>
      <body className={`${inter.className} antialiased min-h-screen bg-white text-ink`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
