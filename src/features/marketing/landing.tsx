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
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Bot,
  Braces,
  Building2,
  CheckCircle2,
  ChevronDown,
  Code2,
  Flame,
  Map,
  MessageSquareText,
  MonitorPlay,
  Paintbrush,
  Play,
  Sparkles,
  Trophy,
  UserPlus,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { APP_NAME, LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface LandingProblem {
  slug: string;
  title: string;
  difficulty: string;
  category: string;
  acceptanceRate: number | null;
}

/* ── content ─────────────────────────────────────────────────────── */

const STATS = [
  { value: 12, suffix: "", label: "Programming languages" },
  { value: 40, suffix: "+", label: "Topic categories" },
  { value: 7, suffix: "", label: "Company question sets" },
  { value: 24, suffix: "/7", label: "AI mentor on call" },
];

const STEPS = [
  { icon: UserPlus, title: "Create your free account", description: "Sign up with email, Google or GitHub. Pick your track — DSA, frontend, or both." },
  { icon: Code2, title: "Solve real interview problems", description: "Code in a full VS Code-style editor, run against hidden test cases, get instant verdicts." },
  { icon: Trophy, title: "Level up and get hired", description: "Earn XP, keep your streak alive, climb the leaderboard and walk into interviews prepared." },
];

const FEATURES = [
  { icon: Braces, title: "DSA Problems", description: "Curated interview questions in 12 languages with hidden test cases, instant verdicts and editorials." },
  { icon: Paintbrush, title: "Frontend Challenges", description: "Build real UIs in an in-browser sandbox with live preview, console and AI-powered design review." },
  { icon: Bot, title: "AI Mentor", description: "Progressive hints, complexity analysis, debugging help and interview coaching — inside the editor." },
  { icon: Map, title: "Learning Roadmaps", description: "Structured paths from arrays to dynamic programming and from HTML to architecture." },
  { icon: Trophy, title: "Contests", description: "Weekly contests, daily challenges and live leaderboards to keep your competitive edge sharp." },
  { icon: Building2, title: "Company Prep", description: "Question sets modeled on Google, Amazon, Meta and more, with per-company progress tracking." },
  { icon: MonitorPlay, title: "Mock Interviews", description: "Timed sessions with a question queue, optional screen recording and an AI performance report." },
  { icon: Flame, title: "Streaks & XP", description: "Levels, badges and a GitHub-style heatmap that turn daily practice into a habit." },
];

const TESTIMONIALS = [
  { name: "Priya S.", role: "SDE @ a FAANG company", quote: "The AI mentor is the closest thing to having a senior engineer next to you. It nudged me toward the pattern without spoiling the answer — that's how I finally internalized sliding window." },
  { name: "Marcus T.", role: "Frontend Engineer", quote: "Every other platform ignores frontend folks. The sandbox challenges with AI design review are exactly what I practiced before my React interviews." },
  { name: "Aditi R.", role: "CS Student", quote: "The streak heatmap is dangerously motivating. 94 days and counting — and I went from failing easies to clearing mediums in one sitting." },
];

const FAQS = [
  { q: "Is CodeForge AI really free?", a: "Yes. Solving problems, frontend challenges, contests, roadmaps and the AI mentor are all free. You just need an account." },
  { q: "Which languages can I solve problems in?", a: "JavaScript, TypeScript, Python, Java, C, C++, C#, Go, PHP, Rust, Kotlin and Swift — all executed in a secure cloud sandbox." },
  { q: "How does the AI mentor work?", a: "It sees the problem and your current code, so it can explain the statement, give progressive hints, debug failing tests, analyze complexity and suggest optimizations — without dumping the full solution unless you ask." },
  { q: "Can I prepare for a specific company?", a: "Yes. Pick a company set (Google, Amazon, Microsoft, Meta, Netflix, Uber, Atlassian) and track your progress against its question patterns." },
];

const FOOTER_COLUMNS = [
  { heading: "Platform", links: [
    { label: "Problems", href: "/problems" },
    { label: "Frontend Challenges", href: "/challenges" },
    { label: "Contests", href: "/contests" },
    { label: "Roadmaps", href: "/roadmaps" },
    { label: "Leaderboard", href: "/leaderboard" },
  ]},
  { heading: "Prepare", links: [
    { label: "Company Prep", href: "/companies" },
    { label: "Mock Interviews", href: "/interview" },
    { label: "Generate Questions", href: "/generate" },
    { label: "Dashboard", href: "/dashboard" },
  ]},
  { heading: "Account", links: [
    { label: "Sign in", href: "/login" },
    { label: "Create account", href: "/register" },
    { label: "Settings", href: "/settings" },
  ]},
];

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

/* ── 3D / motion building blocks ─────────────────────────────────── */

/** Mouse-tracking 3D tilt wrapper */
function TiltCard({ children, className, max = 8 }: { children: React.ReactNode; className?: string; max?: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [max, -max]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-max, max]), { stiffness: 200, damping: 20 });

  return (
    <div style={{ perspective: 1200 }} className={className}>
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          x.set((event.clientX - rect.left) / rect.width - 0.5);
          y.set((event.clientY - rect.top) / rect.height - 0.5);
        }}
        onMouseLeave={() => {
          x.set(0);
          y.set(0);
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Count-up number that animates when scrolled into view */
function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

/** Pure-CSS rotating 3D cube */
function Cube3D({ size = 88, className }: { size?: number; className?: string }) {
  const half = size / 2;
  const faces: { transform: string; label: string }[] = [
    { transform: `rotateY(0deg) translateZ(${half}px)`, label: "{ }" },
    { transform: `rotateY(90deg) translateZ(${half}px)`, label: "</>" },
    { transform: `rotateY(180deg) translateZ(${half}px)`, label: "λ" },
    { transform: `rotateY(-90deg) translateZ(${half}px)`, label: "fn" },
    { transform: `rotateX(90deg) translateZ(${half}px)`, label: "++" },
    { transform: `rotateX(-90deg) translateZ(${half}px)`, label: "()" },
  ];

  return (
    <div className={cn("pointer-events-none", className)} style={{ width: size, height: size, perspective: 600 }} aria-hidden>
      <div className="cube-3d relative h-full w-full">
        {faces.map((face) => (
          <div key={face.label} className="cube-face" style={{ transform: face.transform, fontSize: size / 5 }}>
            {face.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── page ────────────────────────────────────────────────────────── */

export function Landing({
  signedIn,
  problems,
  totalProblems,
}: {
  signedIn: boolean;
  problems: LandingProblem[];
  totalProblems: number;
}) {
  const ctaHref = signedIn ? "/dashboard" : "/register";
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const floatSlow = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const floatFast = useTransform(scrollYProgress, [0, 1], [0, -120]);

  return (
    <div className="min-h-svh bg-background">
      {/* ── header ── */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <Link href="/problems" className="flex items-center gap-1 hover:text-foreground">
              Problems
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                {totalProblems > 0 ? totalProblems : "new"}
              </span>
            </Link>
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how-it-works" className="hover:text-foreground">How it works</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {signedIn ? (
              <Button asChild size="sm">
                <Link href="/dashboard">Dashboard <ArrowRight className="size-4" /></Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* ── hero ── */}
        <section ref={heroRef} className="relative overflow-hidden border-b">
          <div aria-hidden className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
          <motion.div style={{ y: floatSlow }} aria-hidden className="absolute -right-10 top-24 hidden lg:block">
            <Cube3D size={96} className="animate-float opacity-80" />
          </motion.div>
          <motion.div style={{ y: floatFast }} aria-hidden className="absolute left-6 bottom-16 hidden xl:block">
            <Cube3D size={56} className="opacity-40" />
          </motion.div>

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
              <Badge variant="outline" className="mb-5 gap-1.5 border-primary/40 bg-primary/5 px-3 py-1 text-primary">
                <Sparkles className="size-3.5" />
                AI-powered interview preparation
              </Badge>
              <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl xl:text-[4.2rem]">
                Forge your skills.
                <br />
                <span className="relative inline-block text-primary">
                  Ace the interview.
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.7, delay: 0.6 }}
                    className="absolute -bottom-1.5 left-0 h-1.5 w-full origin-left rounded-full bg-primary/30 sm:-bottom-2"
                  />
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-pretty text-lg text-muted-foreground">
                {APP_NAME} combines LeetCode-style problems, hands-on frontend challenges,
                contests and a personal AI mentor — in one focused, free platform.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="h-12 px-6 text-base shadow-[4px_4px_0_0] shadow-foreground transition-shadow hover:shadow-[2px_2px_0_0]">
                  <Link href={ctaHref}>Start solving free <ArrowRight className="size-4" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base">
                  <Link href="/problems"><Play className="size-4" /> Browse problems</Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {["No credit card", "12 languages", "AI mentor included"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-primary" /> {item}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* hero 3D code window */}
            <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="relative mx-auto w-full max-w-lg">
              <TiltCard max={7}>
                <div className="overflow-hidden rounded-xl border-2 border-foreground/80 bg-card shadow-[10px_10px_0_0] shadow-primary">
                  <div className="flex items-center gap-1.5 border-b bg-muted px-4 py-2.5">
                    <span className="size-2.5 rounded-full bg-hard" />
                    <span className="size-2.5 rounded-full bg-medium" />
                    <span className="size-2.5 rounded-full bg-easy" />
                    <span className="ml-3 font-mono text-xs text-muted-foreground">two-sum.js</span>
                    <motion.span
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.4, type: "spring", stiffness: 300 }}
                      className="ml-auto rounded bg-easy/15 px-1.5 py-0.5 text-[10px] font-semibold text-easy"
                    >
                      ACCEPTED
                    </motion.span>
                  </div>
                  <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed sm:text-[13px]">
                    <code>
                      <span className="text-primary">function</span>{" twoSum(nums, target) {\n"}
                      {"  "}<span className="text-primary">const</span>{" seen = "}<span className="text-primary">new</span>{" Map();\n"}
                      {"  "}<span className="text-primary">for</span>{" (let i = 0; i < nums.length; i++) {\n"}
                      {"    "}<span className="text-primary">const</span>{" need = target - nums[i];\n"}
                      {"    "}<span className="text-primary">if</span>{" (seen.has(need))\n"}
                      {"      "}<span className="text-primary">return</span>{" [seen.get(need), i];\n"}
                      {"    seen.set(nums[i], i);\n"}
                      {"  }\n"}
                      {"}\n\n"}
                      <span className="text-muted-foreground">{"// ✓ 12/12 tests · O(n) time · O(n) space"}</span>
                    </code>
                  </pre>
                </div>
              </TiltCard>

              {/* floating reward cards with parallax */}
              <motion.div style={{ y: floatFast }} className="absolute -left-4 -top-5 sm:-left-10">
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="flex items-center gap-2 rounded-lg border-2 border-foreground/80 bg-background px-3 py-2 shadow-[4px_4px_0_0] shadow-foreground/80">
                  <Zap className="size-4 text-primary" />
                  <span className="text-sm font-bold">+25 XP</span>
                </motion.div>
              </motion.div>
              <motion.div style={{ y: floatSlow }} className="absolute -bottom-5 -right-3 sm:-right-8">
                <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }} className="flex items-center gap-2 rounded-lg border-2 border-foreground/80 bg-background px-3 py-2 shadow-[4px_4px_0_0] shadow-foreground/80">
                  <Flame className="size-4 text-primary" />
                  <span className="text-sm font-bold">14-day streak</span>
                </motion.div>
              </motion.div>
              <motion.div style={{ y: floatFast }} className="absolute -right-2 top-1/4 hidden sm:block lg:-right-12">
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.1 }} className="flex items-center gap-2 rounded-lg border-2 border-foreground/80 bg-primary px-3 py-2 text-primary-foreground shadow-[4px_4px_0_0] shadow-foreground/80">
                  <Award className="size-4" />
                  <span className="text-sm font-bold">Badge earned!</span>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {/* language marquee */}
          <div className="relative border-t bg-muted/40 py-3">
            <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
              <div className="animate-marquee flex w-max gap-3 hover:[animation-play-state:paused]">
                {[...LANGUAGES, ...LANGUAGES].map((language, index) => (
                  <span key={`${language.id}-${index}`} className="flex shrink-0 items-center gap-2 rounded-full border bg-background px-3.5 py-1.5 text-xs font-semibold">
                    <span className="flex size-5 items-center justify-center rounded bg-foreground font-mono text-[9px] font-bold text-background">
                      {language.extension.slice(0, 2).toUpperCase()}
                    </span>
                    {language.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* animated stats strip */}
          <div className="bg-foreground text-background">
            <div className="mx-auto grid max-w-6xl grid-cols-2 px-4 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="px-4 py-6 text-center">
                  <p className="text-3xl font-bold text-primary sm:text-4xl">
                    <CountUp value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide opacity-70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── live problems ── */}
        {problems.length > 0 && (
          <section id="problems" className="border-b">
            <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 lg:grid-cols-[1fr_1.3fr]">
              <motion.div {...fadeUp}>
                <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">Problem bank</p>
                <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                  {totalProblems}+ real interview questions, ready to run
                </h2>
                <p className="mt-4 text-muted-foreground">
                  DSA classics, JavaScript deep-dives and React pattern exercises — every
                  problem executes against hidden test cases in the cloud, no setup needed.
                </p>
                <Button asChild size="lg" className="mt-6">
                  <Link href="/problems">
                    Browse all problems <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </motion.div>

              <div className="overflow-hidden rounded-xl border-2 border-foreground/15">
                {problems.map((problem, index) => (
                  <motion.div
                    key={problem.slug}
                    initial={{ opacity: 0, x: 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                  >
                    <Link
                      href={`/problems/${problem.slug}`}
                      className={cn(
                        "group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-primary/5",
                        index % 2 === 1 && "bg-muted/30",
                      )}
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold group-hover:text-primary">
                          {problem.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{problem.category}</p>
                      </div>
                      <DifficultyBadge difficulty={problem.difficulty} />
                      <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── how it works ── */}
        <section id="how-it-works" className="border-b bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <SectionHeading eyebrow="How it works" title="From zero to offer in three steps" subtitle="No setup, no installs — everything runs in your browser." />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <motion.div key={step.title} {...fadeUp} transition={{ duration: 0.45, delay: index * 0.1 }}>
                  <TiltCard max={5}>
                    <div className="relative h-full rounded-xl border-2 border-foreground/15 bg-card p-6 transition-colors hover:border-primary">
                      <span className="absolute -top-4 left-6 flex size-8 items-center justify-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                      <step.icon className="mb-4 mt-2 size-7 text-primary" />
                      <h3 className="mb-2 font-semibold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </TiltCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── features ── */}
        <section id="features" className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <SectionHeading eyebrow="Features" title="Everything you need to get hired" subtitle="One platform for algorithms, frontend skills and interview confidence." />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  {...fadeUp}
                  transition={{ duration: 0.4, delay: (index % 4) * 0.07 }}
                  whileHover={{ y: -6 }}
                  className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary hover:shadow-[5px_5px_0_0] hover:shadow-primary"
                >
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary">
                    <feature.icon className="size-5 text-primary transition-colors group-hover:text-primary-foreground" />
                  </div>
                  <h3 className="mb-1.5 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AI mentor showcase ── */}
        <section className="border-b bg-muted/40">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2">
            <motion.div {...fadeUp}>
              <Badge variant="outline" className="mb-4 border-primary/40 bg-primary/5 text-primary">
                <Bot className="size-3.5" /> AI Mentor
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight">Like pair-programming with a senior engineer</h2>
              <p className="mt-4 text-muted-foreground">
                The mentor sees the problem and your code. Ask why your solution fails,
                request a hint that doesn&apos;t spoil the answer, or get a complexity
                breakdown — all streamed live next to your editor.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {["Progressive 3-level hints that teach, not tell", "Root-cause debugging from your failing test output", "Big-O time & space analysis of your exact code", "Interview coaching mode for mock sessions"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" /> {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div {...fadeUp}>
              <TiltCard max={6}>
                <div className="rounded-xl border-2 border-foreground/80 bg-card shadow-[8px_8px_0_0] shadow-foreground/80">
                  <div className="flex items-center gap-2 border-b px-4 py-3">
                    <Bot className="size-4 text-primary" />
                    <span className="text-sm font-semibold">AI Mentor</span>
                    <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="size-1.5 animate-pulse rounded-full bg-easy" /> online
                    </span>
                  </div>
                  <div className="space-y-3 p-4 text-sm">
                    <div className="ml-10 rounded-lg bg-primary px-3 py-2 text-primary-foreground">Why is my solution failing on test 3?</div>
                    <div className="mr-6 rounded-lg border bg-muted/50 px-3 py-2">
                      Your loop starts at <code className="rounded bg-muted px-1 font-mono text-xs">i = 1</code>, so the first element is never checked. Start at <code className="rounded bg-muted px-1 font-mono text-xs">i = 0</code> and you&apos;ll pass all 12 tests.
                    </div>
                    <div className="ml-10 rounded-lg bg-primary px-3 py-2 text-primary-foreground">What&apos;s the complexity now?</div>
                    <div className="mr-6 rounded-lg border bg-muted/50 px-3 py-2">
                      <strong>O(n)</strong> time — one pass with a hash map. <strong>O(n)</strong> space. That&apos;s optimal. 🎯
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["Explain problem", "Hint", "Optimize", "Complexity"].map((chip) => (
                        <span key={chip} className="rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground">{chip}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          </div>
        </section>

        {/* ── testimonials ── */}
        <section className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <SectionHeading eyebrow="Loved by coders" title="Don't just take our word for it" />
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {TESTIMONIALS.map((testimonial, index) => (
                <motion.figure key={testimonial.name} {...fadeUp} transition={{ duration: 0.4, delay: index * 0.1 }} whileHover={{ y: -4 }} className="flex h-full flex-col rounded-xl border bg-card p-6">
                  <MessageSquareText className="mb-4 size-5 text-primary" />
                  <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">“{testimonial.quote}”</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t pt-4">
                    <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{testimonial.name[0]}</span>
                    <span>
                      <span className="block text-sm font-semibold">{testimonial.name}</span>
                      <span className="block text-xs text-muted-foreground">{testimonial.role}</span>
                    </span>
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="border-b bg-muted/40">
          <div className="mx-auto max-w-3xl px-4 py-20">
            <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
            <div className="mt-10 space-y-3">
              {FAQS.map((faq) => (
                <motion.details key={faq.q} {...fadeUp} className="group rounded-xl border bg-card px-5 py-4 open:border-primary">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">{faq.a}</p>
                </motion.details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="relative overflow-hidden bg-foreground text-background">
          <div aria-hidden className="bg-dots absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
          <div className="absolute right-8 top-8 hidden md:block" aria-hidden>
            <Cube3D size={64} className="opacity-70" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 py-20 text-center">
            <motion.div {...fadeUp}>
              <Flame className="mx-auto mb-5 size-10 text-primary" />
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Your next offer starts with the next problem.
              </h2>
              <p className="mx-auto mt-4 max-w-md opacity-70">
                Free forever. No credit card. Just you, the editor and an AI mentor that never sleeps.
              </p>
              <Button asChild size="lg" className="mt-8 h-12 px-8 text-base">
                <Link href={ctaHref}>Create your free account <ArrowRight className="size-4" /></Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ── footer ── */}
      <footer className="border-t bg-background">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Logo />
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                The AI-powered platform for mastering data structures, algorithms and
                frontend engineering — built for your next interview.
              </p>
              <div className="mt-5 flex gap-2">
                {[
                  { icon: GitHubIcon, label: "GitHub" },
                  { icon: XIcon, label: "Twitter / X" },
                  { icon: YouTubeIcon, label: "YouTube" },
                ].map((social) => (
                  <a key={social.label} href="#" aria-label={social.label} className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground">
                    <social.icon className="size-4" />
                  </a>
                ))}
              </div>
            </div>
            {FOOTER_COLUMNS.map((column) => (
              <nav key={column.heading} aria-label={column.heading}>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide">{column.heading}</h3>
                <ul className="space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="border-t">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} {APP_NAME}. Built for coders, by coders.</p>
            <p className="flex items-center gap-1.5">Crafted with <span className="text-primary">⚒</span> and an unhealthy amount of practice problems.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
      <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">{eyebrow}</p>
      <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </motion.div>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.34 1.12 2.91.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.04 10.04 0 0 0 22 12.25C22 6.58 17.52 2 12 2" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12z" />
    </svg>
  );
}
