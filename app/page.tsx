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
  const [submitting, setSubmitting] = React.useState(false);
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
    if (submitting) return;
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
    setSubmitting(true);
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

            {/* Desktop-only floating preview tiles (Apple-style mini-cards) */}
            <div className="sl-hero-tiles" aria-hidden="true">
              <div className="sl-tile sl-tile-result">
                <div className="sl-tile-glow" />
                <div className="sl-tile-head">
                  <span className="sl-tile-dot" />
                  <span>Contoh · Tagihan Rp 1,5 jt</span>
                </div>
                <div className="sl-tile-num">
                  Rp 1,2 jt
                  <span className="sl-tile-unit">hemat / bulan</span>
                </div>
                <div className="sl-tile-meta">
                  <span>Balik modal <b>4,5 tahun</b></span>
                  <span className="sl-tile-bullet">·</span>
                  <span>Sistem <b>3,5 kWp</b></span>
                </div>
              </div>

              <div className="sl-tile sl-tile-chart">
                <div className="sl-tile-eyebrow">Proyeksi 25 tahun</div>
                <svg viewBox="0 0 200 80" preserveAspectRatio="none" className="sl-tile-chart-svg">
                  <defs>
                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,76 L0,68 Q20,60 40,52 T80,40 T120,28 T160,16 T200,6 L200,76 Z" fill="url(#chartFill)" />
                  <path d="M0,68 Q20,60 40,52 T80,40 T120,28 T160,16 T200,6" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
                  <line x1="0" y1="48" x2="200" y2="48" stroke="#dc2626" strokeWidth="1.4" strokeDasharray="4 3" opacity="0.7" />
                  <circle cx="92" cy="36" r="3.5" fill="#fff" stroke="#16a34a" strokeWidth="2" />
                </svg>
                <div className="sl-tile-meta">
                  <span>BEP <b>4,5 thn</b></span>
                  <span className="sl-tile-bullet">·</span>
                  <span>Total hemat <b>Rp 540 jt</b></span>
                </div>
              </div>

              <div className="sl-tile sl-tile-lead">
                <div className="sl-tile-lead-badge">LIVE</div>
                <div className="sl-tile-lead-row">
                  <div className="sl-tile-lead-avatar">BS</div>
                  <div>
                    <div className="sl-tile-lead-name">Budi · Jakarta</div>
                    <div className="sl-tile-lead-sub">Hemat est. Rp 1,8 jt/bln</div>
                  </div>
                </div>
                <div className="sl-tile-lead-verified">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  WhatsApp verified
                </div>
              </div>
            </div>
          </div>

          <div className="sl-hero-hills" aria-hidden="true">
            <svg viewBox="0 0 1200 480" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="60%" stopColor="#fefce8" />
                  <stop offset="100%" stopColor="#ecfdf5" />
                </linearGradient>
                <linearGradient id="hillFar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d1fae5" />
                  <stop offset="100%" stopColor="#a7f3d0" />
                </linearGradient>
                <linearGradient id="hillMid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#86efac" />
                  <stop offset="100%" stopColor="#4ade80" />
                </linearGradient>
                <linearGradient id="hillFront" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#15803d" />
                </linearGradient>
                <linearGradient id="hillFloor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#166534" />
                  <stop offset="100%" stopColor="#0d3b2e" />
                </linearGradient>
                <radialGradient id="sunHalo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.95" />
                  <stop offset="40%" stopColor="#fde68a" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="sunCore" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="100%" stopColor="#facc15" stopOpacity="0.6" />
                </radialGradient>
                <linearGradient id="panelGloss" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id="rayGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fde68a" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
                </linearGradient>
                <symbol id="pine" viewBox="0 0 20 36">
                  <path d="M10 0 L18 14 L13 14 L20 26 L13 26 L20 36 L0 36 L7 26 L0 26 L7 14 L2 14 Z" />
                </symbol>
                <symbol id="panel" viewBox="0 0 28 18">
                  <path d="M2 16 L8 2 L26 2 L20 16 Z" fill="url(#panelGloss)" />
                  <path d="M8 2 L26 2 L20 16 L2 16 Z" fill="none" stroke="#22c55e" strokeWidth="0.4" strokeOpacity="0.4" />
                  <line x1="11" y1="2" x2="5" y2="16" stroke="#22c55e" strokeWidth="0.3" strokeOpacity="0.55" />
                  <line x1="14" y1="2" x2="8" y2="16" stroke="#22c55e" strokeWidth="0.3" strokeOpacity="0.55" />
                  <line x1="17" y1="2" x2="11" y2="16" stroke="#22c55e" strokeWidth="0.3" strokeOpacity="0.55" />
                  <line x1="20" y1="2" x2="14" y2="16" stroke="#22c55e" strokeWidth="0.3" strokeOpacity="0.55" />
                  <line x1="23" y1="2" x2="17" y2="16" stroke="#22c55e" strokeWidth="0.3" strokeOpacity="0.55" />
                  <line x1="8" y1="9" x2="23" y2="9" stroke="#22c55e" strokeWidth="0.3" strokeOpacity="0.55" />
                  <rect x="12" y="16" width="3" height="2" fill="#0f172a" />
                </symbol>
              </defs>

              {/* Sky gradient backdrop */}
              <rect x="0" y="0" width="1200" height="480" fill="url(#sky)" />

              {/* Sun rays — soft vertical glow */}
              <ellipse cx="920" cy="180" rx="160" ry="280" fill="url(#rayGlow)" />

              {/* Sun halo + core */}
              <circle cx="920" cy="120" r="220" fill="url(#sunHalo)" />
              <circle cx="920" cy="120" r="58" fill="url(#sunCore)" />
              <circle cx="920" cy="120" r="34" fill="#fef9c3" opacity="0.85" />

              {/* Soft clouds */}
              <g fill="#ffffff" opacity="0.7">
                <ellipse cx="180" cy="100" rx="68" ry="14" />
                <ellipse cx="220" cy="92" rx="40" ry="10" />
                <ellipse cx="560" cy="70" rx="52" ry="11" />
                <ellipse cx="1080" cy="140" rx="56" ry="13" />
                <ellipse cx="1110" cy="132" rx="34" ry="9" />
              </g>

              {/* Birds */}
              <g fill="none" stroke="#0d3b2e" strokeWidth="1.6" strokeLinecap="round" opacity="0.55">
                <path d="M380 150 Q386 144 392 150 Q398 144 404 150" />
                <path d="M420 168 Q424 164 428 168 Q432 164 436 168" />
                <path d="M700 130 Q706 124 712 130 Q718 124 724 130" />
              </g>

              {/* Far hills */}
              <path
                d="M0,480 L0,260 Q120,210 250,235 Q380,255 520,225 Q660,200 820,230 Q960,255 1080,225 Q1140,212 1200,235 L1200,480 Z"
                fill="url(#hillFar)"
                opacity="0.85"
              />

              {/* Far-hill pines (small, faded) */}
              <g fill="#10b981" opacity="0.45">
                <use href="#pine" x="160" y="218" width="10" height="18" />
                <use href="#pine" x="190" y="222" width="10" height="18" />
                <use href="#pine" x="430" y="208" width="10" height="18" />
                <use href="#pine" x="460" y="212" width="10" height="18" />
                <use href="#pine" x="730" y="216" width="11" height="20" />
                <use href="#pine" x="1040" y="210" width="10" height="18" />
                <use href="#pine" x="1070" y="214" width="10" height="18" />
              </g>

              {/* Mid hills */}
              <path
                d="M0,480 L0,330 Q160,280 320,308 Q480,332 640,302 Q800,275 960,310 Q1080,335 1200,308 L1200,480 Z"
                fill="url(#hillMid)"
              />

              {/* Mid-hill pines (medium) */}
              <g fill="#15803d" opacity="0.7">
                <use href="#pine" x="100" y="294" width="13" height="24" />
                <use href="#pine" x="132" y="298" width="13" height="24" />
                <use href="#pine" x="270" y="290" width="14" height="26" />
                <use href="#pine" x="296" y="294" width="13" height="24" />
                <use href="#pine" x="320" y="296" width="13" height="24" />
                <use href="#pine" x="580" y="282" width="14" height="26" />
                <use href="#pine" x="608" y="286" width="13" height="24" />
                <use href="#pine" x="860" y="288" width="13" height="24" />
                <use href="#pine" x="890" y="292" width="13" height="24" />
                <use href="#pine" x="1110" y="296" width="13" height="24" />
              </g>

              {/* Front hill */}
              <path
                d="M0,480 L0,390 Q200,355 400,380 Q560,400 760,378 Q940,358 1200,390 L1200,480 Z"
                fill="url(#hillFront)"
              />

              {/* Solar farm — grid array on front hill */}
              <g>
                {/* Cluster 1 (left) */}
                {Array.from({ length: 3 }).map((_, row) =>
                  Array.from({ length: 5 }).map((_, col) => (
                    <use
                      key={`a-${row}-${col}`}
                      href="#panel"
                      x={120 + col * 30 + row * 4}
                      y={384 + row * 12}
                      width="26"
                      height="16"
                    />
                  ))
                )}
                {/* Cluster 2 (center, hero) */}
                {Array.from({ length: 4 }).map((_, row) =>
                  Array.from({ length: 7 }).map((_, col) => (
                    <use
                      key={`b-${row}-${col}`}
                      href="#panel"
                      x={470 + col * 32 + row * 5}
                      y={376 + row * 13}
                      width="28"
                      height="18"
                    />
                  ))
                )}
                {/* Cluster 3 (right) */}
                {Array.from({ length: 3 }).map((_, row) =>
                  Array.from({ length: 5 }).map((_, col) => (
                    <use
                      key={`c-${row}-${col}`}
                      href="#panel"
                      x={930 + col * 30 + row * 4}
                      y={388 + row * 12}
                      width="26"
                      height="16"
                    />
                  ))
                )}
              </g>

              {/* Foreground (dark green strip + grass texture) */}
              <path
                d="M0,480 L0,448 Q300,432 600,442 Q900,452 1200,438 L1200,480 Z"
                fill="url(#hillFloor)"
              />
              {/* Subtle grass blades */}
              <g stroke="#22c55e" strokeWidth="1" strokeLinecap="round" opacity="0.4">
                {Array.from({ length: 24 }).map((_, i) => {
                  const x = 30 + i * 48;
                  const h = 5 + (i % 3) * 2;
                  return <line key={`g-${i}`} x1={x} y1="462" x2={x} y2={462 - h} />;
                })}
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
              disabled={submitting}
            />
            <button
              type="submit"
              className="sl-btn sl-btn-accent"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Memuat kalkulator…
                </>
              ) : (
                <>
                  Hitung Sekarang <span className="arr">→</span>
                </>
              )}
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
