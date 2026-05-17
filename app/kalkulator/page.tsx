import { SiteNavbar, Footer } from "@/components/SiteNavbar";
import { Calculator } from "@/components/Calculator";

export const metadata = {
  title: "Kalkulator Solar Panel — Solario.id",
  description:
    "Hitung penghematan & balik modal solar panel rumah atau usahamu dalam 60 detik. Gratis.",
};

export default function KalkulatorPage() {
  return (
    <>
      <SiteNavbar />
      <section className="bg-accent-soft/40 border-b border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-20 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-accent-border text-accent-text text-xs font-semibold">
            Kalkulator Solar ROI
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight">
            Berapa kamu bisa hemat?
          </h1>
          <p className="mt-4 text-base sm:text-lg text-subtext max-w-2xl">
            Isi tiga hal di bawah, kami hitung hemat bulanan, ukuran sistem, dan kapan kamu balik modal.
          </p>
        </div>
      </section>
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-16">
        <Calculator />
      </main>
      <Footer />
    </>
  );
}
