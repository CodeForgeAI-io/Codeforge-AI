import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Content-Security-Policy
// 'unsafe-inline' required for Next.js inline styles/scripts and analytics
// 'unsafe-eval' only in dev (Next.js hot reload uses eval)
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' blob:${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.clarity.ms https://us-assets.i.posthog.com https://cdn.jsdelivr.net https://checkout.razorpay.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
  "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://api.groq.com https://vitals.vercel-insights.com https://va.vercel-scripts.com https://us.i.posthog.com https://us-assets.i.posthog.com https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://*.clarity.ms https://cdn.jsdelivr.net https://*.razorpay.com https://lumberjack.razorpay.com https://blob.vercel-storage.com https://*.public.blob.vercel-storage.com https://*.private.blob.vercel-storage.com",
  "worker-src 'self' blob:",
  "media-src 'self'",
  "object-src 'none'",
  // Razorpay Checkout renders inside an iframe — allow only its domains.
  "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
  // We still refuse to BE framed (clickjacking) regardless of the above.
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://api.razorpay.com",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  // Prevent clickjacking (also covered by frame-ancestors in CSP)
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer policy
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // HSTS — enforce HTTPS for 2 years, include subdomains, allow preloading
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Disable browser features not needed by the app
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(), display-capture=(self), payment=(self), usb=()",
  },
  // Content Security Policy
  { key: "Content-Security-Policy", value: CSP },
  // Prevent IE compatibility mode
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Isolate our browsing context (mitigates XS-Leaks / tab-nabbing) while still
  // allowing the Razorpay checkout popup to open.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  // Block legacy Flash/PDF cross-domain policy probing.
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
];

const noStore = [
  { key: "Cache-Control", value: "no-store, max-age=0" },
  { key: "Pragma", value: "no-cache" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Don't advertise the framework/version to scanners.
  poweredByHeader: false,
  serverExternalPackages: ["nodemailer"],
  // Strip console.* (keep error/warn) from production client bundles.
  compiler: {
    removeConsole: isDev ? false : { exclude: ["error", "warn"] },
  },
  experimental: {
    // Rewrite barrel imports to direct paths so only the icons/charts/helpers
    // actually used ship to the client — big win for Font Awesome especially.
    optimizePackageImports: [
      "@fortawesome/free-solid-svg-icons",
      "@fortawesome/free-brands-svg-icons",
      "@fortawesome/free-regular-svg-icons",
      "recharts",
      "date-fns",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // Never let a proxy/CDN cache sensitive responses (auth, money, admin).
      { source: "/api/auth/(.*)", headers: noStore },
      { source: "/api/billing/(.*)", headers: noStore },
      { source: "/api/subscription/(.*)", headers: noStore },
      { source: "/api/admin/(.*)", headers: noStore },
    ];
  },
};

export default nextConfig;
