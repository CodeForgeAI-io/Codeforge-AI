import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/auth", // Supabase OAuth callback (/auth/callback)
  "/api/auth", // /api/auth/me (session for the client shim)
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
  "/blog", // public blog (pages + /api/blog/cover image route)
  "/api/blog",
  "/careers", // public careers pages
  "/api/careers", // public apply endpoint
  "/feedback",
  "/api/feedback",
  "/api/newsletter", // one-click unsubscribe link from newsletter emails
  "/beta",
  "/api/beta",
  "/api/subscription/webhook", // Razorpay webhook — verified by signature, no session
  "/.well-known", // security.txt and other public well-known resources
  "/_next",
  "/favicon",
  "/sitemap.xml",
  "/robots.txt",
  "/llms.txt",
  "/ads.txt",
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
  const appUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (appUrl && origin === new URL(appUrl).origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return false;
}

/** Reject API request bodies larger than this (defense against memory-exhaustion fuzzing). */
const MAX_BODY_BYTES = 1_000_000; // 1 MB

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  const isMutatingApi =
    pathname.startsWith("/api/") &&
    (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE");

  // ── Payload-size guard ─────────────────────────────────────────────────────
  if (isMutatingApi) {
    const cap = pathname === "/api/careers/upload" ? 4_500_000 : MAX_BODY_BYTES;
    const len = Number(req.headers.get("content-length") ?? "0");
    if (Number.isFinite(len) && len > cap) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
  }

  // ── CORS guard for mutating API requests ───────────────────────────────────
  if (isMutatingApi && !pathname.startsWith("/api/auth")) {
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // ── Supabase session (also refreshes the auth cookies) ─────────────────────
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims as { sub?: string; app_metadata?: { role?: string } } | undefined;
  const isAuthed = Boolean(claims?.sub);
  const role = claims?.app_metadata?.role ?? "user";

  // ── Public routes ───────────────────────────────────────────────────────────
  if (pathname === "/" || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (isAuthed && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return res;
  }

  // ── Require auth ────────────────────────────────────────────────────────────
  if (!isAuthed) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Admin-only areas ────────────────────────────────────────────────────────
  const isAdminArea =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/docs") ||
    pathname.startsWith("/api/docs") ||
    pathname.startsWith("/api-docs") ||
    pathname.startsWith("/api/openapi");
  if (isAdminArea && role !== "admin") {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
