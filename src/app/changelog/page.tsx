import Link from "next/link";
import { APP_NAME, APP_VERSION } from "@/lib/constants";

export const metadata = {
  title: `Changelog — ${APP_NAME}`,
  description: "What's new in CodeForge AI — release notes and version history.",
};

const RELEASES = [
  {
    version: "1.0.0",
    date: "June 17, 2025",
    tag: "Latest",
    tagColor: "bg-green-500/15 text-green-500 border-green-500/30",
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
    tagColor: "bg-orange-500/15 text-orange-500 border-orange-500/30",
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
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="text-sm font-bold text-primary">
            {APP_NAME}
          </Link>
          <span className="text-xs text-muted-foreground">v{APP_VERSION}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16">
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
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-orange-500">
                      ✗ Fixed
                    </h3>
                    <ul className="space-y-1.5">
                      {release.changes.fixed.map((item) => (
                        <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                          <span className="mt-0.5 shrink-0 text-orange-500">×</span>
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

        <div className="mt-16 flex gap-4 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          <Link href="/" className="hover:text-primary transition-colors">Back to home</Link>
        </div>
      </main>
    </div>
  );
}
