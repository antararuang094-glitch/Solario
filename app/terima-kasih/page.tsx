"use client";

import Link from "next/link";
import { SiteNavbar, Footer } from "@/components/SiteNavbar";
import { Button } from "@/components/ui/button";
import { Check, Copy, MessageCircle } from "lucide-react";
import * as React from "react";
import { useToast } from "@/components/ui/toast";

export default function TerimaKasihPage() {
  const { toast } = useToast();
  // Start with `null` and only render share controls after we know the
  // real origin — avoids a one-frame "https://solario.id" flash on
  // staging/preview deployments.
  const [appUrl, setAppUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    setAppUrl(window.location.origin);
  }, []);

  const shareText = encodeURIComponent(
    "Coba kalkulator solar panel gratis di Solario.id — hasilnya instan, langsung tahu berapa hemat dan balik modal."
  );
  const waUrl = appUrl
    ? `https://wa.me/?text=${shareText}%20${encodeURIComponent(appUrl)}`
    : "#";

  const copyLink = async () => {
    if (!appUrl) return;
    try {
      await navigator.clipboard.writeText(appUrl);
      toast("Link disalin", "success");
    } catch {
      toast("Gagal menyalin link", "error");
    }
  };

  return (
    <>
      <SiteNavbar />
      <main className="mx-auto max-w-xl px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent-deep flex items-center justify-center">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="mt-8 text-3xl sm:text-4xl font-semibold text-ink tracking-tight">
            Permintaan kamu sudah kami terima!
          </h1>
          <p className="mt-4 text-subtext text-base leading-relaxed">
            Tim Solario akan meneruskan data ke installer terpercaya di kotamu.
            Kamu akan dihubungi via WhatsApp dalam <b className="text-ink">1×24 jam</b>.
          </p>
        </div>

        <div className="mt-12 rounded-xl border border-border bg-surface p-6">
          <p className="text-sm font-semibold text-ink">Apa yang terjadi selanjutnya?</p>
          <ol className="mt-4 space-y-2 text-sm text-subtext list-decimal pl-5 leading-relaxed">
            <li>Tim Solario verifikasi data dan match dengan installer di kota kamu.</li>
            <li>Installer akan hubungi kamu via WhatsApp untuk survei awal.</li>
            <li>Setelah cocok, mereka kasih penawaran resmi — kamu bebas terima atau tolak.</li>
          </ol>
        </div>

        <div className="mt-8">
          <p className="text-sm font-semibold text-ink">Bantu teman kamu hemat juga</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
              aria-disabled={!appUrl}
            >
              <Button variant="secondary" className="w-full" disabled={!appUrl}>
                <MessageCircle className="w-4 h-4" />
                Bagikan via WhatsApp
              </Button>
            </a>
            <Button
              variant="secondary"
              onClick={copyLink}
              className="flex-1"
              disabled={!appUrl}
            >
              <Copy className="w-4 h-4" />
              Salin link
            </Button>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-2 justify-center text-sm">
          <Link
            href="/"
            className="text-primary hover:underline px-3 min-h-[44px] inline-flex items-center justify-center"
          >
            ← Kembali ke beranda
          </Link>
          <Link
            href="/kalkulator"
            className="text-primary hover:underline px-3 min-h-[44px] inline-flex items-center justify-center"
          >
            Hitung untuk rumah/usaha lain
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
