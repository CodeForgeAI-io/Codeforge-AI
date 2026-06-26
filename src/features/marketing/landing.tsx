"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  animate,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  Brain,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code2,
  FileText,
  Flame,
  GraduationCap,
  Map,
  Menu,
  Sparkles,
  Star,
  Terminal,
  Trophy,
  Users,
  X,
  Zap,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
const PricingCards = dynamic(
  () => import("@/features/subscription/pricing-cards").then((m) => m.PricingCards),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 animate-pulse rounded-xl border border-black/[0.08] bg-neutral-50 dark:border-white/[0.08] dark:bg-neutral-900" />
    ),
  },
);
import { APP_NAME, APP_VERSION, LANGUAGES } from "@/lib/constants";
import { FAQS } from "./faqs";
import {
  SiJavascript,
  SiTypescript,
  SiPython,
  SiOpenjdk,
  SiC,
  SiCplusplus,
  SiSharp,
  SiGo,
  SiPhp,
  SiRust,
  SiKotlin,
  SiSwift,
} from "react-icons/si";
import type { IconType } from "react-icons";
import { FaLinkedin, FaInstagram } from "react-icons/fa6";
import { cn } from "@/lib/utils";

/** Brand logos for the language strip, keyed by LANGUAGES id. */
const LANG_ICONS: Record<string, IconType> = {
  javascript: SiJavascript,
  typescript: SiTypescript,
  python: SiPython,
  java: SiOpenjdk,
  c: SiC,
  cpp: SiCplusplus,
  csharp: SiSharp,
  go: SiGo,
  php: SiPhp,
  rust: SiRust,
  kotlin: SiKotlin,
  swift: SiSwift,
};

export interface LandingProblem {
  slug: string;
  title: string;
  difficulty: string;
  category: string;
  acceptanceRate: number | null;
}

/* ── design tokens (Geist) ────────────────────────────────────────── */
const ACCENT = "#006bff";
const card =
  "rounded-xl border border-black/[0.08] bg-white dark:border-white/[0.10] dark:bg-neutral-900";
const ink = "text-neutral-900 dark:text-neutral-50";
const ink2 = "text-neutral-600 dark:text-neutral-300";
const ink3 = "text-neutral-500 dark:text-neutral-400";
const border = "border-black/[0.08] dark:border-white/[0.10]";
const socialLink = cn(
  "inline-flex size-9 items-center justify-center rounded-md border transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
  border,
  ink3,
);

const SOCIALS = [
  { label: "GitHub", href: "https://github.com/CodeForgeAI-io/Codeforge-AI", Icon: null },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/codeforge-ai/", Icon: FaLinkedin },
  { label: "Instagram", href: "https://www.instagram.com/codeforgeai.io/", Icon: FaInstagram },
] as const;

/* ── data ─────────────────────────────────────────────────────────── */

const NAV = [
  ["Problems", "/problems"],
  ["Compiler", "#compiler"],
  ["Features", "#features"],
  ["AI Suite", "#ai"],
  ["Pricing", "#pricing"],
  ["Forum", "/forum"],
] as const;

const STATS = [
  { value: 500, suffix: "+", label: "Problems solved daily" },
  { value: 12, suffix: "", label: "Languages supported" },
  { value: 9, suffix: "", label: "AI-powered tools" },
  { value: 27, suffix: "+", label: "Platform features" },
];

const COMPANY_LOGOS = ["Google", "Meta", "Amazon", "Microsoft", "Netflix", "Uber", "Atlassian", "Apple"];

const AI_TOOLS = [
  { icon: GraduationCap, label: "Learning Coach", desc: "Personalized guidance for your weak areas" },
  { icon: Users, label: "Pair Programmer", desc: "Conversational, real-time coding help" },
  { icon: Map, label: "Roadmap Generator", desc: "A study path toward your target role" },
  { icon: FileText, label: "Resume Analyzer", desc: "Feedback tuned to engineering roles" },
  { icon: Code2, label: "Code Reviewer", desc: "Correctness, style and edge cases" },
  { icon: BarChart3, label: "Complexity Visualizer", desc: "Big-O for any snippet, explained" },
];

const TESTIMONIALS = [
  { name: "Priya S.", role: "SDE @ FAANG", avatar: "P", quote: "The AI mentor is the closest thing to a senior engineer next to you. Finally internalized sliding window." },
  { name: "Marcus T.", role: "Frontend Engineer", avatar: "M", quote: "Every other platform ignores frontend folks. The sandbox challenges with AI design review are exactly what I needed." },
  { name: "Aditi R.", role: "CS Student", avatar: "A", quote: "94-day streak and counting — went from failing easies to clearing mediums in one sitting." },
  { name: "Rohan K.", role: "Backend Dev → SDE-2", avatar: "R", quote: "Pair Programmer plus spaced repetition changed how I retain algorithms. Stopped forgetting patterns." },
  { name: "Sara M.", role: "Final Year Student", avatar: "S", quote: "Generated my entire 8-week study plan in 30 seconds. It even accounted for my weak topics." },
  { name: "James L.", role: "Senior SDE", avatar: "J", quote: "Weakness detection put my graph acceptance at 20%. Three weeks later it's 85%. Data-driven practice works." },
];

// FAQs live in ./faqs so the home page can also emit FAQPage JSON-LD (SEO).

const STEPS = [
  { n: "01", title: "Create your free account", body: "Sign up with email, Google or GitHub. Pick your track: DSA, Frontend, or both. Takes 30 seconds." },
  { n: "02", title: "Solve, practice, and learn", body: "Code in a full editor. The AI mentor gives hints. Spaced repetition locks in patterns." },
  { n: "03", title: "Level up and get hired", body: "Earn XP, keep streaks, climb leaderboards, and walk into any interview prepared." },
];

const FOOTER_COLS = [
  { heading: "Platform", links: [{ label: "Problems", href: "/problems" }, { label: "Challenges", href: "/challenges" }, { label: "Contests", href: "/contests" }, { label: "Roadmaps", href: "/roadmaps" }, { label: "Leaderboard", href: "/leaderboard" }] },
  { heading: "AI Tools", links: [{ label: "Learning Coach", href: "/ai-tools" }, { label: "Pair Programmer", href: "/ai-tools" }, { label: "Study Planner", href: "/ai-tools" }, { label: "Resume Analyzer", href: "/ai-tools" }] },
  { heading: "Community", links: [{ label: "Forum", href: "/forum" }, { label: "Discussions", href: "/discuss" }, { label: "Notes", href: "/notes" }, { label: "Company Prep", href: "/companies" }] },
  { heading: "Legal", links: [{ label: "Terms", href: "/terms" }, { label: "Privacy", href: "/privacy" }, { label: "Changelog", href: "/changelog" }, { label: "Feedback", href: "/feedback" }] },
];

/* ── helpers ──────────────────────────────────────────────────────── */

function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay, ease: [0.175, 0.885, 0.32, 1.1] }}
    >
      {children}
    </motion.div>
  );
}

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) { setDisplay(value); return; }
    const controls = animate(0, value, { duration: 1.2, ease: "easeOut", onUpdate: (v) => setDisplay(Math.round(v)) });
    return () => controls.stop();
  }, [inView, value, reduce]);
  return <span ref={ref}>{display}{suffix}</span>;
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium tracking-tight" style={{ color: ACCENT }}>
      <span className="size-1.5 rounded-full" style={{ background: ACCENT }} />
      {children}
    </span>
  );
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: ReactNode; sub?: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className={cn("mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl", ink)}>{title}</h2>
      {sub && <p className={cn("mt-3 text-base sm:text-lg", ink3)}>{sub}</p>}
    </Reveal>
  );
}

function slowScrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const target = el.getBoundingClientRect().top + window.scrollY - 64;
  window.scrollTo({ top: target, behavior: "smooth" });
}

/* ── reusable mock visuals (the "images") ─────────────────────────── */

function EditorMock() {
  return (
    <div className={cn("overflow-hidden rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)]", card)}>
      <div className={cn("flex items-center gap-1.5 border-b px-4 py-3", border)}>
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className={cn("ml-2 font-mono text-xs", ink3)}>solution.py</span>
        <span className="ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `${ACCENT}14`, color: ACCENT }}>AI</span>
      </div>
      <pre className={cn("overflow-x-auto p-4 font-mono text-[11.5px] leading-relaxed sm:p-5 sm:text-[12.5px]", ink2)}>
{`def maxProfit(prices):
    min_price = float("inf")
    max_profit = 0
    for price in prices:
        min_price = min(min_price, price)
        max_profit = max(max_profit, price - min_price)
    return max_profit`}
      </pre>
      <div className={cn("flex items-center gap-2 border-t px-5 py-3 text-xs", border, ink3)}>
        <Check className="size-4" style={{ color: ACCENT }} />
        12/12 test cases passed · 48 ms · beats 97%
      </div>
    </div>
  );
}

function FloatChip({ className, children, delay = 0 }: { className?: string; children: ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn("absolute hidden items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium shadow-[0_8px_30px_rgba(0,0,0,0.10)] lg:flex", card, ink, className)}
      animate={reduce ? undefined : { y: [0, -6, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
    >
      {children}
    </motion.div>
  );
}

function CompilerMock() {
  return (
    <div className={cn("overflow-hidden rounded-xl", card)}>
      <div className={cn("flex items-center gap-1.5 border-b px-4 py-3", border)}>
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className={cn("ml-2 font-mono text-xs", ink3)}>main.py</span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium text-white" style={{ background: ACCENT }}>
          Run ▶
        </span>
      </div>
      <pre className={cn("overflow-x-auto px-5 py-4 font-mono text-[12.5px] leading-relaxed", ink2)}>
{`name = input()
print(f"Hello, {name}!")
for i in range(3):
    print(i * i)`}
      </pre>
      <div className={cn("flex items-center gap-2 border-t px-5 py-2 font-mono text-[11px]", border, ink3)}>
        <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ background: `${ACCENT}14`, color: ACCENT }}>stdin</span>
        Ada
      </div>
      <div className="bg-neutral-950 px-5 py-3 font-mono text-[12px] leading-relaxed text-neutral-300">
        <div className="text-neutral-500">{"// output"}</div>
        <div>Hello, Ada!</div>
        <div>0</div>
        <div>1</div>
        <div>4</div>
      </div>
      <div className={cn("flex items-center gap-2 border-t px-5 py-2.5 text-xs", border, ink3)}>
        <span className="size-1.5 rounded-full bg-[#28c840]" />
        exited 0 · 14 ms · 9.2 MB
      </div>
    </div>
  );
}

/** Fixed-width snap card for the horizontal feature slider. */
function Slide({ children }: { children: ReactNode }) {
  return (
    <div data-card className="w-[280px] shrink-0 snap-start sm:w-[340px]">
      {children}
    </div>
  );
}

/** Horizontal scroll-snap slider with prev/next controls and edge fades. */
function CardSlider({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  const nudge = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    const cardEl = el.querySelector<HTMLElement>("[data-card]");
    const amount = cardEl ? cardEl.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  // Click-and-drag to scroll (desktop). Touch keeps native momentum scrolling.
  const drag = useRef({ active: false, startX: 0, startScroll: 0 });
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    drag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft };
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const el = ref.current;
    if (!el) return;
    el.scrollLeft = drag.current.startScroll - (e.clientX - drag.current.startX);
  };
  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    try {
      ref.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
  };

  const arrowBtn =
    "flex size-9 items-center justify-center rounded-full border transition-colors enabled:hover:bg-black/[0.04] dark:enabled:hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div>
      <div className="mb-4 flex justify-end gap-2">
        <button type="button" aria-label="Previous features" onClick={() => nudge(-1)} disabled={!canPrev} className={cn(arrowBtn, border, ink2)}>
          <ChevronLeft className="size-4" />
        </button>
        <button type="button" aria-label="Next features" onClick={() => nudge(1)} disabled={!canNext} className={cn(arrowBtn, border, ink2)}>
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div
        ref={ref}
        onScroll={update}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        className="no-scrollbar flex cursor-grab snap-x snap-mandatory select-none gap-4 overflow-x-auto pb-2 active:cursor-grabbing [-webkit-overflow-scrolling:touch] [&_img]:pointer-events-none"
      >
        {children}
      </div>
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────────────── */

export function Landing({ signedIn, problems, totalProblems, featuresByPlan, paymentsEnabled }: { signedIn: boolean; problems: LandingProblem[]; totalProblems: number; featuresByPlan?: Record<"free" | "go" | "plus", { text: string; included: boolean }[]>; paymentsEnabled?: boolean }) {
  const ctaHref = signedIn ? "/dashboard" : "/register";
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const navClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute("href") ?? "";
    if (href.startsWith("#")) {
      e.preventDefault();
      slowScrollTo(href.slice(1));
      setMobileMenu(false);
    }
  }, []);

  const primaryBtn = "h-10 rounded-md bg-neutral-900 px-4 text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200";

  return (
    <div className={cn("min-h-screen bg-white antialiased dark:bg-neutral-950", ink)}>
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className={cn("sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl dark:bg-neutral-950/80", border)}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className={cn("hidden items-center gap-7 text-sm md:flex", ink2)}>
            {NAV.map(([label, href]) => (
              <a key={label} href={href} onClick={navClick} className="transition-colors hover:text-neutral-900 dark:hover:text-white">
                {label}
                {label === "Problems" && totalProblems > 0 && (
                  <span
  className={cn(
    "ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
    ink3,
    "bg-[#3b82f6]/15 dark:bg-[#3b82f6]/25"
  )}
>
  {totalProblems}
</span>
                )}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="hidden min-[360px]:inline-flex">
              <ThemeToggle />
            </span>
            {signedIn ? (
              <Button asChild size="sm" className={cn(primaryBtn, "px-3 sm:px-4")}>
                <Link href="/dashboard">Dashboard <ArrowRight className="size-4" /></Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className={cn("hidden sm:inline-flex h-10 rounded-md px-3", ink2)}>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm" className={cn(primaryBtn, "px-3 sm:px-4")}>
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
            <button className={cn("md:hidden", ink2)} onClick={() => setMobileMenu(!mobileMenu)} aria-label="Menu">
              {mobileMenu ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={cn("overflow-hidden border-t md:hidden", border)}
            >
              <nav className="flex flex-col gap-1 px-4 py-3">
                {NAV.map(([label, href]) => (
                  <a key={label} href={href} onClick={navClick} className={cn("rounded-md px-3 py-2.5 text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.06]", ink2)}>{label}</a>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* decorative backdrop: dotted grid + soft blue glow */}
          <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(0,107,255,0.10),transparent)]" />

          <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 py-10 sm:gap-12 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:py-28">
            <div>
              <div className={cn("inline-flex max-w-full items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-[12px] backdrop-blur sm:text-[13px] dark:bg-neutral-900/70", border, ink2)}>
                <Sparkles className="size-3.5 shrink-0" style={{ color: ACCENT }} />
                <span className="truncate">27+ features · 9 AI tools · 100% free</span>
              </div>
              <h1 className={cn("mt-5 text-balance text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] sm:mt-6 sm:text-5xl sm:leading-[1.07] sm:tracking-[-0.04em] lg:text-6xl", ink)}>
                Master coding interviews with{" "}
                <span style={{ color: ACCENT }}>AI.</span>
              </h1>
              <p className={cn("mt-4 max-w-lg text-pretty text-base leading-relaxed sm:mt-5 sm:text-lg", ink3)}>
                <strong>CodeForge AI</strong> is the all-in-one platform that combines LeetCode-style problems, an online compiler, AI pair programming, spaced repetition and skill analytics — all free.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Button asChild size="lg" className={cn(primaryBtn, "h-11 w-full px-5 text-base sm:w-auto")}>
                  <Link href={ctaHref}>Start for Free <ArrowRight className="size-4" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className={cn("h-11 w-full rounded-md px-5 text-base sm:w-auto", border, ink2)}>
                  <Link href="/compiler">Try the Compiler</Link>
                </Button>
              </div>
              <p className={cn("mt-4 text-sm", ink3)}>
                Just need a scratchpad?{" "}
                <Link href="/compiler" className="font-medium underline-offset-4 hover:underline" style={{ color: ACCENT }}>
                  Run code instantly in the Compiler →
                </Link>
              </p>
              <div className={cn("mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm", ink3)}>
                {["No credit card", "12 languages", "Instant compiler", "9 AI tools"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <Check className="size-4" style={{ color: ACCENT }} /> {item}
                  </span>
                ))}
              </div>
            </div>

            {/* layered product mock + floating chips */}
            <div className="relative">
              <EditorMock />
              <FloatChip className="-left-4 -top-5" delay={0.2}>
                <Flame className="size-4" style={{ color: ACCENT }} /> 94-day streak
              </FloatChip>
              <FloatChip className="-bottom-5 -right-3" delay={1}>
                <Trophy className="size-4" style={{ color: ACCENT }} /> Top 3% rank
              </FloatChip>
              <FloatChip className="-right-6 top-1/3" delay={1.6}>
                <Bot className="size-4" style={{ color: ACCENT }} /> AI hint ready
              </FloatChip>
            </div>
          </div>

          {/* language strip */}
          <div className={cn("relative border-t", border)}>
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 px-4 py-5 sm:px-6">
              {LANGUAGES.slice(0, 12).map((lang) => {
                const Icon = LANG_ICONS[lang.id];
                return (
                  <span key={lang.id} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium", border, ink3)}>
                    {Icon ? (
                      <Icon className="size-3.5" style={{ color: ACCENT }} aria-hidden />
                    ) : (
                      <span className={cn("font-mono text-[10px]")} style={{ color: ACCENT }}>{lang.extension.replace(".", "").slice(0, 2).toUpperCase()}</span>
                    )}
                    {lang.label}
                  </span>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── COMPANY TRUST ────────────────────────────────────────── */}
        <section className={cn("border-b py-12", border)}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className={cn("mb-7 text-center text-[13px]", ink3)}>Engineers at world-class companies practice here</p>
            <div className={cn("flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm font-medium", ink3)}>
              {COMPANY_LOGOS.map((name) => (
                <span key={name} className="transition-colors hover:text-neutral-900 dark:hover:text-white">{name}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS ────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {STATS.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.05} className={cn("p-6 text-center", card)}>
                <p className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl" style={{ color: ACCENT }}>
                  <CountUp value={stat.value} suffix={stat.suffix} />
                </p>
                <p className={cn("mt-2 text-sm", ink3)}>{stat.label}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── FEATURES BENTO ───────────────────────────────────────── */}
        <section id="features" className={cn("border-t py-14 sm:py-24", border)}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHead eyebrow="Features" title={<>27+ features. Zero paywalls.</>} sub="One platform for algorithms, the instant compiler, AI tools, community and analytics. Swipe through the highlights." />
            <div className="mt-12">
              <CardSlider>
                {/* editor */}
                <Slide>
                  <div className={cn("flex h-full flex-col p-6", card)}>
                    <Code2 className="size-5" style={{ color: ACCENT }} />
                    <h3 className={cn("mt-4 text-base font-semibold tracking-tight", ink)}>VS Code–style editor</h3>
                    <p className={cn("mt-2 text-sm leading-relaxed", ink3)}>Full IntelliSense, Vim mode, 12 languages, hidden test cases and instant verdicts — zero config.</p>
                    <div className={cn("mt-5 overflow-hidden rounded-lg border", border)}>
                      <div className={cn("flex items-center gap-1.5 border-b px-3 py-2", border)}>
                        <span className="size-2 rounded-full bg-[#ff5f57]" /><span className="size-2 rounded-full bg-[#febc2e]" /><span className="size-2 rounded-full bg-[#28c840]" />
                        <span className={cn("ml-1 font-mono text-[10px]", ink3)}>two_sum.ts</span>
                      </div>
                      <pre className={cn("overflow-x-auto p-3 font-mono text-[11px] leading-relaxed", ink2)}>
{`const seen = new Map<number, number>();
for (let i = 0; i < nums.length; i++) {
  const need = target - nums[i];
  if (seen.has(need)) return [seen.get(need)!, i];
  seen.set(nums[i], i);
}`}
                      </pre>
                    </div>
                  </div>
                </Slide>

                {/* AI mentor chat */}
                <Slide>
                  <div className={cn("flex h-full flex-col p-6", card)}>
                    <Bot className="size-5" style={{ color: ACCENT }} />
                    <h3 className={cn("mt-4 text-base font-semibold tracking-tight", ink)}>AI Mentor</h3>
                    <p className={cn("mt-2 text-sm leading-relaxed", ink3)}>Progressive hints that never spoil the answer.</p>
                    <div className="mt-4 space-y-2">
                      <div className={cn("ml-6 rounded-lg px-3 py-2 text-xs", ink)} style={{ background: `${ACCENT}12` }}>Why is this O(n²)?</div>
                      <div className={cn("mr-4 rounded-lg border px-3 py-2 text-xs", border, ink2)}>Use a hash map to look up complements in O(1) → O(n). ✓</div>
                    </div>
                  </div>
                </Slide>

                {/* streak heatmap */}
                <Slide>
                  <div className={cn("flex h-full flex-col p-6", card)}>
                    <Flame className="size-5" style={{ color: ACCENT }} />
                    <h3 className={cn("mt-4 text-base font-semibold tracking-tight", ink)}>Streaks &amp; gamification</h3>
                    <p className={cn("mt-2 text-sm leading-relaxed", ink3)}>XP, levels and badges keep daily practice consistent.</p>
                    <div className="mt-4 grid grid-cols-12 gap-1">
                      {Array.from({ length: 36 }).map((_, i) => {
                        const on = [2,3,4,7,8,9,10,13,14,16,17,18,21,22,23,24,27,28,30,31,32,33].includes(i);
                        return (
                          <span
                            key={i}
                            className={cn("aspect-square rounded-[3px]", !on && "bg-black/[0.06] dark:bg-white/[0.08]")}
                            style={on ? { background: ACCENT } : undefined}
                          />
                        );
                      })}
                    </div>
                  </div>
                </Slide>

                {/* analytics */}
                <Slide>
                  <div className={cn("flex h-full flex-col p-6", card)}>
                    <BarChart3 className="size-5" style={{ color: ACCENT }} />
                    <h3 className={cn("mt-4 text-base font-semibold tracking-tight", ink)}>Skill analytics</h3>
                    <p className={cn("mt-2 text-sm leading-relaxed", ink3)}>See exactly where to focus next.</p>
                    <div className="mt-4 space-y-2">
                      {[["Arrays", 91], ["Strings", 78], ["DP", 34], ["Graphs", 19]].map(([t, v]) => (
                        <div key={t as string}>
                          <div className={cn("mb-1 flex justify-between text-[11px]", ink3)}><span>{t}</span><span>{v as number}%</span></div>
                          <div className={cn("h-1.5 overflow-hidden rounded-full", "bg-black/[0.06] dark:bg-white/[0.08]")}>
                            <div className="h-full rounded-full" style={{ width: `${v}%`, background: ACCENT }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Slide>

                {/* spaced repetition */}
                <Slide>
                  <div className={cn("flex h-full flex-col p-6", card)}>
                    <Brain className="size-5" style={{ color: ACCENT }} />
                    <h3 className={cn("mt-4 text-base font-semibold tracking-tight", ink)}>Spaced repetition</h3>
                    <p className={cn("mt-2 text-sm leading-relaxed", ink3)}>SM-2 resurfaces problems at the perfect moment.</p>
                    <div className="mt-4 space-y-1.5">
                      {[["Two Sum", "Today"], ["Binary Search", "Day 6"], ["Merge K Lists", "Day 14"]].map(([t, d], i) => (
                        <div key={t} className={cn("flex items-center justify-between text-xs", ink3)}>
                          <span>{t}</span>
                          <span style={i === 0 ? { color: ACCENT, fontWeight: 500 } : undefined}>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Slide>

                {/* social share card — live OG image */}
                <Slide>
                  <div className={cn("flex h-full flex-col p-6", card)}>
                    <Sparkles className="size-5" style={{ color: ACCENT }} />
                    <h3 className={cn("mt-4 text-base font-semibold tracking-tight", ink)}>Share-ready by default</h3>
                    <p className={cn("mt-2 text-sm leading-relaxed", ink3)}>Every link unfurls into a branded Open Graph &amp; Twitter card.</p>
                    <div className={cn("mt-4 overflow-hidden rounded-lg border", border)}>
                      <div className={cn("flex items-center gap-1.5 border-b px-3 py-2", border)}>
                        <span className="size-2 rounded-full bg-[#ff5f57]" /><span className="size-2 rounded-full bg-[#febc2e]" /><span className="size-2 rounded-full bg-[#28c840]" />
                        <span className={cn("ml-1 font-mono text-[10px]", ink3)}>og:image</span>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/opengraph-image" alt="CodeForge AI social share card" loading="lazy" className="block aspect-[1200/630] w-full object-cover" />
                    </div>
                  </div>
                </Slide>
              </CardSlider>
            </div>

            {/* compiler — full-width highlight */}
            <Reveal delay={0.05} className="mt-4">
              <div id="compiler" className={cn("grid grid-cols-1 scroll-mt-20 gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:items-center", card)}>
                <div>
                  <span className={cn("flex size-9 items-center justify-center rounded-md border", border)} style={{ background: `${ACCENT}0d` }}>
                    <Terminal className="size-4.5" style={{ color: ACCENT }} />
                  </span>
                  <h3 className={cn("mt-4 text-xl font-semibold tracking-tight sm:text-2xl", ink)}>Instant online compiler</h3>
                  <p className={cn("mt-2 max-w-md text-sm leading-relaxed", ink3)}>
                    Skip the boilerplate. Open a blank editor, paste code in any of 12 languages, pipe in custom stdin, and run it in a secure cloud sandbox — no problem, no test cases, no local setup.
                  </p>
                  <div className={cn("mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm", ink3)}>
                    {["12 languages", "Custom stdin", "Real stdout & stderr", "Runtime + memory stats"].map((item) => (
                      <span key={item} className="flex items-center gap-1.5">
                        <Check className="size-4" style={{ color: ACCENT }} /> {item}
                      </span>
                    ))}
                  </div>
                  <Button asChild size="lg" className={cn(primaryBtn, "mt-7 h-11 px-5")}>
                    <Link href="/compiler">Open the Compiler <ArrowRight className="size-4" /></Link>
                  </Button>
                </div>
                <CompilerMock />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── AI SUITE ─────────────────────────────────────────────── */}
        <section id="ai" className={cn("border-t py-14 sm:py-24", border)}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHead eyebrow="AI Suite" title={<>9 AI tools. One platform.</>} sub="From personalized coaching to pair programming — AI is woven into every part of your practice." />
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {AI_TOOLS.map((tool, i) => (
                <Reveal key={tool.label} delay={(i % 3) * 0.05}>
                  <div className={cn("group flex h-full flex-col p-6 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/60", card)}>
                    <span className={cn("flex size-9 items-center justify-center rounded-md border", border)} style={{ background: `${ACCENT}0d` }}>
                      <tool.icon className="size-4.5" style={{ color: ACCENT }} />
                    </span>
                    <h3 className={cn("mt-4 text-sm font-semibold", ink)}>{tool.label}</h3>
                    <p className={cn("mt-1.5 text-sm leading-relaxed", ink3)}>{tool.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
        <section className={cn("border-t py-14 sm:py-24", border)}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHead eyebrow="How it works" title={<>From zero to offer in three steps</>} />
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <Reveal key={step.n} delay={i * 0.07}>
                  <div className={cn("h-full p-7", card)}>
                    <span className="inline-flex size-9 items-center justify-center rounded-lg font-mono text-sm font-semibold" style={{ background: `${ACCENT}12`, color: ACCENT }}>{step.n}</span>
                    <h3 className={cn("mt-4 text-lg font-semibold tracking-tight", ink)}>{step.title}</h3>
                    <p className={cn("mt-2 text-sm leading-relaxed", ink3)}>{step.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROBLEMS PREVIEW ─────────────────────────────────────── */}
        {problems.length > 0 && (
          <section className={cn("border-t py-14 sm:py-24", border)}>
            <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.3fr]">
              <Reveal>
                <Eyebrow>Problem bank</Eyebrow>
                <h2 className={cn("mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl", ink)}>
                  {totalProblems}+ real interview questions, ready to run.
                </h2>
                <p className={cn("mt-4", ink3)}>DSA classics, JavaScript deep-dives and React pattern exercises — every problem executes against hidden test cases in the cloud.</p>
                <Button asChild size="lg" className={cn(primaryBtn, "mt-7 h-11 px-5")}>
                  <Link href="/problems">Browse All Problems <ArrowRight className="size-4" /></Link>
                </Button>
              </Reveal>
              <Reveal delay={0.05} className={cn("overflow-hidden rounded-xl", card)}>
                {problems.map((problem, index) => (
                  <Link
                    key={problem.slug}
                    href={`/problems/${problem.slug}`}
                    className={cn("group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60", index !== 0 && "border-t", border)}
                  >
                    <span className={cn("font-mono text-xs tabular-nums", ink3)}>{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm font-medium", ink)}>{problem.title}</p>
                      <p className={cn("text-xs", ink3)}>{problem.category}</p>
                    </div>
                    <DifficultyBadge difficulty={problem.difficulty} />
                    <ArrowUpRight className={cn("size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5", ink3)} />
                  </Link>
                ))}
              </Reveal>
            </div>
          </section>
        )}

        {/* ── TESTIMONIALS ─────────────────────────────────────────── */}
        <section className={cn("border-t py-14 sm:py-24", border)}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHead eyebrow="Testimonials" title={<>Loved by thousands of coders</>} />
            <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <Reveal key={t.name} delay={(i % 3) * 0.05}>
                  <figure className={cn("flex h-full flex-col p-6", card)}>
                    <div className="mb-3 flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, s) => <Star key={s} className="size-3.5" style={{ fill: ACCENT, color: ACCENT }} />)}
                    </div>
                    <blockquote className={cn("flex-1 text-sm leading-relaxed", ink2)}>“{t.quote}”</blockquote>
                    <figcaption className={cn("mt-5 flex items-center gap-3 border-t pt-4", border)}>
                      <span className="flex size-9 items-center justify-center rounded-full text-sm font-medium text-white" style={{ background: ACCENT }}>{t.avatar}</span>
                      <span>
                        <span className={cn("block text-sm font-medium", ink)}>{t.name}</span>
                        <span className={cn("block text-xs", ink3)}>{t.role}</span>
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ──────────────────────────────────────────────── */}
        <section id="pricing" className={cn("border-t py-14 sm:py-24", border)}>
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <SectionHead eyebrow="Pricing" title={<>Start free, level up fast.</>} sub="7-day free trial on all paid plans. No credit card required." />
            <Reveal delay={0.1} className="mt-12">
              <PricingCards featuresByPlan={featuresByPlan} paymentsEnabled={paymentsEnabled} />
            </Reveal>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <section id="faq" className={cn("border-t py-14 sm:py-24", border)}>
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHead eyebrow="FAQ" title="Frequently asked" />
            <div className="mt-12 space-y-2">
              {FAQS.map((faq, i) => (
                <div key={faq.q} className={cn("overflow-hidden rounded-xl border", border)}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className={cn("flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-medium", ink)}
                  >
                    {faq.q}
                    <ChevronDown className={cn("size-4 shrink-0 transition-transform", ink3, openFaq === i && "rotate-180")} />
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <p className={cn("border-t px-5 py-4 text-sm leading-relaxed", border, ink3)}>{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────────────── */}
        <section className={cn("border-t py-14 sm:py-24", border)}>
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <Reveal className="relative overflow-hidden rounded-2xl border px-5 py-12 text-center sm:px-12 sm:py-16" >
              <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)]" />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(0,107,255,0.12),transparent)]" />
              <div className={cn("absolute inset-0 -z-10 rounded-2xl", card)} />
              <div className="relative">
                <span className="inline-flex size-12 items-center justify-center rounded-xl" style={{ background: `${ACCENT}14` }}>
                  <Zap className="size-6" style={{ color: ACCENT }} />
                </span>
                <h2 className={cn("mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl", ink)}>Your next offer starts now.</h2>
                <p className={cn("mx-auto mt-4 max-w-lg text-lg", ink3)}>
                  Free forever. 27+ features. 9 AI tools. No credit card — just you, the editor, and an AI mentor that never sleeps.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg" className={cn(primaryBtn, "h-12 px-7 text-base")}>
                    <Link href={ctaHref}>Create Free Account <ArrowRight className="size-4" /></Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className={cn("h-12 rounded-md bg-white px-7 text-base dark:bg-neutral-900", border, ink2)}>
                    <Link href="/problems">Browse Problems</Link>
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className={cn("border-t", border)}>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
            <div>
              <Logo />
              <p className={cn("mt-4 max-w-xs text-sm leading-relaxed", ink3)}>
                The AI-powered platform for mastering data structures, algorithms and frontend engineering — built for your next interview.
              </p>
              <div className="mt-6 flex items-center gap-2">
                {SOCIALS.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={socialLink}
                  >
                    {Icon ? <Icon className="size-4" /> : <GithubIcon className="size-4" />}
                  </a>
                ))}
              </div>
            </div>
            {FOOTER_COLS.map((col) => (
              <nav key={col.heading}>
                <h3 className={cn("mb-4 text-[13px] font-medium", ink3)}>{col.heading}</h3>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className={cn("text-sm transition-colors hover:text-neutral-900 dark:hover:text-white", ink3)}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className={cn("border-t", border)}>
          <div className={cn("mx-auto grid max-w-6xl grid-cols-1 gap-y-3 px-4 py-5 text-xs sm:grid-cols-3 sm:items-center sm:px-6", ink3)}>
            <p>© {new Date().getFullYear()} {APP_NAME}</p>
            <div className="flex items-center justify-center gap-2">
              <span>from</span>
              <img src="/white.png" alt="Setups Works" className="hidden h-5 w-auto dark:inline-block" />
              <img src="/black.png" alt="Setups Works" className="inline-block h-5 w-auto dark:hidden" />
            </div>
            <div className="flex items-center gap-4 sm:justify-end">
              <Link href="/help" className="hover:text-neutral-900 dark:hover:text-white">Docs</Link>
              <Link href="/blog" className="hover:text-neutral-900 dark:hover:text-white">Blog</Link>
              <Link href="/careers" className="hover:text-neutral-900 dark:hover:text-white">Careers</Link>
              <Link href="/about" className="hover:text-neutral-900 dark:hover:text-white">About</Link>
              <Link href="/contact" className="hover:text-neutral-900 dark:hover:text-white">Contact</Link>
              <Link href="/terms" className="hover:text-neutral-900 dark:hover:text-white">Terms</Link>
              <Link href="/privacy" className="hover:text-neutral-900 dark:hover:text-white">Privacy</Link>
              <span className={cn("rounded-full border px-2 py-0.5 font-mono", border)}>v{APP_VERSION}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── icons ────────────────────────────────────────────────────────── */
function GithubIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.34 1.12 2.91.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.04 10.04 0 0 0 22 12.25C22 6.58 17.52 2 12 2" /></svg>;
}
