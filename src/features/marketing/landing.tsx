"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  animate,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BarChart3,
  BookOpen,
  Bookmark,
  Bot,
  Brain,
  Building2,
  CheckCircle2,
  ChevronDown,
  Code2,
  Flame,
  GraduationCap,
  LineChart,
  Map,
  MessageSquare,
  MessageSquareText,
  MonitorPlay,
  RefreshCw,
  Sparkles,
  Star,
  StickyNote,
  Target,
  Trophy,
  Users,
  Zap,
  Braces,
  Paintbrush,
  FileText,
  Menu,
  X,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/shared/logo";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { PricingCards } from "@/features/subscription/pricing-cards";
import { APP_NAME, LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface LandingProblem {
  slug: string;
  title: string;
  difficulty: string;
  category: string;
  acceptanceRate: number | null;
}

/* ── data ─────────────────────────────────────────────────────────── */

const STATS = [
  { value: 500, suffix: "+", label: "Problems solved daily" },
  { value: 12, suffix: "", label: "Languages supported" },
  { value: 9, suffix: "", label: "AI-powered tools" },
  { value: 26, suffix: "+", label: "Platform features" },
];

const COMPANY_LOGOS = ["Google", "Meta", "Amazon", "Microsoft", "Netflix", "Uber", "Atlassian", "Apple"];

const BENTO_FEATURES = [
  {
    size: "large",
    icon: Code2,
    title: "VS Code–style Editor",
    description: "Full IntelliSense, multi-tab editing, 12 languages, hidden test cases — everything your local setup has, zero config needed.",
    color: "#f97316",
    demo: "editor",
  },
  {
    size: "medium",
    icon: Bot,
    title: "AI Mentor",
    description: "Progressive hints, complexity analysis and debugging that nudges — never spoils.",
    color: "#a855f7",
    demo: "mentor",
  },
  {
    size: "small",
    icon: Flame,
    title: "Daily Streaks",
    description: "Keep your streak alive for bonus XP and exclusive badges.",
    color: "#f97316",
    demo: null,
  },
  {
    size: "small",
    icon: BarChart3,
    title: "Skill Analytics",
    description: "Mastery map, trend analysis and readiness score.",
    color: "#22c55e",
    demo: null,
  },
  {
    size: "medium",
    icon: Brain,
    title: "Spaced Repetition",
    description: "SM-2 algorithm schedules reviews at the scientifically optimal moment — cement patterns permanently.",
    color: "#3b82f6",
    demo: "revision",
  },
  {
    size: "small",
    icon: Trophy,
    title: "Contests",
    description: "Weekly contests, daily challenges, live leaderboards.",
    color: "#eab308",
    demo: null,
  },
  {
    size: "small",
    icon: Building2,
    title: "Company Prep",
    description: "Google, Meta, Amazon, Microsoft question sets.",
    color: "#06b6d4",
    demo: null,
  },
];

const AI_FEATURES = [
  {
    icon: Bot,
    title: "AI Mentor",
    badge: "live",
    badgeColor: "text-green-400",
    color: "#a855f7",
    messages: [
      { role: "user", text: "Why is my solution O(n²)?" },
      { role: "ai", text: "Your nested loop checks every pair. Use a hash map to look up complements in O(1) — bringing it to O(n). 🎯" },
    ],
    chips: ["Hint", "Debug", "Complexity", "Optimize"],
  },
  {
    icon: Users,
    title: "AI Pair Programmer",
    badge: "streaming",
    badgeColor: "text-orange-400",
    color: "#f97316",
    messages: [
      { role: "user", text: "My DFS keeps timing out on large graphs" },
      { role: "ai", text: "You're creating a new visited Set inside each call. Move it outside — that's O(n²) → O(n) instantly" },
    ],
    chips: ["Explain", "Refactor", "Test", "Review"],
  },
  {
    icon: GraduationCap,
    title: "Learning Coach",
    badge: "personalized",
    badgeColor: "text-blue-400",
    color: "#3b82f6",
    stats: { score: 72, focus: "Dynamic Programming", ready: "6 weeks", strong: "Arrays 91%" },
  },
];

const TESTIMONIALS = [
  { name: "Priya S.", role: "SDE @ FAANG", avatar: "P", quote: "The AI mentor is the closest thing to having a senior engineer next to you. Finally internalized sliding window.", stars: 5 },
  { name: "Marcus T.", role: "Frontend Engineer", avatar: "M", quote: "Every other platform ignores frontend folks. The sandbox challenges with AI design review are exactly what I needed.", stars: 5 },
  { name: "Aditi R.", role: "CS Student", avatar: "A", quote: "94-day streak and counting — went from failing easies to clearing mediums in one sitting.", stars: 5 },
  { name: "Rohan K.", role: "Backend Dev → SDE-2", avatar: "R", quote: "AI Pair Programmer + Spaced Repetition changed how I retain algorithms. Stopped forgetting patterns after 2 weeks.", stars: 5 },
  { name: "Sara M.", role: "Final Year Student", avatar: "S", quote: "Generated my entire 8-week study plan in 30 seconds. It even accounted for my weak topics.", stars: 5 },
  { name: "James L.", role: "Senior SDE", avatar: "J", quote: "Weakness detection pinpointed my graph acceptance was 20%. Three weeks later it's 85%. Data-driven practice works.", stars: 5 },
];

const FAQS = [
  { q: "Is CodeForge AI really free?", a: "Yes. Problems, frontend challenges, contests, roadmaps, all 9 AI tools and the forum are completely free. Just create an account." },
  { q: "Which languages can I code in?", a: "JavaScript, TypeScript, Python, Java, C, C++, C#, Go, PHP, Rust, Kotlin and Swift — all in a secure cloud sandbox." },
  { q: "How does the AI mentor differ from just asking ChatGPT?", a: "It sees your exact problem statement and current code in real-time, so hints are specific to your approach — not generic. It also won't give you the full solution, by design." },
  { q: "What is spaced repetition?", a: "The SM-2 algorithm schedules problem reviews at increasing intervals based on recall quality. You review Two Sum at day 1, day 6, day 14 — cementing the pattern." },
  { q: "Can I prepare for specific companies?", a: "Yes — pick Google, Amazon, Microsoft, Meta, Netflix, Uber or Atlassian and track your progress against each company's question patterns." },
  { q: "What's the AI Pair Programmer?", a: "A real-time streaming AI that reads your code and converses with you — suggests approaches, debugs errors, explains concepts. Like a teammate who never sleeps." },
];

const STEPS = [
  { n: "01", icon: Users, title: "Create your free account", description: "Sign up with email, Google or GitHub. Pick your track: DSA, Frontend, or both. Takes 30 seconds.", color: "#f97316" },
  { n: "02", icon: Code2, title: "Solve, practice, and learn", description: "Code in a full VS Code-style editor. AI mentor gives hints. Spaced repetition locks in patterns.", color: "#a855f7" },
  { n: "03", icon: Trophy, title: "Level up and get hired", description: "Earn XP, maintain streaks, climb leaderboards, and walk into any interview fully prepared.", color: "#22c55e" },
];

const FOOTER_COLS = [
  { heading: "Platform", links: [{ label: "Problems", href: "/problems" }, { label: "Challenges", href: "/challenges" }, { label: "Contests", href: "/contests" }, { label: "Roadmaps", href: "/roadmaps" }, { label: "Leaderboard", href: "/leaderboard" }] },
  { heading: "Learn", links: [{ label: "Weakness Detection", href: "/weakness" }, { label: "Smart Revision", href: "/revision" }, { label: "Skill Analytics", href: "/analytics" }, { label: "Daily Plan", href: "/weakness" }] },
  { heading: "AI Tools", links: [{ label: "Learning Coach", href: "/ai-tools" }, { label: "Pair Programmer", href: "/ai-tools" }, { label: "Study Planner", href: "/ai-tools" }, { label: "Resume Analyzer", href: "/ai-tools" }] },
  { heading: "Community", links: [{ label: "Forum", href: "/forum" }, { label: "Discussions", href: "/discuss" }, { label: "Notes", href: "/notes" }, { label: "Company Prep", href: "/companies" }] },
];

/* ── motion helpers ───────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55 },
};

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, { duration: 1.4, ease: "easeOut", onUpdate: (v) => setDisplay(Math.round(v)) });
    return () => controls.stop();
  }, [inView, value]);
  return <span ref={ref}>{display}{suffix}</span>;
}

function TiltCard({ children, className, max = 8 }: { children: React.ReactNode; className?: string; max?: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [max, -max]), { stiffness: 180, damping: 18 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-max, max]), { stiffness: 180, damping: 18 });
  return (
    <div style={{ perspective: 1200 }} className={className}>
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); x.set((e.clientX - r.left) / r.width - 0.5); y.set((e.clientY - r.top) / r.height - 0.5); }}
        onMouseLeave={() => { x.set(0); y.set(0); }}
        className="h-full"
      >{children}</motion.div>
    </div>
  );
}

function Cube3D({ size = 80, className }: { size?: number; className?: string }) {
  const half = size / 2;
  const faces = [
    { transform: `rotateY(0deg) translateZ(${half}px)`, label: "{ }" },
    { transform: `rotateY(90deg) translateZ(${half}px)`, label: "</>" },
    { transform: `rotateY(180deg) translateZ(${half}px)`, label: "fn()" },
    { transform: `rotateY(-90deg) translateZ(${half}px)`, label: "λ" },
    { transform: `rotateX(90deg) translateZ(${half}px)`, label: "++" },
    { transform: `rotateX(-90deg) translateZ(${half}px)`, label: "()" },
  ];
  return (
    <div className={cn("pointer-events-none", className)} style={{ width: size, height: size, perspective: 600 }} aria-hidden>
      <div className="cube-3d relative h-full w-full">
        {faces.map((f) => (
          <div key={f.label} className="cube-face" style={{ transform: f.transform, fontSize: size / 5 }}>{f.label}</div>
        ))}
      </div>
    </div>
  );
}

function OrbitSphere({ size = 120, className }: { size?: number; className?: string }) {
  return (
    <div className={cn("pointer-events-none relative flex items-center justify-center", className)} style={{ width: size, height: size }} aria-hidden>
      {/* core glow */}
      <div className="absolute rounded-full bg-orange-500/20 blur-xl" style={{ width: size * 0.5, height: size * 0.5 }} />
      <div className="absolute rounded-full border border-orange-500/20 animate-orbit" style={{ width: size, height: size }} />
      <div className="absolute rounded-full border border-purple-500/20 animate-orbit-reverse" style={{ width: size * 0.75, height: size * 0.75 }} />
      <div className="absolute rounded-full border border-orange-400/30" style={{ width: size * 0.5, height: size * 0.5, transform: "rotateX(60deg)" }} />
      <div className="size-2 rounded-full bg-orange-400 shadow-[0_0_12px_4px_rgba(249,115,22,0.6)]" />
    </div>
  );
}

function GlowOrb({ color = "#f97316", size = 400, className }: { color?: string; size?: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute rounded-full", className)}
      style={{ width: size, height: size, background: color, filter: `blur(${size * 0.35}px)`, opacity: 0.12 }}
    />
  );
}

function Particle({ delay = 0, x = 0, y = 0 }: { delay?: number; x?: number; y?: number }) {
  return (
    <motion.div
      aria-hidden
      className="absolute size-1 rounded-full bg-orange-400/60"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{ y: [0, -30, 0], opacity: [0.4, 0.9, 0.4], scale: [1, 1.5, 1] }}
      transition={{ duration: 4 + delay, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-400">
      <span className="size-1.5 rounded-full bg-orange-400" />
      {text}
    </div>
  );
}

/* ── Typing text animation ──────────────────────────────────────── */
function TypingText({ texts, className }: { texts: string[]; className?: string }) {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const target = texts[idx];
    const speed = isDeleting ? 40 : 80;
    const timeout = setTimeout(() => {
      if (!isDeleting && displayed === target) {
        setTimeout(() => setIsDeleting(true), 1800);
        return;
      }
      if (isDeleting && displayed === "") {
        setIsDeleting(false);
        setIdx((i) => (i + 1) % texts.length);
        return;
      }
      setDisplayed(isDeleting ? displayed.slice(0, -1) : target.slice(0, displayed.length + 1));
    }, speed);
    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, idx, texts]);

  return (
    <span className={className}>
      {displayed}
      <span className="animate-blink ml-0.5 inline-block h-[0.9em] w-0.5 align-middle bg-orange-400" />
    </span>
  );
}

/* ── main page ────────────────────────────────────────────────────── */

export function Landing({ signedIn, problems, totalProblems }: { signedIn: boolean; problems: LandingProblem[]; totalProblems: number }) {
  const ctaHref = signedIn ? "/dashboard" : "/register";
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const particles = [
    { x: 10, y: 20, delay: 0 }, { x: 85, y: 15, delay: 1.2 }, { x: 45, y: 70, delay: 2.4 },
    { x: 70, y: 40, delay: 0.8 }, { x: 20, y: 65, delay: 1.9 }, { x: 92, y: 55, delay: 3 },
    { x: 35, y: 88, delay: 0.5 }, { x: 60, y: 10, delay: 2.1 }, { x: 5, y: 45, delay: 1.5 },
    { x: 78, y: 80, delay: 3.3 }, { x: 50, y: 30, delay: 0.3 }, { x: 15, y: 90, delay: 2.7 },
  ];

  return (
    /* force dark mode for consistent dark landing aesthetic */
    <div className="min-h-svh bg-white text-gray-900 dark:bg-white dark:bg-[#06060a] dark:text-white">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 dark:border-white/5 bg-white/95 dark:bg-white dark:bg-[#06060a]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-gray-500 dark:text-white/50 md:flex">
            {[
              ["Problems", "/problems"],
              ["Features", "#features"],
              ["AI Suite", "#ai"],
              ["Pricing", "#pricing"],
              ["Forum", "/forum"],
            ].map(([label, href]) => (
              <a key={label} href={href} className="transition-colors hover:text-gray-900 dark:hover:text-white">
                {label}
                {label === "Problems" && totalProblems > 0 && (
                  <span className="ml-1.5 rounded-full bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-bold text-orange-400">{totalProblems}</span>
                )}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {signedIn ? (
              <Button asChild size="sm" className="bg-orange-500 text-gray-900 dark:text-white hover:bg-orange-600">
                <Link href="/dashboard">Dashboard <ArrowRight className="size-4" /></Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white sm:inline-flex">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="bg-orange-500 text-gray-900 dark:text-white hover:bg-orange-600 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                  <Link href="/register">Get started free</Link>
                </Button>
              </>
            )}
            <button className="md:hidden text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-100 dark:border-white/5 md:hidden"
            >
              <nav className="flex flex-col gap-1 px-4 py-4">
                {[["Problems", "/problems"], ["Forum", "/forum"], ["Pricing", "#pricing"]].map(([label, href]) => (
                  <a key={label} href={href} onClick={() => setMobileMenu(false)} className="rounded-lg px-3 py-2.5 text-sm text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white">
                    {label}
                  </a>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* ── HERO ───────────────────────────────────────────────────── */}
        <section ref={heroRef} className="relative min-h-[90vh] overflow-hidden flex items-center">
          {/* Background */}
          <div className="absolute inset-0">
            <div className="bg-grid absolute inset-0 opacity-100" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-[#06060a]" />
          </div>

          {/* Glow orbs */}
          <GlowOrb color="#f97316" size={600} className="-top-40 left-1/4" />
          <GlowOrb color="#a855f7" size={400} className="top-1/2 right-0" />
          <GlowOrb color="#3b82f6" size={300} className="bottom-0 left-0" />

          {/* Particles */}
          <div className="absolute inset-0 overflow-hidden">
            {particles.map((p, i) => <Particle key={i} {...p} />)}
          </div>

          {/* 3D decorative elements */}
          <motion.div style={{ y: y1 }} className="absolute right-12 top-24 hidden xl:block" aria-hidden>
            <Cube3D size={80} className="opacity-60" />
          </motion.div>
          <motion.div style={{ y: y2 }} className="absolute left-8 bottom-32 hidden xl:block" aria-hidden>
            <OrbitSphere size={100} className="opacity-50" />
          </motion.div>
          <motion.div style={{ y: y1 }} className="absolute right-1/4 bottom-24 hidden lg:block" aria-hidden>
            <Cube3D size={44} className="opacity-30" />
          </motion.div>

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 lg:grid-cols-[1fr_1.1fr] lg:py-28">
            {/* Left — text */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                <Badge className="mb-6 gap-2 border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-orange-400 hover:bg-orange-500/15">
                  <Sparkles className="size-3.5" /> 26+ features · 9 AI tools · 100% free
                </Badge>
              </motion.div>

              <h1 className="text-balance text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl xl:text-7xl">
                <span className="text-gradient-white">Master coding</span>
                <br />
                <span className="text-gradient-white">interviews with</span>
                <br />
                <span className="text-gradient-orange animate-gradient bg-gradient-to-r from-orange-400 via-orange-500 to-red-500">
                  AI power.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-pretty text-lg text-gray-500 dark:text-white/50 leading-relaxed">
                The{" "}
                <span className="text-gray-800 dark:text-white/80 font-medium">
                  <TypingText texts={["only platform", "smartest tool", "best way"]} />
                </span>{" "}
                that combines LeetCode-style problems, AI pair programming, spaced repetition and skill analytics — all free.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="h-12 px-7 text-base bg-orange-500 hover:bg-orange-600 text-gray-900 dark:text-white shadow-[0_0_30px_rgba(249,115,22,0.45)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300">
                  <Link href={ctaHref}>
                    Start for free <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 gap-2 border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white">
                  <a href="#ai">
                    <Play className="size-4 fill-current" /> See AI in action
                  </a>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-white/40">
                {["No credit card", "12 languages", "9 AI tools", "Community forum"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-orange-400" /> {item}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Right — 3D editor mockup */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative mx-auto w-full max-w-xl"
            >
              {/* Glow behind card */}
              <div className="absolute inset-0 rounded-2xl bg-orange-500/15 blur-3xl" />

              <TiltCard max={6}>
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0d0d12] shadow-[0_0_60px_rgba(0,0,0,0.8)]">
                  {/* Shimmer overlay */}
                  <div className="animate-shimmer pointer-events-none absolute inset-0 z-10" />
                  {/* Editor chrome */}
                  <div className="flex items-center gap-1.5 border-b border-gray-100 dark:border-white/5 bg-gray-100 dark:bg-[#0a0a0e] px-4 py-3">
                    <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
                    <span className="size-2.5 rounded-full bg-[#28c840]" />
                    <div className="ml-3 flex gap-2">
                      {["two-sum.js", "binary-search.py"].map((tab, i) => (
                        <span key={tab} className={cn("rounded px-3 py-1 font-mono text-xs", i === 0 ? "bg-gray-200 dark:bg-[#1a1a22] text-gray-800 dark:text-white/80" : "text-gray-400 dark:text-white/30")}>
                          {tab}
                        </span>
                      ))}
                    </div>
                    <motion.span
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.6, type: "spring", stiffness: 260 }}
                      className="ml-auto rounded-md bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400 border border-green-500/30"
                    >
                      ✓ ACCEPTED
                    </motion.span>
                  </div>
                  {/* Code */}
                  <pre className="p-5 font-mono text-xs leading-[1.9] sm:text-[13px]">
                    <code>
                      <span className="text-purple-400">function</span>{" "}
                      <span className="text-blue-400">twoSum</span>
                      <span className="text-gray-600 dark:text-white/60">{"(nums, target) {"}</span>{"\n"}
                      {"  "}<span className="text-purple-400">const</span>{" seen = "}
                      <span className="text-purple-400">new</span>{" Map();\n"}
                      {"  "}<span className="text-orange-400">for</span>
                      {" (let i = 0; i < nums.length; i++) {\n"}
                      {"    "}<span className="text-purple-400">const</span>{" need = target - nums[i];\n"}
                      {"    "}<span className="text-orange-400">if</span>{" (seen."}
                      <span className="text-blue-400">has</span>{"(need))\n"}
                      {"      "}<span className="text-orange-400">return</span>{" [seen."}
                      <span className="text-blue-400">get</span>{"(need), i];\n"}
                      {"    seen."}<span className="text-blue-400">set</span>{"(nums[i], i);\n"}
                      {"  }\n"}<span className="text-gray-600 dark:text-white/60">{"}"}</span>{"\n\n"}
                      <span className="text-gray-400 dark:text-white/25">{"// ✓ 12/12 tests · O(n) time · O(n) space"}</span>
                    </code>
                  </pre>
                  {/* Bottom bar */}
                  <div className="flex items-center gap-4 border-t border-gray-100 dark:border-white/5 bg-gray-100 dark:bg-[#0a0a0e] px-4 py-2.5">
                    <span className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-white/30"><span className="size-1.5 rounded-full bg-green-400" /> JavaScript</span>
                    <span className="text-[11px] text-gray-400 dark:text-white/30">Ln 8, Col 1</span>
                    <span className="ml-auto text-[11px] text-gray-400 dark:text-white/30">UTF-8</span>
                  </div>
                </div>
              </TiltCard>

              {/* Floating notification cards */}
              <motion.div style={{ y: y2 }} className="absolute -left-4 -top-5 sm:-left-12">
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  className="flex items-center gap-2.5 rounded-xl border border-orange-500/20 bg-gray-50/95 dark:bg-gray-50 dark:bg-[#0d0d12]/90 px-3.5 py-2.5 shadow-[0_0_30px_rgba(249,115,22,0.2)] backdrop-blur-sm">
                  <Zap className="size-4 text-orange-400" />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">+25 XP earned</p>
                    <p className="text-[10px] text-gray-500 dark:text-white/40">Two Sum solved</p>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div style={{ y: y1 }} className="absolute -bottom-5 -right-3 sm:-right-10">
                <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
                  className="flex items-center gap-2.5 rounded-xl border border-orange-500/20 bg-gray-50/95 dark:bg-gray-50 dark:bg-[#0d0d12]/90 px-3.5 py-2.5 shadow-[0_0_30px_rgba(249,115,22,0.2)] backdrop-blur-sm">
                  <Flame className="size-4 text-orange-400" />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">🔥 14-day streak</p>
                    <p className="text-[10px] text-gray-500 dark:text-white/40">Keep it going!</p>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div style={{ y: y2 }} className="absolute right-0 top-1/3 hidden sm:block lg:-right-14">
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.3 }}
                  className="flex items-center gap-2.5 rounded-xl border border-purple-500/30 bg-gray-50/95 dark:bg-gray-50 dark:bg-[#0d0d12]/90 px-3.5 py-2.5 shadow-[0_0_30px_rgba(168,85,247,0.2)] backdrop-blur-sm">
                  <Award className="size-4 text-purple-400" />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Badge unlocked!</p>
                    <p className="text-[10px] text-gray-500 dark:text-white/40">Speed Solver 🏅</p>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {/* Language marquee */}
          <motion.div style={{ opacity }} className="absolute bottom-0 left-0 right-0">
            <div className="border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] py-3">
              <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                <div className="animate-marquee flex w-max gap-3">
                  {[...LANGUAGES, ...LANGUAGES].map((lang, i) => (
                    <span key={`${lang.id}-${i}`} className="flex shrink-0 items-center gap-2 rounded-full border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-gray-500 dark:text-white/50">
                      <span className="flex size-5 items-center justify-center rounded bg-gray-100 dark:bg-white/10 font-mono text-[9px] font-black">{lang.extension.slice(0, 2).toUpperCase()}</span>
                      {lang.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── COMPANY TRUST ─────────────────────────────────────────── */}
        <section className="border-b border-gray-100 dark:border-white/5 py-14">
          <div className="mx-auto max-w-7xl px-4">
            <motion.p {...fadeUp} className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/25">
              Engineers at world-class companies practice here
            </motion.p>
            <motion.div {...fadeUp} className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              {COMPANY_LOGOS.map((name, i) => (
                <motion.span
                  key={name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="text-sm font-bold tracking-wide text-gray-300 dark:text-white/20 hover:text-gray-500 dark:hover:text-gray-500 dark:text-white/50 transition-colors cursor-default"
                >
                  {name}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── STATS ─────────────────────────────────────────────────── */}
        <section className="border-b border-gray-100 dark:border-white/5 py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.03 }}
                  className="group relative overflow-hidden rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.03] p-6 text-center"
                >
                  <div className="animate-shimmer pointer-events-none absolute inset-0" />
                  <p className="text-4xl font-black text-gradient-orange sm:text-5xl">
                    <CountUp value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-white/40 uppercase tracking-wide">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES BENTO GRID ───────────────────────────────────── */}
        <section id="features" className="border-b border-gray-100 dark:border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-4">
            <motion.div {...fadeUp} className="mx-auto mb-16 max-w-2xl text-center">
              <SectionLabel text="Features" />
              <h2 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl text-gradient-white">
                26+ features.<br />Zero paywalls.
              </h2>
              <p className="mt-4 text-gray-500 dark:text-white/40 text-lg">
                One platform for algorithms, frontend, AI tools, community and analytics.
              </p>
            </motion.div>

            <div className="grid auto-rows-[200px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Large card — code editor */}
              <motion.div {...fadeUp} className="sm:col-span-2 sm:row-span-2">
                <TiltCard max={4} className="h-full">
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0d0d12] p-6">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent" />
                    <div className="absolute -right-8 -top-8 size-40 rounded-full bg-orange-500/10 blur-3xl group-hover:bg-orange-500/15 transition-all duration-700" />
                    <Code2 className="mb-4 size-8 text-orange-400" />
                    <h3 className="text-xl font-bold">VS Code–style Editor</h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-white/40 max-w-sm">Full IntelliSense, multi-tab editing, 12 languages, hidden test cases and instant verdicts — everything your local setup has, zero config.</p>
                    <div className="mt-6 overflow-hidden rounded-xl border border-gray-100 dark:border-white/5 bg-slate-100 dark:bg-[#080810]">
                      <div className="flex items-center gap-1.5 border-b border-gray-100 dark:border-white/5 px-3 py-2">
                        <span className="size-2 rounded-full bg-[#ff5f57]" /><span className="size-2 rounded-full bg-[#ffbd2e]" /><span className="size-2 rounded-full bg-[#28c840]" />
                        <span className="ml-2 font-mono text-[10px] text-gray-400 dark:text-white/25">solution.py</span>
                      </div>
                      <pre className="p-3 font-mono text-[11px] leading-relaxed text-gray-600 dark:text-white/60">
                        <span className="text-purple-400">def</span> <span className="text-blue-400">maxProfit</span>(prices):{"\n"}
                        {"    "}<span className="text-gray-400 dark:text-white/30">min_price = float("inf")</span>{"\n"}
                        {"    "}<span className="text-gray-400 dark:text-white/30">max_profit = 0</span>{"\n"}
                        {"    "}<span className="text-orange-400">for</span> price <span className="text-orange-400">in</span> prices:{"\n"}
                        {"        "}min_price = <span className="text-blue-400">min</span>(min_price, price){"\n"}
                        {"        "}max_profit = <span className="text-blue-400">max</span>(max_profit, price - min_price){"\n"}
                        {"    "}<span className="text-orange-400">return</span> max_profit
                      </pre>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>

              {/* Medium card — AI mentor */}
              <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="sm:col-span-1">
                <TiltCard max={6} className="h-full">
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0d0d12] p-5">
                    <div className="absolute -left-4 -top-4 size-24 rounded-full bg-purple-500/10 blur-2xl" />
                    <Bot className="mb-3 size-7 text-purple-400" />
                    <h3 className="font-bold">AI Mentor</h3>
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-white/40">Progressive hints without spoiling. Nudges you to the pattern.</p>
                    <div className="mt-4 space-y-2">
                      <div className="ml-6 rounded-lg bg-purple-500/15 px-2.5 py-1.5 text-xs text-gray-700 dark:text-white/70">Why is this O(n²)?</div>
                      <div className="rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/3 px-2.5 py-1.5 text-xs text-gray-500 dark:text-white/50">Use a hash map — O(n) ✓</div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>

              {/* Small card — streaks */}
              <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
                <TiltCard max={8} className="h-full">
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0d0d12] p-5">
                    <div className="absolute right-0 top-0 size-20 rounded-full bg-orange-500/10 blur-2xl" />
                    <Flame className="mb-2 size-6 text-orange-400" />
                    <h3 className="font-bold">Daily Streaks</h3>
                    <div className="mt-3 flex gap-1">
                      {[1,1,1,1,1,0,1].map((active, i) => (
                        <div key={i} className={cn("h-7 flex-1 rounded-sm", active ? "bg-orange-500" : "bg-gray-100 dark:bg-white/10")} />
                      ))}
                    </div>
                    <p className="mt-2 text-xs font-bold text-orange-400">🔥 94-day streak</p>
                  </div>
                </TiltCard>
              </motion.div>

              {/* Small card — spaced repetition */}
              <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
                <TiltCard max={8} className="h-full">
                  <div className="relative h-full overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0d0d12] p-5">
                    <div className="absolute left-0 bottom-0 size-20 rounded-full bg-blue-500/10 blur-2xl" />
                    <Brain className="mb-2 size-6 text-blue-400" />
                    <h3 className="font-bold">Spaced Repetition</h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-white/40">SM-2 algorithm. Review at the perfect moment.</p>
                    <div className="mt-2 space-y-1">
                      {[["Two Sum", "Today", true], ["Binary Search", "Day 6", false], ["Merge K Lists", "Day 14", false]].map(([t, d, u]) => (
                        <div key={t as string} className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-500 dark:text-white/50">{t}</span>
                          <span className={cn("font-semibold", u ? "text-orange-400" : "text-gray-400 dark:text-white/25")}>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TiltCard>
              </motion.div>

              {/* Small card — skill analytics */}
              <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
                <TiltCard max={8} className="h-full">
                  <div className="relative h-full overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0d0d12] p-5">
                    <div className="absolute right-0 bottom-0 size-20 rounded-full bg-green-500/10 blur-2xl" />
                    <BarChart3 className="mb-2 size-6 text-green-400" />
                    <h3 className="font-bold">Skill Analytics</h3>
                    <div className="mt-2 space-y-1.5">
                      {[["Arrays", 91, "bg-green-400"], ["Strings", 84, "bg-green-400"], ["DP", 32, "bg-orange-400"], ["Graphs", 18, "bg-red-400"]].map(([c, v, col]) => (
                        <div key={c as string} className="space-y-0.5">
                          <div className="flex justify-between text-[9px] text-gray-500 dark:text-white/40"><span>{c}</span><span>{v}%</span></div>
                          <div className="h-1 rounded-full bg-gray-100 dark:bg-white/5"><div className={cn("h-full rounded-full", col)} style={{ width: `${v}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TiltCard>
              </motion.div>

              {/* Wide card — gamification */}
              <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="sm:col-span-2 lg:col-span-1">
                <div className="relative h-full overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0d0d12] p-5">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
                  <Trophy className="mb-3 size-6 text-orange-400" />
                  <h3 className="font-bold">Gamification System</h3>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      { icon: Zap, label: "XP & Levels", value: "Lvl 14", color: "text-orange-400" },
                      { icon: Award, label: "Badges", value: "8 earned", color: "text-yellow-400" },
                      { icon: Trophy, label: "Leaderboard", value: "Top 3%", color: "text-green-400" },
                      { icon: Target, label: "Accuracy", value: "82%", color: "text-blue-400" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/3 p-2.5">
                        <item.icon className={cn("mb-1 size-4", item.color)} />
                        <p className={cn("text-sm font-bold", item.color)}>{item.value}</p>
                        <p className="text-[10px] text-gray-400 dark:text-white/30">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── AI SUITE ──────────────────────────────────────────────── */}
        <section id="ai" className="relative border-b border-gray-100 dark:border-white/5 py-24 overflow-hidden">
          <GlowOrb color="#a855f7" size={500} className="top-0 left-0 -translate-x-1/2" />
          <GlowOrb color="#f97316" size={400} className="bottom-0 right-0 translate-x-1/3" />
          <div className="relative mx-auto max-w-7xl px-4">
            <motion.div {...fadeUp} className="mx-auto mb-16 max-w-2xl text-center">
              <SectionLabel text="AI Suite" />
              <h2 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl text-gradient-white">
                9 AI tools.<br />One platform.
              </h2>
              <p className="mt-4 text-gray-500 dark:text-white/40 text-lg">
                From personalized coaching to pair programming — AI is woven into every part of your practice.
              </p>
            </motion.div>

            <div className="grid gap-5 lg:grid-cols-3">
              {AI_FEATURES.map((feat, i) => (
                <motion.div key={feat.title} {...fadeUp} transition={{ delay: i * 0.12 }}>
                  <TiltCard max={5} className="h-full">
                    <div className="group relative h-full overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0d0d12]">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                      <div className="absolute -top-10 right-0 size-32 rounded-full opacity-20 blur-3xl transition-opacity duration-700 group-hover:opacity-30" style={{ background: feat.color }} />

                      <div className="relative p-5">
                        <div className="mb-4 flex items-center gap-2.5">
                          <div className="flex size-9 items-center justify-center rounded-xl border border-gray-200 dark:border-white/10" style={{ background: `${feat.color}20` }}>
                            <feat.icon className="size-5" style={{ color: feat.color }} />
                          </div>
                          <span className="font-bold text-sm">{feat.title}</span>
                          <span className={cn("ml-auto text-xs font-semibold", feat.badgeColor)}>● {feat.badge}</span>
                        </div>

                        {feat.messages && (
                          <div className="space-y-2.5">
                            {feat.messages.map((msg, mi) => (
                              <motion.div
                                key={mi}
                                initial={{ opacity: 0, x: msg.role === "user" ? 10 : -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 + mi * 0.2 }}
                                className={cn("rounded-xl px-3 py-2 text-xs leading-relaxed", msg.role === "user" ? "ml-8 text-gray-800 dark:text-white/80" : "mr-2 border border-gray-100 dark:border-white/5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/60")}
                                style={msg.role === "user" ? { background: `${feat.color}25`, border: `1px solid ${feat.color}40` } : {}}
                              >
                                {msg.text}
                                {mi === feat.messages!.length - 1 && msg.role === "ai" && (
                                  <span className="animate-blink ml-1 inline-block h-3 w-0.5 align-middle bg-white/40" />
                                )}
                              </motion.div>
                            ))}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {feat.chips?.map((c) => (
                                <span key={c} className="rounded-full border border-gray-200 dark:border-white/10 px-2 py-0.5 text-[10px] text-gray-400 dark:text-white/30 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-500 dark:hover:text-gray-500 dark:text-white/50 transition-colors cursor-pointer">{c}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {feat.stats && (
                          <div className="space-y-3">
                            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-3.5 py-3">
                              <p className="text-xs font-semibold text-blue-400">Interview Readiness</p>
                              <div className="mt-1 flex items-end gap-2">
                                <span className="text-3xl font-black text-gray-900 dark:text-white">{feat.stats.score}</span>
                                <span className="mb-0.5 text-xs text-gray-500 dark:text-white/40">/100 · Intermediate</span>
                              </div>
                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                                <motion.div
                                  className="h-full rounded-full bg-blue-400"
                                  initial={{ width: 0 }}
                                  whileInView={{ width: `${feat.stats.score}%` }}
                                  viewport={{ once: true }}
                                  transition={{ duration: 1, delay: 0.3 }}
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5 text-xs text-gray-500 dark:text-white/40">
                              <p>🎯 Focus: {feat.stats.focus}</p>
                              <p>📅 Ready in: {feat.stats.ready}</p>
                              <p>💪 Strong: {feat.stats.strong}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TiltCard>
                </motion.div>
              ))}
            </div>

            {/* More AI tools row */}
            <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { icon: BookOpen, label: "Study Planner", color: "#f97316" },
                { icon: Map, label: "Roadmap Generator", color: "#a855f7" },
                { icon: FileText, label: "Resume Analyzer", color: "#3b82f6" },
                { icon: Code2, label: "Code Reviewer", color: "#22c55e" },
                { icon: BarChart3, label: "Complexity Visualizer", color: "#eab308" },
                { icon: Trophy, label: "Contest Generator", color: "#f97316" },
              ].map((tool, i) => (
                <motion.div
                  key={tool.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -3, scale: 1.02 }}
                  className="rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.03] p-3.5 text-center hover:border-gray-200 dark:hover:border-white/10 transition-all"
                >
                  <div className="mx-auto mb-2 flex size-9 items-center justify-center rounded-lg" style={{ background: `${tool.color}20` }}>
                    <tool.icon className="size-4.5" style={{ color: tool.color }} />
                  </div>
                  <p className="text-xs font-medium text-gray-600 dark:text-white/60">{tool.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
        <section className="border-b border-gray-100 dark:border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-4">
            <motion.div {...fadeUp} className="mx-auto mb-16 max-w-2xl text-center">
              <SectionLabel text="How it works" />
              <h2 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl text-gradient-white">
                From zero to offer<br />in three steps
              </h2>
            </motion.div>
            <div className="grid gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.n}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.13 }}
                >
                  <TiltCard max={5} className="h-full">
                    <div className="relative h-full overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0d0d12] p-7">
                      <div className="absolute -right-8 -top-8 size-32 rounded-full blur-3xl opacity-20" style={{ background: step.color }} />
                      <div className="absolute right-4 top-4 font-mono text-6xl font-black text-white/[0.03] select-none">{step.n}</div>
                      <div className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-gray-200 dark:border-white/10" style={{ background: `${step.color}20` }}>
                        <step.icon className="size-6" style={{ color: step.color }} />
                      </div>
                      <h3 className="mb-2.5 text-lg font-bold">{step.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-white/40 leading-relaxed">{step.description}</p>
                      <div className="mt-5 h-0.5 w-12 rounded-full" style={{ background: step.color }} />
                    </div>
                  </TiltCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROBLEMS PREVIEW ──────────────────────────────────────── */}
        {problems.length > 0 && (
          <section className="border-b border-gray-100 dark:border-white/5 py-24">
            <div className="mx-auto max-w-7xl px-4">
              <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.4fr]">
                <motion.div {...fadeUp}>
                  <SectionLabel text="Problem bank" />
                  <h2 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl text-gradient-white">
                    {totalProblems}+ real interview<br />questions, ready to run.
                  </h2>
                  <p className="mt-4 text-gray-500 dark:text-white/40">DSA classics, JavaScript deep-dives and React pattern exercises — every problem executes against hidden test cases in the cloud.</p>
                  <Button asChild size="lg" className="mt-7 bg-orange-500 hover:bg-orange-600 text-gray-900 dark:text-white shadow-[0_0_24px_rgba(249,115,22,0.35)]">
                    <Link href="/problems">Browse all problems <ArrowRight className="size-4" /></Link>
                  </Button>
                </motion.div>
                <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0d0d12]">
                  {problems.map((problem, index) => (
                    <motion.div
                      key={problem.slug}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.07 }}
                    >
                      <Link href={`/problems/${problem.slug}`} className={cn("group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-orange-500/5", index !== 0 && "border-t border-gray-100 dark:border-white/5")}>
                        <span className="font-mono text-xs text-gray-300 dark:text-white/20">{String(index + 1).padStart(2, "0")}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/80 group-hover:text-gray-900 dark:hover:text-white">{problem.title}</p>
                          <p className="text-xs text-gray-400 dark:text-white/30">{problem.category}</p>
                        </div>
                        <DifficultyBadge difficulty={problem.difficulty} />
                        <ArrowUpRight className="size-4 text-gray-300 dark:text-white/20 transition-all group-hover:text-orange-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
        <section className="border-b border-gray-100 dark:border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-4">
            <motion.div {...fadeUp} className="mx-auto mb-16 max-w-2xl text-center">
              <SectionLabel text="Testimonials" />
              <h2 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl text-gradient-white">
                Loved by thousands<br />of coders
              </h2>
            </motion.div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <motion.figure
                  key={t.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 3) * 0.1 }}
                  whileHover={{ y: -5, scale: 1.01 }}
                  className="group flex h-full flex-col rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.03] p-6 hover:border-orange-500/20 hover:bg-orange-500/[0.03] transition-all duration-300"
                >
                  <div className="mb-3 flex gap-0.5">
                    {Array(t.stars).fill(0).map((_, si) => (
                      <Star key={si} className="size-3.5 fill-orange-400 text-orange-400" />
                    ))}
                  </div>
                  <blockquote className="flex-1 text-sm leading-relaxed text-gray-600 dark:text-white/60">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-gray-100 dark:border-white/5 pt-4">
                    <span className="flex size-9 items-center justify-center rounded-full bg-orange-500/20 text-sm font-black text-orange-400">
                      {t.avatar}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-gray-800 dark:text-white/80">{t.name}</span>
                      <span className="block text-xs text-gray-400 dark:text-white/30">{t.role}</span>
                    </span>
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ───────────────────────────────────────────────── */}
        <section id="pricing" className="border-b border-gray-100 dark:border-white/5 py-24">
          <div className="mx-auto max-w-5xl px-4">
            <motion.div {...fadeUp} className="mx-auto mb-12 max-w-2xl text-center">
              <SectionLabel text="Pricing" />
              <h2 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl text-gradient-white">
                Start free,<br />level up fast.
              </h2>
              <p className="mt-4 text-gray-500 dark:text-white/40">7-day free trial on all paid plans. No credit card required.</p>
            </motion.div>
            <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
              <PricingCards />
            </motion.div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────── */}
        <section id="faq" className="border-b border-gray-100 dark:border-white/5 py-24">
          <div className="mx-auto max-w-3xl px-4">
            <motion.div {...fadeUp} className="mb-12 text-center">
              <SectionLabel text="FAQ" />
              <h2 className="mt-5 text-4xl font-black tracking-tight text-gradient-white">Frequently asked</h2>
            </motion.div>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className={cn("overflow-hidden rounded-xl border bg-gray-50 dark:bg-white/[0.03] transition-all", openFaq === i ? "border-orange-500/30" : "border-gray-100 dark:border-white/5")}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-gray-800 dark:text-white/80 hover:text-gray-900 dark:hover:text-white"
                  >
                    {faq.q}
                    <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.25 }}>
                      <ChevronDown className="size-4 shrink-0 text-gray-400 dark:text-white/30" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="border-t border-gray-100 dark:border-white/5 px-5 py-4 text-sm text-gray-500 dark:text-white/40 leading-relaxed">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-32">
          <div className="absolute inset-0 bg-grid-sm opacity-50" />
          <GlowOrb color="#f97316" size={700} className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute right-16 top-12 hidden lg:block" aria-hidden>
            <Cube3D size={72} className="opacity-40" />
          </div>
          <div className="absolute left-16 bottom-12 hidden lg:block" aria-hidden>
            <OrbitSphere size={90} className="opacity-30" />
          </div>
          <div className="relative mx-auto max-w-4xl px-4 text-center">
            <motion.div {...fadeUp}>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/10"
              >
                <Flame className="size-8 text-orange-400" />
              </motion.div>
              <h2 className="text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl text-gradient-white leading-[1.02]">
                Your next offer<br />starts now.
              </h2>
              <p className="mx-auto mt-6 max-w-lg text-lg text-gray-500 dark:text-white/40">
                Free forever. 26+ features. 9 AI tools. No credit card. Just you, the editor, and an AI mentor that never sleeps.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button asChild size="lg" className="h-14 px-10 text-lg bg-orange-500 hover:bg-orange-600 text-gray-900 dark:text-white shadow-[0_0_50px_rgba(249,115,22,0.5)] hover:shadow-[0_0_70px_rgba(249,115,22,0.7)] transition-all duration-300 animate-glow">
                  <Link href={ctaHref}>Create free account <ArrowRight className="size-5" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 hover:border-gray-300 dark:hover:border-white/20">
                  <Link href="/problems">Browse problems</Link>
                </Button>
              </div>
              <p className="mt-6 text-sm text-gray-400 dark:text-white/25">No credit card · 12 languages · 9 AI tools</p>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 dark:border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
            <div>
              <Logo />
              <p className="mt-4 max-w-xs text-sm text-gray-400 dark:text-white/30 leading-relaxed">
                The AI-powered platform for mastering data structures, algorithms and frontend engineering — built for your next interview.
              </p>
              <div className="mt-6 flex gap-2">
                {[{ label: "GitHub", icon: GithubIcon }, { label: "Twitter", icon: XIcon }, { label: "YouTube", icon: YoutubeIcon }].map(({ label, icon: Icon }) => (
                  <a key={label} href="#" aria-label={label}
                    className="flex size-9 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/30 hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-400 transition-all">
                    <Icon className="size-4" />
                  </a>
                ))}
              </div>
            </div>
            {FOOTER_COLS.map((col) => (
              <nav key={col.heading}>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30">{col.heading}</h3>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-gray-500 dark:text-white/40 hover:text-orange-400 transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="border-t border-gray-100 dark:border-white/5">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-gray-300 dark:text-white/20">
            <p>© {new Date().getFullYear()} {APP_NAME}. Built by Setups Works.</p>
            <p>26+ features · 9 AI tools · 100% free ⚡</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── SVG icons ────────────────────────────────────────────────────── */
function GithubIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.34 1.12 2.91.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.04 10.04 0 0 0 22 12.25C22 6.58 17.52 2 12 2" /></svg>;
}
function XIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
}
function YoutubeIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12z" /></svg>;
}
