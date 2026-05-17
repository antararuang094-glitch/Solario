import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import {
  FALLBACK_STATS,
  STATS_CACHE_TAG,
  STATS_CACHE_REVALIDATE_SECONDS,
  type SiteStats,
} from "./stats-constants";

/**
 * Returns aggregated site stats with 60s ISR caching.
 *
 * - Reads from DB once per minute (cached by Next.js)
 * - Bust cache by calling revalidateTag(CACHE_TAG) after lead/installer changes
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

      const realAvgHematJt = (avgAgg._avg.estimasiHemat ?? 0) / 1_000_000;

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
    revalidate: STATS_CACHE_REVALIDATE_SECONDS,
    tags: [STATS_CACHE_TAG],
  }
);

// Re-export for callers that prefer importing from lib/stats
export { FALLBACK_STATS, STATS_CACHE_TAG as CACHE_TAG, type SiteStats };
