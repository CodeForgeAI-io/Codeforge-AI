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
  "/about",
  "/contact",
  "/help",
  "/feedback",
  "/api/feedback",
  "/beta",
  "/api/beta",
  "/api/subscription/webhook", // Razorpay webhook — verified by signature, no session
  "/.well-known", // security.txt and other public well-known resources
  "/_next",
  "/favicon",
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.webmanifest", // PWA manifest
  "/sw.js", // PWA service worker
  "/offline.html", // PWA offline fallback
  "/opengraph-image", // social share image (crawlers, no auth)
  "/twitter-image",
  "/icon", // metadata icon route
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

/** Reject API request bodies larger than this (defense against memory-exhaustion fuzzing). */
const MAX_BODY_BYTES = 1_000_000; // 1 MB

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const method = req.method;

  const isMutatingApi =
    pathname.startsWith("/api/") &&
    (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE");

  // ── Payload-size guard ───────────────────────────────────────────────────
  if (isMutatingApi) {
    const len = Number(req.headers.get("content-length") ?? "0");
    if (Number.isFinite(len) && len > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
  }

  // ── CORS guard for mutating API requests ─────────────────────────────────
  if (isMutatingApi && !pathname.startsWith("/api/auth")) {
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
