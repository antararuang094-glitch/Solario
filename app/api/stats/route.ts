import { NextResponse } from "next/server";
import { getSiteStats } from "@/lib/stats";

// ISR: cache served response for 60 seconds (matches lib/stats.ts cache)
export const revalidate = 60;

export async function GET() {
  try {
    const data = await getSiteStats();
    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          // Vercel CDN: cache 60s, serve stale for up to 5 min while revalidating
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("[GET /api/stats]", err);
    return NextResponse.json(
      { success: false, error: "Gagal memuat statistik" },
      { status: 500 }
    );
  }
}
