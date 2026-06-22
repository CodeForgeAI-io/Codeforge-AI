import { APP_NAME } from "@/lib/constants";
import { InfoLayout } from "@/components/shared/info-layout";

export const metadata = {
  title: `Changelog — ${APP_NAME}`,
  description: "What's new in CodeForge AI — release notes and version history.",
};

const RELEASES = [
  {
    version: "1.4.0",
    date: "June 22, 2025",
    tag: "Latest",
    tagColor: "bg-green-500/15 text-green-500 border-green-500/30",
    changes: {
      new: [
        "Brand-new landing page — layered product mockups, animated accent cards, a bento feature grid with live UI previews, and an AI chat preview",
        "Light / dark theme toggle now everywhere the new design reaches",
      ],
      improved: [
        "Full visual redesign on the Geist design system — neutral surfaces, blue focus rings, refined typography, tighter radii, and consistent spacing across every page",
        "New blue app icon, favicon and PWA icons replacing the orange mark",
        "Cleaner auth screens and a redesigned beta/join page",
      ],
      fixed: [
        "Removed every leftover orange accent across the app in favor of the new blue/amber palette",
      ],
    },
  },
  {
    version: "1.3.0",
    date: "June 21, 2025",
    tag: "Stable",
    tagColor: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    changes: {
      new: [
        "Installable app (PWA) — add CodeForge AI to your desktop or mobile home screen, with app icons and an offline fallback page",
        "PostHog product analytics — pageviews, events, and session insights",
        "PostHog error tracking — client and server-side exceptions are captured automatically",
        "PostHog server-side logs via OpenTelemetry",
        "Vercel Speed Insights — real-user performance metrics",
        "Light / dark theme toggle in the landing page header",
      ],
      improved: [
        "Much faster landing page — the hero now paints immediately instead of waiting for animations to load, fixing slow First/Largest Contentful Paint",
        "Hardened Content-Security-Policy to safely allow analytics, the Monaco editor CDN, and session replay",
      ],
      fixed: [
        "Code editor (Monaco) failing to load in production due to a Content-Security-Policy block",
        "Google Analytics and Microsoft Clarity beacons blocked by Content-Security-Policy",
      ],
    },
  },
  {
    version: "1.2.0",
    date: "June 18, 2025",
    tag: "Stable",
    tagColor: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    changes: {
      new: [
        "GitHub authentication — sign in with your GitHub account; the button appears automatically once OAuth is configured",
        "Feedback now opens a GitHub issue — submissions from /feedback create a labelled issue in the repository, with email kept as a fallback",
      ],
      improved: [],
      fixed: [],
    },
  },
  {
    version: "1.1.1",
    date: "June 18, 2025",
    tag: "Stable",
    tagColor: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    changes: {
      new: [],
      improved: [
        "Forgot-password now fails gracefully — if the email can't be sent it returns a clear message and logs the real reason instead of an opaque 500 error",
        "Site URL for SEO, robots.txt, and sitemap.xml now resolves correctly in production instead of pointing at localhost",
        "Rewrote the README with a modern layout, the full feature set, the Setups Works logo, and a release history",
      ],
      fixed: [
        "Production build no longer crashes while prerendering /robots.txt and /sitemap.xml when the database is unreachable — both routes now render dynamically at request time",
        "Site config loading is resilient to a missing database connection and falls back to environment configuration",
      ],
    },
  },
  {
    version: "1.1.0",
    date: "June 17, 2025",
    tag: "Stable",
    tagColor: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    changes: {
      new: [
        "Admin Settings panel — configure SEO, Analytics, Email, AI, Code Runner, Database, Cache, OAuth, and Payments from the UI without touching .env files",
        "Google Analytics (GA4) integration — Measurement ID configurable from admin",
        "Microsoft Clarity integration — project ID configurable from admin",
        "Google Search Console verification meta tag — set verification code from admin",
        "Feedback page at /feedback — users can submit Feature Requests, Bug Reports, and Issues; emails delivered to info@setups.works",
        "Shared header + footer across all info pages (Terms, Privacy, Changelog, Feedback)",
        "GitHub repository link in footer, replacing X and YouTube icons",
        "Sitemap at /sitemap.xml — auto-generated with all static routes + every problem slug",
        "Robots.txt at /robots.txt — blocks admin/dashboard/API from indexing",
      ],
      improved: [
        "Advanced SEO: full Open Graph, Twitter Card, canonical URL, robots directives, and JSON-LD structured data (WebSite + Organization schema) on every page",
        "SEO metadata now reads from Admin Settings DB with env var fallback — change site name, description, keywords, OG image without a redeploy",
        "Test Connection buttons in admin for every service: SMTP (sends real email), Groq, MongoDB, Redis, Judge0, Piston, Paiza, Razorpay",
        "Footer Legal column now includes Feedback link",
      ],
      fixed: [
        "Build errors: unused lucide imports, unescaped JSX entities in Terms/Privacy pages",
        "Login Internal Server Error — rememberMe field caused NextAuth authorize() to always fail when schema required boolean",
        "Zod v4 literal errorMap renamed to message",
      ],
    },
  },
  {
    version: "1.0.1",
    date: "June 17, 2025",
    tag: "Security",
    tagColor: "bg-red-500/15 text-red-500 border-red-500/30",
    changes: {
      new: [],
      improved: [
        "Content-Security-Policy header added — restricts script/style/img/connect sources, blocks frame-ancestors, disallows object-src hijacking",
        "Strict-Transport-Security (HSTS) — 2-year max-age with includeSubDomains and preload",
        "X-Frame-Options upgraded to DENY (was SAMEORIGIN)",
        "Auth cookies: explicit httpOnly, secure, sameSite=lax; __Secure-/__Host- prefixes in production",
        "JWT session lifetime reduced from 30 days to 7 days",
        "CORS origin guard on all mutating API requests (POST/PUT/PATCH/DELETE)",
        "NoSQL regex injection fix: all $regex search queries now escape metacharacters",
        "Server-side user content sanitization: null bytes, javascript: URIs, inline event handlers stripped before DB write",
        "Password strength rule added: must contain uppercase, number, or symbol",
        "Cache-Control: no-store on /api/auth/* responses",
      ],
      fixed: [],
    },
  },
  {
    version: "1.0.0",
    date: "June 17, 2025",
    tag: "Launch",
    tagColor: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    changes: {
      new: [
        "Launched CodeForge AI — AI-powered coding interview prep platform",
        "VS Code-style Monaco editor with full 12-language support: JavaScript, TypeScript, Python, Java, C, C++, C#, Go, PHP, Rust, Kotlin, Swift",
        "AI Mentor with progressive hints and complexity analysis",
        "AI Pair Programmer with real-time streaming suggestions",
        "AI Learning Coach with personalised study plans",
        "Spaced repetition (SM-2 algorithm) for problem reviews",
        "Skill analytics with mastery map and weakness detection",
        "Daily streaks, XP, badges, and leaderboard",
        "Weekly contests and daily challenges",
        "Company-specific question sets (Google, Meta, Amazon, Microsoft, Netflix, Uber)",
        "Community forum and discussion threads",
        "Frontend sandbox challenges with AI design review",
        "Roadmaps and study plans",
        "Google and GitHub OAuth sign-in",
        "Forgot password / reset password flow with branded email",
        "Fully responsive landing page with dark and light mode",
        "Terms & Conditions, Privacy Policy, and Changelog pages",
        "Terms & Privacy checkbox on sign-up form",
        "Remember me (30 days) checkbox on sign-in form",
        "Version badge and Legal footer column",
      ],
      improved: [
        "Code editor now shows all 12 languages regardless of per-question starter code — falls back to language default snippet",
        "Smooth 900 ms anchor navigation on landing page",
        "Landing page initial load faster — heavy components lazy-loaded",
      ],
      fixed: [],
    },
  },
  {
    version: "0.9.0",
    date: "June 10, 2025",
    tag: "Beta",
    tagColor: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    changes: {
      new: [
        "Beta launch with core problem-solving features",
        "JavaScript and Python code execution via secure sandbox",
        "Basic user profiles and submission history",
        "Initial AI hint integration",
      ],
      improved: [],
      fixed: [
        "Fixed session handling for OAuth sign-in edge cases",
        "Resolved code editor layout on mobile viewports",
      ],
    },
  },
  {
    version: "0.5.0",
    date: "May 20, 2025",
    tag: "Alpha",
    tagColor: "bg-purple-500/15 text-purple-500 border-purple-500/30",
    changes: {
      new: [
        "Private alpha release to early testers",
        "Core problem listing and detail pages",
        "Email + password authentication",
        "Basic code submission and verdict display",
      ],
      improved: [],
      fixed: [],
    },
  },
];

export default function ChangelogPage() {
  return (
    <InfoLayout>
      <div className="mb-12">
        <h1 className="text-3xl font-black tracking-tight">Changelog</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every release, every fix, every improvement — documented here.
        </p>
      </div>

        <div className="relative space-y-12">
          {/* Vertical timeline line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

          {RELEASES.map((release) => (
            <div key={release.version} className="relative pl-8">
              {/* Timeline dot */}
              <div className="absolute left-0 top-1.5 size-3.5 rounded-full border-2 border-primary bg-background" />

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h2 className="text-xl font-black">v{release.version}</h2>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${release.tagColor}`}>
                  {release.tag}
                </span>
                <span className="text-xs text-muted-foreground">{release.date}</span>
              </div>

              <div className="space-y-5">
                {release.changes.new.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-green-500">
                      ✦ New
                    </h3>
                    <ul className="space-y-1.5">
                      {release.changes.new.map((item) => (
                        <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                          <span className="mt-0.5 shrink-0 text-green-500">+</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {release.changes.improved.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-500">
                      ↑ Improved
                    </h3>
                    <ul className="space-y-1.5">
                      {release.changes.improved.map((item) => (
                        <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                          <span className="mt-0.5 shrink-0 text-blue-500">~</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {release.changes.fixed.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">
                      ✗ Fixed
                    </h3>
                    <ul className="space-y-1.5">
                      {release.changes.fixed.map((item) => (
                        <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                          <span className="mt-0.5 shrink-0 text-blue-600">×</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

    </InfoLayout>
  );
}
