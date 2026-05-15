"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calculator as CalculatorIcon, Home as HomeIcon, Wrench } from "lucide-react";
import { SiteNavbar } from "@/components/SiteNavbar";

// Marketing-floor fallbacks shown until /api/stats responds.
// Match lib/stats.ts FALLBACK_STATS so server & client align.
type SiteStats = {
  totalKalkulasi: number;
  avgHematPerBulanJt: number;
  activeInstallers: number;
  ratingKepuasan: number;
};
const FALLBACK_STATS: SiteStats = {
  totalKalkulasi: 2400,
  avgHematPerBulanJt: 1.2,
  activeInstallers: 18,
  ratingKepuasan: 4.8,
};

const TESTIMONIALS = [
  {
    quote:
      "Gak nyangka tagihan PLN 2 juta bisa nyusut tinggal 350 ribu. Balik modal lebih cepat dari prediksi.",
    initials: "BS",
    name: "B.S.",
    city: "Jakarta Selatan",
  },
  {
    quote:
      "Awalnya cuma iseng hitung. Tiga hari kemudian sudah survey lokasi. Installer-nya profesional.",
    initials: "SR",
    name: "S.R.",
    city: "Bandung",
  },
  {
    quote:
      "Kalkulatornya jelas, angkanya masuk akal. Dari semua referensi yang saya cek, Solario paling transparan.",
    initials: "AW",
    name: "A.W.",
    city: "Surabaya",
  },
  {
    quote:
      "Bingung mau mulai dari mana, di Solario semua jelas dalam 60 detik. Akhirnya pasang juga setelah 2 tahun mikir.",
    initials: "DK",
    name: "D.K.",
    city: "Yogyakarta",
  },
  {
    quote:
      "Estimasi hematnya pas banget dengan tagihan sekarang. Tahun ke-3 dan masih on track sesuai prediksi.",
    initials: "RM",
    name: "R.M.",
    city: "Medan",
  },
  {
    quote:
      "Pertama kali kalkulator solar yang gak minta email duluan. Refreshing banget, langsung dapat angka.",
    initials: "LH",
    name: "L.H.",
    city: "Tangerang",
  },
  {
    quote:
      "Toko saya pakai sejak 2024, hemat 6 jutaan per bulan. ROI lebih cepat dari beli alat baru.",
    initials: "FP",
    name: "F.P.",
    city: "Semarang",
  },
  {
    quote:
      "Installer-nya rapi, garansi 25 tahun, dan after-sales responsif. Worth setiap rupiahnya.",
    initials: "NS",
    name: "N.S.",
    city: "Denpasar",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [pastHero, setPastHero] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [stats, setStats] = React.useState<SiteStats>(FALLBACK_STATS);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const heroStaggerRef = React.useRef<HTMLDivElement>(null);

  // ── Fetch live stats from /api/stats (ISR-cached server-side) ──
  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d?.success && d?.data) {
          setStats({
            totalKalkulasi: Number(d.data.totalKalkulasi) || FALLBACK_STATS.totalKalkulasi,
            avgHematPerBulanJt:
              Number(d.data.avgHematPerBulanJt) || FALLBACK_STATS.avgHematPerBulanJt,
            activeInstallers:
              Number(d.data.activeInstallers) || FALLBACK_STATS.activeInstallers,
            ratingKepuasan:
              Number(d.data.ratingKepuasan) || FALLBACK_STATS.ratingKepuasan,
          });
        }
      })
      .catch(() => {
        /* keep fallback values on network failure */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Sticky bottom CTA trigger (mobile only — fires past hero) ──
  React.useEffect(() => {
    const onScroll = () => {
      setPastHero(window.scrollY > window.innerHeight * 0.7);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Intersection observer reveal + hero immediate ──
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Hero stagger fires immediately on mount (no scroll trigger needed)
    if (heroStaggerRef.current) heroStaggerRef.current.classList.add("is-visible");

    if (reduced) {
      document
        .querySelectorAll(".solario-landing [data-animate], .solario-landing [data-stagger]")
        .forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    document
      .querySelectorAll<HTMLElement>(".solario-landing [data-animate], .solario-landing [data-stagger]")
      .forEach((el) => {
        if (!el.classList.contains("is-visible")) io.observe(el);
      });

    return () => io.disconnect();
  }, []);

  // ── Counter animations ──
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const formatNum = (n: number, decimals = 0) => {
      if (decimals > 0) return n.toFixed(decimals).replace(".", ",");
      return Math.round(n).toLocaleString("id-ID");
    };

    const animateCount = (el: HTMLElement) => {
      const target = parseFloat(el.dataset.count || "0");
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      const prefix = el.dataset.prefix || "";
      const suffix = el.dataset.suffix || "";
      const dur = 1500;
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = easeOutCubic(p);
        const v = target * eased;
        el.textContent = prefix + formatNum(v, decimals) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = prefix + formatNum(target, decimals) + suffix;
      };
      requestAnimationFrame(step);
    };

    const counters = document.querySelectorAll<HTMLElement>(".solario-landing [data-count]");

    if (reduced) {
      counters.forEach((el) => {
        const target = parseFloat(el.dataset.count || "0");
        const decimals = parseInt(el.dataset.decimals || "0", 10);
        const prefix = el.dataset.prefix || "";
        const suffix = el.dataset.suffix || "";
        el.textContent = prefix + formatNum(target, decimals) + suffix;
      });
      return;
    }

    const countIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target as HTMLElement);
            countIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((c) => countIO.observe(c));
    return () => countIO.disconnect();
  }, []);

  // ── Input formatting ──
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setInputValue("");
      return;
    }
    const n = parseInt(raw, 10);
    setInputValue("Tagihan listrik saya Rp " + n.toLocaleString("id-ID") + " / bulan");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = inputValue.replace(/\D/g, "");
    if (!v || parseInt(v, 10) < 50000) {
      inputRef.current?.focus();
      inputRef.current?.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-6px)" },
          { transform: "translateX(6px)" },
          { transform: "translateX(-3px)" },
          { transform: "translateX(0)" },
        ],
        { duration: 350, easing: "ease-out" }
      );
      return;
    }
    try {
      sessionStorage.setItem("solario.tagihan", v);
    } catch {
      /* ignore */
    }
    router.push(`/kalkulator?tagihan=${v}`);
  };

  const handleAnchorClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="solario-landing">
      {/* ===== NAVBAR (unified SiteNavbar with landing-specific anchor links) ===== */}
      <SiteNavbar
        desktopLinks={[
          { label: "Kalkulator", href: "#calc", anchor: true },
          { label: "Untuk Installer", href: "#installer", anchor: true },
        ]}
        drawerLinks={[
          { label: "Beranda", href: "#top", anchor: true, icon: <HomeIcon className="w-5 h-5" /> },
          { label: "Kalkulator", href: "/kalkulator", icon: <CalculatorIcon className="w-5 h-5" /> },
          { label: "Untuk Installer", href: "/partner-installer", icon: <Wrench className="w-5 h-5" /> },
        ]}
      />

      {/* ===== STICKY MOBILE CTA ===== */}
      <div className={"sl-sticky-cta" + (pastHero ? " is-visible" : "")} aria-hidden={!pastHero}>
        <Link href="/kalkulator" className="sl-btn sl-btn-hero sl-btn-hero-primary sl-sticky-cta-btn">
          Hitung Sekarang <span className="arr">→</span>
        </Link>
      </div>

      {/* ===== HERO ===== */}
      <section className="sl-hero" id="top">
        <div className="sl-hero-preview" aria-hidden="true">
          <span className="sl-hero-preview-glow" />
          <div className="sl-hero-preview-content">
            <div className="sl-hero-preview-eyebrow">
              <span className="sl-hero-preview-dot" />
              Contoh · Tagihan Rp 1,5&nbsp;jt
            </div>
            <p className="sl-hero-preview-num">
              Rp 1,2 jt
              <span className="sl-hero-preview-unit">hemat / bulan</span>
            </p>
            <div className="sl-hero-preview-stats">
              <span>
                Balik modal <b>4,5 tahun</b>
              </span>
              <span className="sl-hero-preview-bullet">·</span>
              <span>
                Sistem <b>3,5 kWp</b>
              </span>
            </div>
          </div>
        </div>
        <div className="sl-hero-inner">
          <div ref={heroStaggerRef} data-stagger className="container">
            <span className="sl-badge">
              <span className="id-pill">ID</span>
              Tools Hemat Listrik #1 Indonesia
            </span>
            <h1 className="sl-h1">
              <span className="line">Tagihan Listrik Mahal?</span>
              <span className="line grad-text">Hitung Hematmu dalam 60 Detik.</span>
            </h1>
            <p className="sl-hero-sub">
              Kalkulator solar gratis, akurat, dan langsung terhubung ke installer terpercaya di kotamu. Tidak perlu daftar.
            </p>
            <div className="sl-hero-ctas">
              <Link href="/kalkulator" className="sl-btn sl-btn-hero sl-btn-hero-primary">
                Hitung Sekarang <span className="arr">→</span>
              </Link>
              <a
                href="#how"
                onClick={(e) => handleAnchorClick(e, "how")}
                className="sl-btn sl-btn-hero sl-btn-hero-outline"
              >
                Lihat Cara Kerja
              </a>
            </div>
            <div className="sl-hero-stats">
              <span>
                <strong>{stats.totalKalkulasi.toLocaleString("id-ID")}+</strong>{" "}
                Kalkulasi
              </span>
              <span className="dot" />
              <span><strong>12</strong> Kota</span>
              <span className="dot" />
              <span>Gratis Selamanya</span>
            </div>
          </div>

          <div className="sl-hero-hills" aria-hidden="true">
            <svg viewBox="0 0 1200 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="hillBack" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#dcfce7" />
                  <stop offset="100%" stopColor="#bbf7d0" />
                </linearGradient>
                <linearGradient id="hillMid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a7f3c2" />
                  <stop offset="100%" stopColor="#6ee7a3" />
                </linearGradient>
                <linearGradient id="hillFront" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
                <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.7" />
                  <stop offset="60%" stopColor="#fde68a" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
                </radialGradient>
                <symbol id="solarPanel" viewBox="0 0 22 16">
                  <path d="M0,5 L10,0 L22,0 L12,5 Z" />
                  <rect x="10.4" y="5" width="1.6" height="11" />
                </symbol>
              </defs>

              {/* Soft sun glow in sky area */}
              <circle cx="950" cy="80" r="180" fill="url(#sunGlow)" />
              <circle cx="950" cy="80" r="32" fill="#fde68a" opacity="0.55" />

              {/* Back hills (furthest, lightest) */}
              <path
                d="M0,400 L0,180 Q150,100 300,140 T600,130 T900,150 T1200,135 L1200,400 Z"
                fill="url(#hillBack)"
              />

              {/* Mid hills */}
              <path
                d="M0,400 L0,250 Q200,185 400,220 T800,225 T1200,215 L1200,400 Z"
                fill="url(#hillMid)"
              />

              {/* Front hills (darkest, closest) */}
              <path
                d="M0,400 L0,310 Q260,270 520,290 T1000,300 T1200,295 L1200,400 Z"
                fill="url(#hillFront)"
                opacity="0.92"
              />

              {/* Solar panel clusters distributed along the front hill */}
              <g fill="#0a3d2e" opacity="0.9">
                {/* Far left cluster */}
                <use href="#solarPanel" x="80" y="288" width="22" height="16" />
                <use href="#solarPanel" x="110" y="287" width="22" height="16" />
                <use href="#solarPanel" x="140" y="289" width="22" height="16" />

                {/* Left cluster */}
                <use href="#solarPanel" x="220" y="286" width="24" height="17" />
                <use href="#solarPanel" x="252" y="284" width="24" height="17" />
                <use href="#solarPanel" x="284" y="286" width="24" height="17" />
                <use href="#solarPanel" x="316" y="288" width="24" height="17" />

                {/* Center cluster (bigger - hero panels) */}
                <use href="#solarPanel" x="490" y="284" width="28" height="20" />
                <use href="#solarPanel" x="526" y="282" width="28" height="20" />
                <use href="#solarPanel" x="562" y="283" width="28" height="20" />
                <use href="#solarPanel" x="598" y="285" width="28" height="20" />
                <use href="#solarPanel" x="634" y="284" width="28" height="20" />
                <use href="#solarPanel" x="670" y="286" width="28" height="20" />

                {/* Right cluster */}
                <use href="#solarPanel" x="820" y="289" width="22" height="16" />
                <use href="#solarPanel" x="850" y="287" width="22" height="16" />
                <use href="#solarPanel" x="880" y="289" width="22" height="16" />
                <use href="#solarPanel" x="910" y="291" width="22" height="16" />

                {/* Far right cluster */}
                <use href="#solarPanel" x="1020" y="290" width="22" height="16" />
                <use href="#solarPanel" x="1050" y="292" width="22" height="16" />
                <use href="#solarPanel" x="1080" y="291" width="22" height="16" />
              </g>

              {/* Subtle trees on back hills for depth */}
              <g fill="#16a34a" opacity="0.35">
                <ellipse cx="180" cy="172" rx="14" ry="22" />
                <ellipse cx="420" cy="158" rx="12" ry="18" />
                <ellipse cx="730" cy="170" rx="13" ry="20" />
                <ellipse cx="1080" cy="160" rx="14" ry="22" />
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="sl-how" id="how">
        <div className="container">
          <div className="sl-section-head" data-animate>
            <span className="eyebrow">Cara Kerja</span>
            <h2>
              <span className="grad-text">Tiga langkah.</span> Satu keputusan yang tepat.
            </h2>
            <p>
              Dari penasaran sampai ketemu installer terpercaya — tanpa form panjang, tanpa daftar, tanpa drama.
            </p>
          </div>
          <div className="sl-how-grid" data-stagger>
            <article className="sl-step">
              <div className="sl-step-num">01</div>
              <div className="sl-step-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="3" width="16" height="18" rx="2" />
                  <line x1="8" y1="8" x2="16" y2="8" />
                  <line x1="8" y1="13" x2="11" y2="13" />
                  <line x1="13" y1="13" x2="16" y2="13" />
                  <line x1="8" y1="17" x2="11" y2="17" />
                </svg>
              </div>
              <h3>Masukkan tagihan listrik</h3>
              <p>Cuma butuh tiga angka: tagihan PLN, kota, dan golongan. Tidak perlu daftar, tidak perlu email.</p>
            </article>

            <article className="sl-step">
              <div className="sl-step-num">02</div>
              <div className="sl-step-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <h3>Lihat hasil instan</h3>
              <p>Hemat bulanan, ukuran sistem, biaya investasi, dan kapan kamu balik modal — semua dalam 60 detik.</p>
            </article>

            <article className="sl-step">
              <div className="sl-step-num">03</div>
              <div className="sl-step-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.72 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0122 16.92z" />
                </svg>
              </div>
              <h3>Terhubung ke installer</h3>
              <p>Kalau tertarik, kami sambungkan ke installer terverifikasi di kotamu. Mereka yang menghubungi kamu.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ===== CALCULATOR CTA ===== */}
      <section className="sl-calc-cta" id="calc" data-animate>
        <div className="container sl-calc-cta-inner">
          <span className="eyebrow">Mulai Sekarang</span>
          <h2>Berapa yang bisa kamu hemat?</h2>
          <p>Masukkan tagihan listrik bulananmu dan lihat hasilnya dalam detik.</p>
          <form className="sl-calc-input-row" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="sl-calc-input"
              placeholder="Tagihan listrik saya Rp ______ / bulan"
              autoComplete="off"
              inputMode="numeric"
              value={inputValue}
              onChange={handleInputChange}
            />
            <button type="submit" className="sl-btn sl-btn-accent">
              Hitung Sekarang <span className="arr">→</span>
            </button>
          </form>
        </div>
      </section>

      {/* ===== SOCIAL PROOF ===== */}
      <section className="sl-proof">
        <div className="container">
          <div className="sl-section-head" data-animate>
            <span className="eyebrow">Dipercaya</span>
            <h2>Ribuan rumah, satu keputusan cerdas.</h2>
          </div>
          <div className="sl-proof-grid" data-stagger>
            <div className="sl-proof-stat">
              <div
                className="val"
                data-count={stats.totalKalkulasi}
                data-suffix="+"
              >
                {stats.totalKalkulasi.toLocaleString("id-ID")}+
              </div>
              <div className="lab">Kalkulasi dilakukan</div>
            </div>
            <div className="sl-proof-stat">
              <div
                className="val"
                data-count={stats.avgHematPerBulanJt}
                data-decimals="1"
                data-prefix="Rp "
                data-suffix=" Jt"
              >
                Rp {stats.avgHematPerBulanJt.toFixed(1).replace(".", ",")} Jt
              </div>
              <div className="lab">Rata-rata hemat per bulan</div>
            </div>
            <div className="sl-proof-stat">
              <div className="val" data-count={stats.activeInstallers}>
                {stats.activeInstallers}
              </div>
              <div className="lab">Partner installer aktif</div>
            </div>
            <div className="sl-proof-stat">
              <div
                className="val"
                data-count={stats.ratingKepuasan}
                data-decimals="1"
                data-suffix="★"
              >
                {stats.ratingKepuasan.toFixed(1).replace(".", ",")}★
              </div>
              <div className="lab">Rating kepuasan</div>
            </div>
          </div>

          <div className="sl-testi-marquee">
            <div className="sl-testi-track">
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                <div
                  key={i}
                  className="sl-testi"
                  aria-hidden={i >= TESTIMONIALS.length}
                >
                  <p className="quote">&ldquo;{t.quote}&rdquo;</p>
                  <div className="who">
                    <div className="avatar">{t.initials}</div>
                    <div>
                      <div className="name">{t.name}</div>
                      <div className="city">{t.city}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== INSTALLER ===== */}
      <section className="sl-installer" id="installer">
        <div className="container">
          <div className="sl-installer-grid">
            <div data-animate>
              <span className="eyebrow">Untuk Installer Solar</span>
              <h2>
                <span className="grad-text">Leads berkualitas.</span> Tanpa effort marketing.
              </h2>
              <p className="lead">
                Kami carikan customer yang sudah lewat kalkulator dan terverifikasi nomor HP-nya. Kamu fokus pasang panel.
              </p>
              <ul className="sl-bullets">
                <li>
                  <span className="check">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  Leads terverifikasi nomor HP via OTP WhatsApp
                </li>
                <li>
                  <span className="check">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  Filter per kota, budget, dan timeline pemasangan
                </li>
                <li>
                  <span className="check">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  Bayar hanya untuk leads valid — bukan retainer bulanan
                </li>
              </ul>
              <Link href="/partner-installer" className="sl-btn sl-btn-outline">
                Daftar sebagai Partner <span className="arr">→</span>
              </Link>
            </div>
            <div data-animate>
              <div className="sl-lead-card">
                <div className="sl-lead-card-head">
                  <div className="sl-lead-card-avatar">BS</div>
                  <div>
                    <div className="sl-lead-card-name">Budi Santoso</div>
                    <div className="sl-lead-card-city">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      Jakarta · 8 menit lalu
                    </div>
                  </div>
                </div>
                <div className="sl-lead-card-rows">
                  <div className="sl-lc-row"><span className="k">Tagihan saat ini</span><span className="v">Rp 2.500.000</span></div>
                  <div className="sl-lc-row"><span className="k">Hemat estimasi</span><span className="v accent">Rp 1.820.000</span></div>
                  <div className="sl-lc-row"><span className="k">Sistem yang cocok</span><span className="v">4,5 kWp</span></div>
                  <div className="sl-lc-row"><span className="k">Budget</span><span className="v">Rp 30–50 jt</span></div>
                  <div className="sl-lc-row"><span className="k">Timeline</span><span className="v">1–3 bulan</span></div>
                </div>
                <div className="sl-lc-verified">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Nomor WhatsApp verified
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="sl-footer">
        <div className="container">
          <div className="sl-footer-grid">
            <div>
              <a href="#top" onClick={(e) => handleAnchorClick(e, "top")} className="sl-footer-brand" aria-label="Solario.id">
                <img src="/solario-logo.png" alt="Solario.id" className="sl-footer-logo-img" />
              </a>
              <p className="sl-footer-tagline">
                Membuat keputusan solar lebih mudah untuk semua orang Indonesia.
              </p>
            </div>
            <div className="sl-footer-col">
              <h4>Produk</h4>
              <ul>
                <li><Link href="/kalkulator">Kalkulator</Link></li>
                <li><Link href="/partner-installer">Untuk Installer</Link></li>
                <li>
                  <a href="#how" onClick={(e) => handleAnchorClick(e, "how")}>Cara Kerja</a>
                </li>
              </ul>
            </div>
            <div className="sl-footer-col">
              <h4>Perusahaan</h4>
              <ul>
                <li><Link href="/tentang">Tentang</Link></li>
                <li><a href="mailto:halo@solario.id">Kontak</a></li>
              </ul>
            </div>
          </div>
          <div className="sl-footer-bottom">
            <span>© {new Date().getFullYear()} Solario.id · Jakarta, Indonesia</span>
            <span>Tarif PLN 2024 · PSH NASA POWER</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
