import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/api/auth",
  "/profile", // public profiles
  "/problems", // browsing problems is public; solving requires auth
  "/api/questions", // public question listing/search APIs
  "/api/discussions", // public discussion listing/reading
  "/forum", // public forum — posting/commenting requires auth (handled in page)
  "/pricing", // public pricing page
  "/forgot-password",
  "/reset-password",
  "/terms",
  "/privacy",
  "/changelog",
  "/feedback",
  "/api/feedback",
  "/beta",
  "/api/beta",
  "/_next",
  "/favicon",
  "/sitemap.xml",
  "/robots.txt",
];

/** Allowed origins for cross-origin API requests (empty = same-origin only). */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin requests don't send Origin
  const appUrl =
    process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (appUrl && origin === new URL(appUrl).origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return false;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const method = req.method;

  // ── CORS guard for mutating API requests ─────────────────────────────────
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth") &&
    (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE")
  ) {
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // ── Public routes ─────────────────────────────────────────────────────────
  if (pathname === "/" || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (session && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // ── Require auth ──────────────────────────────────────────────────────────
  if (!session) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Admin-only areas ──────────────────────────────────────────────────────
  const isAdminArea =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/docs") ||
    pathname.startsWith("/api/docs");
  if (isAdminArea && session.user.role !== "admin") {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
