/**
 * Shared constants/types for site stats. Lives in its own thin module
 * with NO Prisma import so client components (e.g. app/page.tsx with
 * "use client") can import these without pulling Prisma into the
 * client bundle.
 */

export interface SiteStats {
  totalKalkulasi: number;
  avgHematPerBulanJt: number; // dalam juta rupiah (e.g., 1.2)
  activeInstallers: number;
  ratingKepuasan: number; // 0-5 scale
}

// Marketing-floor fallbacks for new sites with low data.
// Once real numbers exceed these, real numbers are used.
export const FALLBACK_STATS: SiteStats = {
  totalKalkulasi: 2400,
  avgHematPerBulanJt: 1.2,
  activeInstallers: 18,
  ratingKepuasan: 4.8,
};

export const STATS_CACHE_TAG = "site-stats";
export const STATS_CACHE_REVALIDATE_SECONDS = 60;
