"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calculator as CalculatorIcon,
  Home as HomeIcon,
  Menu,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──
export interface SiteNavbarLink {
  label: string;
  href: string;
  /** When true, click triggers smooth scroll instead of route navigation */
  anchor?: boolean;
}

export interface SiteNavbarDrawerLink extends SiteNavbarLink {
  icon?: React.ReactNode;
}

interface SiteNavbarProps {
  /** Links shown horizontally on desktop (md+). Hidden on mobile. */
  desktopLinks?: SiteNavbarLink[];
  /** Links shown in the mobile hamburger drawer */
  drawerLinks?: SiteNavbarDrawerLink[];
  /** CTA button destination (defaults to `/kalkulator`) */
  ctaHref?: string;
  /** CTA button label (defaults to "Hitung Sekarang") */
  ctaLabel?: string;
}

// ── Defaults ──
const DEFAULT_DESKTOP_LINKS: SiteNavbarLink[] = [
  { label: "Beranda", href: "/" },
  { label: "Kalkulator", href: "/kalkulator" },
  { label: "Untuk Installer", href: "/partner-installer" },
];

const DEFAULT_DRAWER_LINKS: SiteNavbarDrawerLink[] = [
  { label: "Beranda", href: "/", icon: <HomeIcon className="w-5 h-5" /> },
  { label: "Kalkulator", href: "/kalkulator", icon: <CalculatorIcon className="w-5 h-5" /> },
  {
    label: "Untuk Installer",
    href: "/partner-installer",
    icon: <Wrench className="w-5 h-5" />,
  },
];

// ── Component ──
export function SiteNavbar({
  desktopLinks = DEFAULT_DESKTOP_LINKS,
  drawerLinks = DEFAULT_DRAWER_LINKS,
  ctaHref = "/kalkulator",
  ctaLabel = "Hitung Sekarang",
}: SiteNavbarProps = {}) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Body scroll lock when drawer open
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

  // Esc to close drawer
  React.useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const closeMenu = React.useCallback(() => setMenuOpen(false), []);

  const handleAnchorClick = React.useCallback(
    (e: React.MouseEvent, href: string) => {
      e.preventDefault();
      const id = href.replace(/^#/, "");
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      closeMenu();
    },
    [closeMenu]
  );

  return (
    <>
      <header className="border-b border-border bg-white/85 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            onClick={closeMenu}
            className="flex items-center gap-2 group"
          >
            <img
              src="/solario-icon.png"
              alt=""
              aria-hidden="true"
              className="w-11 h-11 object-contain -ml-1 transition-transform group-hover:rotate-[-4deg] group-hover:scale-105"
            />
            <span className="font-bold text-ink text-lg tracking-tight">
              Solario<span className="text-accent-deep">.id</span>
            </span>
          </Link>

          {/* Desktop nav — md+ only */}
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {desktopLinks.map((link) =>
              link.anchor ? (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleAnchorClick(e, link.href)}
                  className="inline-flex items-center px-3 h-11 rounded-xl text-ink hover:text-primary font-medium"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="inline-flex items-center px-3 h-11 rounded-xl text-ink hover:text-primary font-medium"
                >
                  {link.label}
                </Link>
              )
            )}

            <Link
              href={ctaHref}
              className="ml-1 inline-flex items-center gap-1.5 px-5 h-11 rounded-full bg-accent text-white text-sm font-semibold shadow-[0_8px_18px_-8px_rgba(34,197,94,0.55)] hover:bg-accent-deep hover:shadow-[0_10px_22px_-8px_rgba(34,197,94,0.65)] transition-all"
            >
              {ctaLabel}
              <span aria-hidden>→</span>
            </Link>
          </nav>

          {/* Mobile menu button — below md only */}
          <button
            type="button"
            aria-label="Buka menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="md:hidden inline-flex items-center justify-center w-[44px] h-[44px] rounded-full border border-border text-ink hover:bg-accent-soft hover:border-accent-border transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer backdrop */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-[199] bg-primary-deep/40 backdrop-blur-sm transition-opacity duration-300",
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="flex items-center gap-2">
            <img
              src="/solario-icon.png"
              alt=""
              aria-hidden="true"
              className="w-10 h-10 object-contain -ml-1"
            />
            <span className="font-bold text-ink tracking-tight">
              Solario<span className="text-accent-deep">.id</span>
            </span>
          </span>
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={closeMenu}
            className="w-[44px] h-[44px] inline-flex items-center justify-center rounded-full bg-surface border border-border text-ink hover:bg-accent-soft transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {drawerLinks.map((link, i) => (
            <DrawerLink
              key={link.label}
              link={link}
              open={menuOpen}
              delay={80 + i * 60}
              onClose={closeMenu}
              onAnchorClick={handleAnchorClick}
            />
          ))}
        </nav>

        <div className="px-5 pt-4 pb-6 border-t border-border flex flex-col items-center gap-2">
          <Link
            href={ctaHref}
            onClick={closeMenu}
            className="w-full inline-flex items-center justify-center gap-1.5 h-12 px-6 rounded-full bg-accent text-white font-semibold shadow-[0_10px_22px_-8px_rgba(34,197,94,0.55)] hover:bg-accent-deep transition-colors"
          >
            {ctaLabel} <span aria-hidden>→</span>
          </Link>
          <p className="text-xs text-subtext">Gratis · Tanpa daftar</p>
        </div>
      </aside>
    </>
  );
}

// ── Internal drawer link helper ──
function DrawerLink({
  link,
  open,
  delay,
  onClose,
  onAnchorClick,
}: {
  link: SiteNavbarDrawerLink;
  open: boolean;
  delay: number;
  onClose: () => void;
  onAnchorClick: (e: React.MouseEvent, href: string) => void;
}) {
  const className = cn(
    "flex items-center gap-3.5 px-4 min-h-[48px] rounded-xl text-ink hover:bg-accent-soft hover:text-primary font-medium text-base transition-colors group",
    open
      ? "animate-[drawerItemIn_0.5s_cubic-bezier(0.16,1,0.3,1)_forwards] opacity-0 -translate-x-3"
      : "opacity-100 translate-x-0"
  );
  const inner = (
    <>
      <span className="text-subtext group-hover:text-accent-deep transition-colors">
        {link.icon}
      </span>
      {link.label}
    </>
  );
  if (link.anchor) {
    return (
      <a
        href={link.href}
        onClick={(e) => onAnchorClick(e, link.href)}
        style={{ animationDelay: `${delay}ms` }}
        className={className}
      >
        {inner}
      </a>
    );
  }
  return (
    <Link
      href={link.href}
      onClick={onClose}
      style={{ animationDelay: `${delay}ms` }}
      className={className}
    >
      {inner}
    </Link>
  );
}

// ── Footer (kept here since it's tightly coupled to navbar branding) ──
export function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-16">
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
                Solario<span className="text-accent-deep">.id</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-subtext leading-relaxed max-w-xs">
              Platform netral yang membantu rumah tangga & UKM Indonesia menghitung
              potensi hemat dari solar panel — gratis, akurat, tanpa daftar.
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

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between text-xs text-subtext">
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
  const linkClass =
    "text-sm text-ink hover:text-accent-deep transition-colors";
  // Placeholder href ("#") means the page doesn't exist yet — render as a
  // muted disabled label with a "(soon)" hint rather than a broken link
  // that scrolls the page to top.
  const disabledClass = "text-sm text-subtext/70 cursor-not-allowed select-none";
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-subtext mb-4">
        {title}
      </h4>
      <ul className="space-y-2.5">
        {links.map((l) => {
          const isPlaceholder = l.href === "#";
          const isExternal =
            l.href.startsWith("mailto:") ||
            l.href.startsWith("tel:") ||
            l.href.startsWith("http");
          return (
            <li key={l.label}>
              {isPlaceholder ? (
                <span
                  className={disabledClass}
                  aria-disabled="true"
                  title="Segera hadir"
                >
                  {l.label}{" "}
                  <span className="text-[10px] uppercase tracking-wide text-subtext/60">
                    (soon)
                  </span>
                </span>
              ) : isExternal ? (
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
