import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Lightweight CSRF mitigation: only accept logout from a same-origin
  // browser context. Cross-site form-triggered logouts (annoying but not
  // catastrophic) are rejected. JSON-typed fetch from our own UI always
  // sends `Sec-Fetch-Site: same-origin`.
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    cookies().delete(SESSION_COOKIE_NAME);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/admin/logout]", err);
    return NextResponse.json({ error: "Gagal logout" }, { status: 500 });
  }
}
