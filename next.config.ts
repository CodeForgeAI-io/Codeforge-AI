import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Content-Security-Policy
// 'unsafe-inline' required for Next.js inline styles/scripts and analytics
// 'unsafe-eval' only in dev (Next.js hot reload uses eval)
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.clarity.ms`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://api.groq.com https://vitals.vercel-insights.com",
  "media-src 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
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
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["nodemailer"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // Prevent caching of auth-related API responses
      {
        source: "/api/auth/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
    ];
  },
};

export default nextConfig;
