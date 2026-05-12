"use client";

import Link from "next/link";
import { Navbar, Footer } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Check, Copy, MessageCircle } from "lucide-react";
import * as React from "react";
import { useToast } from "@/components/ui/toast";

export default function TerimaKasihPage() {
  const { toast } = useToast();
  const [appUrl, setAppUrl] = React.useState("https://solario.id");

  React.useEffect(() => {
    setAppUrl(window.location.origin);
  }, []);

  const shareText = encodeURIComponent(
    "Coba kalkulator solar panel gratis di Solario.id — hasilnya instan, langsung tahu berapa hemat dan balik modal."
  );
  const waUrl = `https://wa.me/?text=${shareText}%20${encodeURIComponent(appUrl)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      toast("Link disalin", "success");
    } catch {
      toast("Gagal menyalin link", "error");
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-xl px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#16a34a] flex items-center justify-center">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="mt-6 text-3xl sm:text-4xl font-semibold text-ink">
            Permintaan kamu sudah kami terima!
          </h1>
          <p className="mt-3 text-subtext text-base">
            Tim Solario akan meneruskan data ke installer terpercaya di kotamu.
            Kamu akan dihubungi via WhatsApp dalam <b className="text-ink">1×24 jam</b>.
          </p>
        </div>

        <div className="mt-10 rounded-xl border border-[#e5e7eb] bg-surface p-6">
          <p className="text-sm font-medium text-ink">Apa yang terjadi selanjutnya?</p>
          <ol className="mt-3 space-y-2 text-sm text-subtext list-decimal pl-5">
            <li>Tim Solario verifikasi data dan match dengan installer di kota kamu.</li>
            <li>Installer akan hubungi kamu via WhatsApp untuk survei awal.</li>
            <li>Setelah cocok, mereka kasih penawaran resmi — kamu bebas terima atau tolak.</li>
          </ol>
        </div>

        <div className="mt-8">
          <p className="text-sm font-medium text-ink">Bantu teman kamu hemat juga</p>
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="secondary" className="w-full">
                <MessageCircle className="w-4 h-4" />
                Bagikan via WhatsApp
              </Button>
            </a>
            <Button variant="secondary" onClick={copyLink} className="flex-1">
              <Copy className="w-4 h-4" />
              Salin link
            </Button>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-2 justify-center text-sm">
          <Link href="/" className="text-[#0d3b2e] hover:underline px-3 py-2">
            ← Kembali ke beranda
          </Link>
          <Link href="/kalkulator" className="text-[#0d3b2e] hover:underline px-3 py-2">
            Hitung untuk rumah/usaha lain
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
