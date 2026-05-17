import Link from "next/link";
import { SiteNavbar, Footer } from "@/components/SiteNavbar";
import { ArrowRight, Check } from "lucide-react";

export const metadata = {
  title: "Tentang Kami — Solario.id",
  description:
    "Platform netral kalkulator ROI solar panel untuk Indonesia. Misi kami: membuat keputusan solar mudah, akurat, dan transparan untuk rumah tangga & UKM.",
};

export default function TentangPage() {
  return (
    <>
      <SiteNavbar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-20">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-soft border border-accent-border text-accent-text text-xs font-semibold">
            Tentang Kami
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight leading-tight">
            Membuat solar lebih mudah <br className="hidden sm:block" />
            untuk semua orang Indonesia.
          </h1>
          <p className="mt-6 text-lg text-subtext leading-relaxed">
            Solario.id adalah platform netral yang menghubungkan rumah tangga dan UKM Indonesia dengan installer solar panel terpercaya. Kami percaya keputusan untuk pindah ke solar harus didasari informasi yang jujur, transparan, dan mudah dipahami — bukan promosi sepihak.
          </p>
        </div>

        <section className="mt-16 grid sm:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-ink">Misi Kami</h2>
            <p className="mt-4 text-subtext leading-relaxed">
              Mengakselerasi transisi energi bersih di Indonesia dengan menyediakan tools dan informasi yang membuat ROI solar bisa dihitung dalam hitungan detik — tanpa daftar, tanpa email spam.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink">Cara Kerja</h2>
            <p className="mt-4 text-subtext leading-relaxed">
              Kami pakai tarif PLN 2024, Peak Sun Hours per kota, dan performance ratio industri (80%) untuk memberikan estimasi yang konservatif. Setelah hitung, kami sambungkan ke installer terverifikasi di kotamu.
            </p>
          </div>
        </section>

        <section className="mt-16 rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-xl font-bold text-ink">Nilai-nilai Kami</h2>
          <ul className="mt-6 space-y-4">
            {[
              {
                title: "Transparan",
                desc: "Kami tunjukkan asumsi dan sumber data, bukan janji surga.",
              },
              {
                title: "Netral",
                desc: "Kami bukan installer. Kami sambungkan kamu ke yang terpercaya di kotamu.",
              },
              {
                title: "Gratis",
                desc: "Kalkulator selamanya gratis. Data kamu tidak dijual ke pihak ketiga.",
              },
            ].map((v) => (
              <li key={v.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-accent-deep text-white flex items-center justify-center">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </span>
                <span className="text-subtext">
                  <b className="text-ink">{v.title}</b> — {v.desc}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 text-center bg-primary text-white rounded-2xl p-8 sm:p-12 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 90% 10%, rgba(34,197,94,0.18), transparent 55%)",
            }}
          />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold">Mulai hitung hematmu</h2>
            <p className="mt-3 text-white/70">
              Tanpa daftar. Tanpa email spam. Hasil dalam 60 detik.
            </p>
            <Link
              href="/kalkulator"
              className="mt-8 inline-flex items-center gap-2 px-6 h-12 rounded-full bg-accent text-white font-semibold hover:bg-accent-deep transition-colors"
            >
              Hitung Sekarang
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <p className="mt-12 text-sm text-subtext text-center">
          Punya pertanyaan? Kirim email ke{" "}
          <a
            href="mailto:halo@solario.id"
            className="text-primary font-semibold hover:underline"
          >
            halo@solario.id
          </a>
        </p>
      </main>
      <Footer />
    </>
  );
}
