import Link from "next/link";
import { Sun } from "lucide-react";

export function Navbar() {
  return (
    <header className="border-b border-[#e5e7eb] bg-white/85 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-[#0a3d2e] flex items-center justify-center text-white group-hover:bg-[#16a34a] transition-colors">
            <Sun className="w-4 h-4" />
          </div>
          <span className="font-bold text-ink text-lg tracking-tight">
            Solario<span className="text-[#16a34a]">.id</span>
          </span>
        </Link>
        <nav className="flex items-center gap-0.5 sm:gap-1 text-sm">
          <Link
            href="/"
            className="hidden sm:inline-block px-3 py-2 rounded-xl text-ink hover:text-[#0a3d2e] font-medium"
          >
            Beranda
          </Link>
          <Link
            href="/kalkulator"
            className="px-3 py-2 rounded-xl text-ink hover:text-[#0a3d2e] font-medium"
          >
            Kalkulator
          </Link>
          <Link
            href="/partner-installer"
            className="px-3 py-2 rounded-xl text-ink hover:text-[#0a3d2e] hidden sm:inline-block font-medium"
          >
            Untuk Installer
          </Link>
          <Link
            href="/admin"
            className="ml-1 hidden sm:inline-flex items-center px-3.5 h-10 rounded-full border border-[#e5e7eb] text-ink hover:border-[#0a3d2e] text-sm font-medium transition-colors"
          >
            Masuk Admin
          </Link>
          <Link
            href="/kalkulator"
            className="ml-1 inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-[#0a3d2e] text-white text-sm font-medium hover:bg-[#07291f] transition-colors"
          >
            Hitung Sekarang
            <span aria-hidden>→</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[#e5e7eb] bg-surface mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-14">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#0a3d2e] flex items-center justify-center text-white">
                <Sun className="w-4 h-4" />
              </div>
              <span className="font-bold text-ink tracking-tight">
                Solario<span className="text-[#16a34a]">.id</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-subtext leading-relaxed max-w-xs">
              Platform netral yang membantu rumah tangga & UKM Indonesia menghitung potensi hemat dari solar panel — gratis, akurat, tanpa daftar.
            </p>
          </div>

          <FooterColumn
            title="Produk"
            links={[
              { label: "Kalkulator", href: "/kalkulator" },
              { label: "Cara kerja", href: "/#how" },
              { label: "Untuk Installer", href: "/partner-installer" },
              { label: "FAQ", href: "#" },
            ]}
          />
          <FooterColumn
            title="Perusahaan"
            links={[
              { label: "Tentang Kami", href: "#" },
              { label: "Blog", href: "#" },
              { label: "Kontak", href: "#" },
              { label: "Karier", href: "#" },
            ]}
          />
          <FooterColumn
            title="Lainnya"
            links={[
              { label: "Kebijakan Privasi", href: "#" },
              { label: "Syarat Layanan", href: "#" },
              { label: "Sumber Tarif", href: "#" },
              { label: "API", href: "#" },
            ]}
          />
        </div>

        <div className="mt-10 pt-6 border-t border-[#e5e7eb] flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between text-xs text-subtext">
          <span>© {new Date().getFullYear()} Solario.id · Jakarta, Indonesia</span>
          <span>Tarif PLN 2024 · PSH NASA POWER</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-subtext mb-4">
        {title}
      </h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm text-ink hover:text-[#16a34a] transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
