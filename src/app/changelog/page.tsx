import { APP_NAME } from "@/lib/constants";
import { InfoLayout } from "@/components/shared/info-layout";
import { Sparkles, TrendingUp, Check } from "@/components/icons";

const ACCENT = "#006bff";

const CATEGORIES = [
  { key: "new", label: "New", icon: Sparkles, color: ACCENT },
  { key: "improved", label: "Improved", icon: TrendingUp, color: "#d97706" },
  { key: "fixed", label: "Fixed", icon: Check, color: "#059669" },
] as const;

export const metadata = {
  title: `Changelog — ${APP_NAME}`,
  description: "What's new in CodeForge AI — release notes and version history.",
};

const RELEASES = [
  {
    version: "1.7.0",
    date: "June 23, 2026",
    tag: "Latest",
    tagColor: "bg-green-500/15 text-green-500 border-green-500/30",
    changes: {
      new: [
        "CodeForge AI now lives on its own domain — codeforgeai.io",
        "Sharper SEO — richer structured data (Organization, web-app and FAQ schema) plus a canonical sitemap for better search visibility",
        "Google Analytics and LangSmith AI tracing for product and AI observability",
      ],
      improved: [
        "Refreshed logo across the whole app — the new fire wordmark on every page",
        "Better dark mode — lifted surface contrast so cards, the dashboard and sidebars stand out instead of blending into a flat black",
        "Feedback now arrives straight to our inbox by email, with a simpler form",
      ],
      fixed: [
        "Sitemap pointed at the preview deployment URL, which Google Search Console rejected — it now uses codeforgeai.io",
        "Landing hero heading and CTA now match across the marketing pages and tests",
      ],
    },
  },
  {
    version: "1.6.0",
    date: "June 23, 2026",
    tag: "Stable",
    tagColor: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    changes: {
      new: [
        "Community hub at /community — one place for the forum, discussions and leaderboard, with live member & discussion counts, recent threads and a top-members list",
        "Horizontal feature slider on the landing page — swipe or click-and-drag through highlights, with a live social-share-card preview embedded in the bento",
        "Mobile bottom navigation — Dashboard, Problems, Challenges, Compiler and a More menu (Roadmaps, Contests) for quick thumb access",
      ],
      improved: [
        "Mobile-friendly landing page — eliminated horizontal overflow from 320px up, full-width hero CTAs, a more compact hero, and tighter section spacing on phones",
        "Redesigned changelog to match the brand theme — card-based releases, blue accent, and clearer New / Improved / Fixed sections",
        "Hidden the scrollbar on the feature slider for a cleaner look",
        "Leaderboard now uses a medal icon to make room for the new Community entry",
      ],
      fixed: [
        "Mobile More menu opening in the top-left corner instead of above the nav bar (invalid CSS calc dropped the positioning)",
        "Hero content getting clipped on narrow phones because the grid column didn't shrink to the viewport",
      ],
    },
  },
  {
    version: "1.5.0",
    date: "June 23, 2026",
    tag: "Stable",
    tagColor: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    changes: {
      new: [
        "Online Compiler — a standalone, blank-canvas editor at /compiler that runs code in any of 12 languages with custom stdin, real stdout/stderr and runtime + memory stats. No problem or test cases required",
        "Compiler is now in the main navigation and surfaced across the landing page (hero, a dedicated feature highlight with a live run preview, and the FAQ)",
      ],
      improved: [
        "New fire app icon — refreshed favicon, PWA icons (192/512 + maskable) and Apple touch icon on the brand-blue mark",
        "Refreshed social share cards — Open Graph and Twitter images now use the new icon and lead with the instant compiler",
        "Landing language strip now shows real brand logos (JavaScript, TypeScript, Python, Java, C, C++, C#, Go, PHP, Rust, Kotlin, Swift) instead of two-letter abbreviations",
        "Project-wide icon system migrated to Font Awesome for a consistent, crisp icon set across every page",
      ],
      fixed: [],
    },
  },
  {
    version: "1.4.0",
    date: "June 22, 2025",
    tag: "Stable",
    tagColor: "bg-blue-500/15 text-blue-500 border-blue-500/30",
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
      {/* header */}
      <div className="mb-12">
        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium tracking-tight" style={{ color: ACCENT }}>
          <span className="size-1.5 rounded-full" style={{ background: ACCENT }} />
          Changelog
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          What&rsquo;s new in {APP_NAME}
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Every release, every fix, every improvement — documented here.
        </p>
      </div>

      <div className="space-y-5">
        {RELEASES.map((release) => (
          <article
            key={release.version}
            className="rounded-2xl border bg-card p-6 shadow-sm sm:p-7"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="font-mono text-lg font-semibold tabular-nums tracking-tight">
                v{release.version}
              </h2>
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${release.tagColor}`}>
                {release.tag}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">{release.date}</span>
            </div>

            <div className="mt-6 space-y-6">
              {CATEGORIES.map(({ key, label, icon: Icon, color }) => {
                const items = release.changes[key];
                if (!items || items.length === 0) return null;
                return (
                  <div key={key}>
                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className="flex size-6 items-center justify-center rounded-md"
                        style={{ background: `${color}1a`, color }}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                        {label}
                      </h3>
                      <span className="text-[11px] text-muted-foreground">{items.length}</span>
                    </div>
                    <ul className="space-y-2 border-l pl-4" style={{ borderColor: `${color}33` }}>
                      {items.map((item) => (
                        <li key={item} className="text-sm leading-relaxed text-muted-foreground">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </InfoLayout>
  );
}
