import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

/**
 * Auth gate for the admin surface.
 *
 *   /admin/dashboard/*   → page navigations: redirect unauthenticated
 *                          users to the login screen.
 *   /api/admin/*          → API calls (excluding the login + logout
 *                          handlers themselves, which the matcher
 *                          excludes via the `:path*` rule below):
 *                          return 401 JSON so callers can react.
 *
 * This is defense-in-depth on top of the in-route `isAdminSession()`
 * checks; if a handler ever ships without that guard the middleware
 * will still keep it locked.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (pathname.startsWith("/admin/dashboard")) {
    if (!session.valid) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    // The login + logout endpoints must remain reachable without a session.
    if (
      pathname === "/api/admin/login" ||
      pathname === "/api/admin/logout"
    ) {
      return NextResponse.next();
    }
    if (!session.valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*", "/api/admin/:path*"],
};
