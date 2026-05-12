import { Navbar, Footer } from "@/components/Navbar";
import { InstallerForm } from "@/components/InstallerForm";
import { CheckCircle2, MapPin, Wallet } from "lucide-react";

export const metadata = {
  title: "Partner Installer — Solario.id",
  description: "Dapatkan leads solar berkualitas setiap bulan. Daftar gratis sebagai partner installer Solario.id.",
};

export default function PartnerInstallerPage() {
  const valueProps = [
    {
      icon: <CheckCircle2 className="w-5 h-5" />,
      title: "Leads terverifikasi",
      desc: "Setiap lead sudah verifikasi nomor WhatsApp dan mengisi data budget + timeline.",
    },
    {
      icon: <Wallet className="w-5 h-5" />,
      title: "Bayar hanya untuk leads valid",
      desc: "Tidak ada biaya pendaftaran. Tidak ada subscription. Bayar per lead yang Anda terima.",
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      title: "Jangkauan seluruh Indonesia",
      desc: "Kami match lead dengan installer di kota mereka — Anda hanya terima lead di area cakupan Anda.",
    },
  ];

  return (
    <>
      <Navbar />

      <section className="border-b border-[#e5e7eb] bg-gradient-to-b from-white to-[#f9fafb]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-wide text-[#16a34a]">Untuk Installer</p>
            <h1 className="mt-2 text-3xl sm:text-5xl font-semibold text-ink tracking-tight leading-tight">
              Dapatkan leads solar berkualitas setiap bulan.
            </h1>
            <p className="mt-4 text-lg text-subtext">
              Solario menghubungkan calon customer (rumah & UKM) yang sudah hitung ROI mereka dengan installer terpercaya di kota mereka. Daftar gratis di bawah — tim kami akan verifikasi dan menghubungi Anda.
            </p>
          </div>

          <div className="mt-10 grid sm:grid-cols-3 gap-4">
            {valueProps.map((v) => (
              <div key={v.title} className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] text-[#16a34a] flex items-center justify-center">
                  {v.icon}
                </div>
                <h3 className="mt-4 text-base font-semibold text-ink">{v.title}</h3>
                <p className="mt-1 text-sm text-subtext">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-ink">Form Pendaftaran Partner</h2>
            <p className="mt-1 text-sm text-subtext">
              Isi data perusahaan dan PIC. Kami akan menghubungi via WhatsApp untuk verifikasi.
            </p>
            <div className="mt-6">
              <InstallerForm />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
