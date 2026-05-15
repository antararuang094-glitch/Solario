import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

export interface SiteStats {
  totalKalkulasi: number;
  avgHematPerBulanJt: number; // dalam juta rupiah (e.g., 1.2)
  activeInstallers: number;
  ratingKepuasan: number; // 0-5 scale
}

// Marketing-floor fallbacks for new sites with low data.
// Once real numbers exceed these, real numbers are used.
const FALLBACK_STATS: SiteStats = {
  totalKalkulasi: 2400,
  avgHematPerBulanJt: 1.2,
  activeInstallers: 18,
  ratingKepuasan: 4.8,
};

const CACHE_TAG = "site-stats";
const CACHE_REVALIDATE_SECONDS = 60;

/**
 * Returns aggregated site stats with 60s ISR caching.
 *
 * - Reads from DB once per minute (cached by Next.js)
 * - Bust cache by calling revalidateTag("site-stats") after lead/installer changes
 * - Falls back to marketing floor values on DB error (graceful degradation)
 * - Returns max(real, floor) so dynamic numbers only show when they beat the floor
 */
export const getSiteStats = unstable_cache(
  async (): Promise<SiteStats> => {
    try {
      const [totalLeads, avgAgg, activeInstallers] = await Promise.all([
        prisma.lead.count(),
        prisma.lead.aggregate({ _avg: { estimasiHemat: true } }),
        prisma.installer.count({ where: { status: "Aktif" } }),
      ]);

      const realAvgHematJt =
        (avgAgg._avg.estimasiHemat ?? 0) / 1_000_000;

      return {
        totalKalkulasi: Math.max(totalLeads, FALLBACK_STATS.totalKalkulasi),
        avgHematPerBulanJt: Math.max(
          Number(realAvgHematJt.toFixed(1)),
          FALLBACK_STATS.avgHematPerBulanJt
        ),
        activeInstallers: Math.max(
          activeInstallers,
          FALLBACK_STATS.activeInstallers
        ),
        ratingKepuasan: FALLBACK_STATS.ratingKepuasan, // no rating system yet
      };
    } catch (err) {
      console.error("[stats] Failed to load site stats, using fallbacks:", err);
      return FALLBACK_STATS;
    }
  },
  ["site-stats-v1"],
  {
    revalidate: CACHE_REVALIDATE_SECONDS,
    tags: [CACHE_TAG],
  }
);

export { FALLBACK_STATS, CACHE_TAG };
