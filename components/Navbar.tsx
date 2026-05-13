"use client";

import * as React from "react";
import Link from "next/link";
import { Calculator, Home, LogIn, Menu, Wrench, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="border-b border-[#e5e7eb] bg-white/85 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <img
              src="/solario-icon.png"
              alt=""
              aria-hidden="true"
              className="w-11 h-11 object-contain -ml-1 transition-transform group-hover:rotate-[-4deg] group-hover:scale-105"
            />
            <span className="font-bold text-ink text-lg tracking-tight">
              Solario<span className="text-[#16a34a]">.id</span>
            </span>
          </Link>

          <nav className="flex items-center gap-0.5 sm:gap-1 text-sm">
            <Link
              href="/"
              className="hidden md:inline-block px-3 py-2 rounded-xl text-ink hover:text-[#0a3d2e] font-medium"
            >
              Beranda
            </Link>
            <Link
              href="/kalkulator"
              className="hidden md:inline-block px-3 py-2 rounded-xl text-ink hover:text-[#0a3d2e] font-medium"
            >
              Kalkulator
            </Link>
            <Link
              href="/partner-installer"
              className="hidden md:inline-block px-3 py-2 rounded-xl text-ink hover:text-[#0a3d2e] font-medium"
            >
              Untuk Installer
            </Link>
            <Link
              href="/admin"
              className="ml-1 hidden md:inline-flex items-center px-3.5 h-10 rounded-full border border-[#e5e7eb] text-ink hover:border-[#0a3d2e] text-sm font-medium transition-colors"
            >
              Masuk Admin
            </Link>
            <Link
              href="/kalkulator"
              className="ml-1 hidden sm:inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-[#0a3d2e] text-white text-sm font-medium hover:bg-[#07291f] transition-colors"
            >
              Hitung Sekarang
              <span aria-hidden>→</span>
            </Link>

            <button
              type="button"
              aria-label="Buka menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="md:hidden ml-1 inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#e5e7eb] text-ink hover:bg-[#f0fdf4] hover:border-[#bbf7d0] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-[199] bg-[#07291f]/40 backdrop-blur-sm transition-opacity duration-300",
          menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={closeMenu}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "md:hidden fixed top-0 right-0 bottom-0 z-[200] w-[min(360px,82vw)] bg-white shadow-[-20px_0_60px_-20px_rgba(7,41,31,0.18)] flex flex-col transition-transform duration-300 ease-out",
          menuOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
          <span className="flex items-center gap-2">
            <img
              src="/solario-icon.png"
              alt=""
              aria-hidden="true"
              className="w-10 h-10 object-contain -ml-1"
            />
            <span className="font-bold text-ink tracking-tight">
              Solario<span className="text-[#16a34a]">.id</span>
            </span>
          </span>
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={closeMenu}
            className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-surface border border-[#e5e7eb] text-ink hover:bg-[#f0fdf4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          <DrawerLink
            href="/"
            icon={<Home className="w-5 h-5" />}
            onClick={closeMenu}
            open={menuOpen}
            delay={80}
          >
            Beranda
          </DrawerLink>
          <DrawerLink
            href="/kalkulator"
            icon={<Calculator className="w-5 h-5" />}
            onClick={closeMenu}
            open={menuOpen}
            delay={140}
          >
            Kalkulator
          </DrawerLink>
          <DrawerLink
            href="/partner-installer"
            icon={<Wrench className="w-5 h-5" />}
            onClick={closeMenu}
            open={menuOpen}
            delay={200}
          >
            Untuk Installer
          </DrawerLink>
          <DrawerLink
            href="/admin"
            icon={<LogIn className="w-5 h-5" />}
            onClick={closeMenu}
            open={menuOpen}
            delay={260}
          >
            Masuk Admin
          </DrawerLink>
        </nav>

        <div className="px-5 pt-4 pb-6 border-t border-[#e5e7eb] flex flex-col items-center gap-2">
          <Link
            href="/kalkulator"
            onClick={closeMenu}
            className="w-full inline-flex items-center justify-center gap-1.5 h-12 px-6 rounded-full bg-[#0a3d2e] text-white font-medium hover:bg-[#07291f] transition-colors"
          >
            Hitung Sekarang <span aria-hidden>→</span>
          </Link>
          <p className="text-xs text-subtext">Gratis · Tanpa daftar</p>
        </div>
      </aside>
    </>
  );
}

function DrawerLink({
  href,
  icon,
  children,
  onClick,
  open,
  delay,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  open: boolean;
  delay: number;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        animationDelay: `${delay}ms`,
      }}
      className={cn(
        "flex items-center gap-3.5 px-3.5 py-3.5 rounded-xl text-ink hover:bg-[#f0fdf4] hover:text-[#0a3d2e] font-medium text-base transition-colors group",
        open ? "animate-[drawerItemIn_0.5s_cubic-bezier(0.16,1,0.3,1)_forwards] opacity-0 -translate-x-3" : "opacity-100 translate-x-0"
      )}
    >
      <span className="text-subtext group-hover:text-[#16a34a] transition-colors">{icon}</span>
      {children}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[#e5e7eb] bg-surface mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-14">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/solario-icon.png"
                alt=""
                aria-hidden="true"
                className="w-10 h-10 object-contain -ml-1"
              />
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
              { label: "Tentang Kami", href: "/tentang" },
              { label: "Blog", href: "#" },
              { label: "Kontak", href: "mailto:halo@solario.id" },
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
        {links.map((l) => {
          const isExternal =
            l.href.startsWith("mailto:") ||
            l.href.startsWith("tel:") ||
            l.href.startsWith("http") ||
            l.href === "#";
          const linkClass =
            "text-sm text-ink hover:text-[#16a34a] transition-colors";
          return (
            <li key={l.label}>
              {isExternal ? (
                <a href={l.href} className={linkClass}>
                  {l.label}
                </a>
              ) : (
                <Link href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
