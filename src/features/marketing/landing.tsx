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
  BarChart3,
  BookOpen,
  Bookmark,
  Bot,
  Braces,
  Brain,
  Building2,
  CheckCircle2,
  ChevronDown,
  Code2,
  FileText,
  Flame,
  GraduationCap,
  LineChart,
  Map,
  MessageSquare,
  MessageSquareText,
  MonitorPlay,
  Paintbrush,
  RefreshCw,
  Sparkles,
  StickyNote,
  Target,
  Trophy,
  UserPlus,
  Users,
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
  { value: 26, suffix: "+", label: "Platform features" },
  { value: 9, suffix: "", label: "AI-powered tools" },
];

const STEPS = [
  { icon: UserPlus, title: "Create your free account", description: "Sign up with email, Google or GitHub. Pick your track — DSA, frontend, or both." },
  { icon: Code2, title: "Solve real interview problems", description: "Code in a full VS Code-style editor, run against hidden test cases, get instant verdicts." },
  { icon: Trophy, title: "Level up and get hired", description: "Earn XP, keep your streak alive, climb the leaderboard and walk into interviews prepared." },
];

const FEATURE_GROUPS = [
  {
    group: "Core Platform",
    color: "text-primary",
    bg: "bg-primary/5 border-primary/20",
    icon: Code2,
    features: [
      { icon: Braces, title: "DSA Problems", description: "Curated interview questions in 12 languages with hidden test cases, instant verdicts and editorials." },
      { icon: Paintbrush, title: "Frontend Challenges", description: "Build real UIs in an in-browser sandbox with live preview, console and design review." },
      { icon: MonitorPlay, title: "Mock Interviews", description: "Timed sessions with a question queue and AI performance report." },
      { icon: Trophy, title: "Contests", description: "Weekly contests, daily challenges and live leaderboards." },
      { icon: Building2, title: "Company Prep", description: "Question sets modeled on Google, Amazon, Meta and more." },
      { icon: Map, title: "Learning Roadmaps", description: "Structured paths from arrays to DP and from HTML to architecture." },
    ],
  },
  {
    group: "AI Suite",
    color: "text-purple-500",
    bg: "bg-purple-500/5 border-purple-500/20",
    icon: Sparkles,
    features: [
      { icon: Bot, title: "AI Mentor", description: "Progressive hints, complexity analysis and debugging inside the editor." },
      { icon: Users, title: "AI Pair Programmer", description: "Real-time streaming AI co-pilot that thinks through problems with you." },
      { icon: GraduationCap, title: "AI Learning Coach", description: "Personalized coaching based on your solving history and weak areas." },
      { icon: BookOpen, title: "AI Study Planner", description: "Multi-week personalized study plans based on your goal and schedule." },
      { icon: Map, title: "AI Roadmap Generator", description: "Enter any career goal and get a phased learning roadmap instantly." },
      { icon: BarChart3, title: "Complexity Visualizer", description: "Paste code and get a detailed Big-O time & space analysis with loop breakdown." },
      { icon: Trophy, title: "AI Contest Generator", description: "Generate custom coding contests on any theme in seconds." },
      { icon: FileText, title: "AI Resume Analyzer", description: "ATS score, missing keywords and improvement suggestions for your resume." },
      { icon: Code2, title: "AI Code Reviewer", description: "Correctness, readability, performance and best practices scored out of 10." },
    ],
  },
  {
    group: "Community",
    color: "text-blue-500",
    bg: "bg-blue-500/5 border-blue-500/20",
    icon: MessageSquare,
    features: [
      { icon: MessageSquare, title: "Discussion Forum", description: "Per-problem threads with solutions, Q&A, upvotes and AI summaries." },
      { icon: StickyNote, title: "Personal Notes", description: "Private markdown notes attached to each problem. Save learning points." },
      { icon: Bookmark, title: "Bookmarks", description: "Save problems and challenges to review-later lists." },
      { icon: Users, title: "Follow System", description: "Follow top coders, view activity feed and public achievements." },
    ],
  },
  {
    group: "Learning Intelligence",
    color: "text-green-600",
    bg: "bg-green-500/5 border-green-500/20",
    icon: Brain,
    features: [
      { icon: Target, title: "Weakness Detection", description: "Analyze your acceptance rate per category and get targeted recommendations." },
      { icon: Brain, title: "Smart Revision", description: "SM-2 spaced repetition — review cards at the scientifically optimal moment." },
      { icon: LineChart, title: "Skill Analytics", description: "Topic mastery map, trend analysis and interview readiness prediction." },
      { icon: Zap, title: "Daily Plan", description: "Auto-generated daily problem set based on your weaknesses and history." },
    ],
  },
  {
    group: "Gamification",
    color: "text-orange-500",
    bg: "bg-orange-500/5 border-orange-500/20",
    icon: Flame,
    features: [
      { icon: Flame, title: "Daily Streaks", description: "Maintain streaks to earn bonus XP and unlock exclusive achievements." },
      { icon: Zap, title: "XP & Levels", description: "Earn XP for every problem solved, level up and show your rank." },
      { icon: Award, title: "Achievement Badges", description: "Unlock 30+ badges for milestones: first solve, 100-day streak, speed runs." },
      { icon: Trophy, title: "Leaderboard", description: "Compete globally or with friends on weekly and all-time leaderboards." },
    ],
  },
];

const TESTIMONIALS = [
  { name: "Priya S.", role: "SDE @ a FAANG company", quote: "The AI mentor is the closest thing to having a senior engineer next to you. It nudged me toward the pattern without spoiling the answer — that's how I finally internalized sliding window." },
  { name: "Marcus T.", role: "Frontend Engineer", quote: "Every other platform ignores frontend folks. The sandbox challenges with AI design review are exactly what I practiced before my React interviews." },
  { name: "Aditi R.", role: "CS Student", quote: "The streak heatmap is dangerously motivating. 94 days and counting — and I went from failing easies to clearing mediums in one sitting." },
  { name: "Rohan K.", role: "Backend Dev → SDE-2", quote: "The AI Pair Programmer and the Spaced Repetition system together changed how I retain algorithms. I stopped forgetting patterns after 2 weeks." },
  { name: "Sara M.", role: "Final Year Student", quote: "Generated my entire 8-week study plan in 30 seconds with AI Study Planner. It even accounted for my weak topics. Incredible." },
  { name: "James L.", role: "Senior SDE", quote: "The weakness detection pinpointed that my graph acceptance rate was 20%. Focused there for 3 weeks and now it's 85%. Data-driven practice works." },
];

const FAQS = [
  { q: "Is CodeForge AI really free?", a: "Yes. Solving problems, frontend challenges, contests, roadmaps, all AI tools and the discussion forum are completely free. Just create an account." },
  { q: "Which languages can I solve problems in?", a: "JavaScript, TypeScript, Python, Java, C, C++, C#, Go, PHP, Rust, Kotlin and Swift — all executed in a secure cloud sandbox." },
  { q: "How does the AI mentor work?", a: "It sees the problem and your current code, giving you hints, debugging help, complexity analysis and coaching without dumping the full solution." },
  { q: "What is spaced repetition and how does it work?", a: "The SM-2 algorithm schedules problem reviews at increasing intervals based on how well you recalled the solution. You'll review Two Sum at day 1, then day 6, then day 14 — cementing the pattern." },
  { q: "Can I prepare for a specific company?", a: "Yes. Pick a company set (Google, Amazon, Microsoft, Meta, Netflix, Uber, Atlassian) and track your progress against its question patterns." },
  { q: "What is the AI Pair Programmer?", a: "It's a real-time streaming AI that reads your code and converses with you — suggest approaches, debug errors, explain concepts and review your solution, just like a teammate would." },
];

const FOOTER_COLUMNS = [
  { heading: "Platform", links: [
    { label: "Problems", href: "/problems" },
    { label: "Frontend Challenges", href: "/challenges" },
    { label: "Contests", href: "/contests" },
    { label: "Roadmaps", href: "/roadmaps" },
    { label: "Leaderboard", href: "/leaderboard" },
  ]},
  { heading: "Learn", links: [
    { label: "Weakness Detection", href: "/weakness" },
    { label: "Smart Revision", href: "/revision" },
    { label: "Skill Analytics", href: "/analytics" },
    { label: "Daily Plan", href: "/weakness" },
  ]},
  { heading: "AI Tools", links: [
    { label: "Learning Coach", href: "/ai-tools" },
    { label: "Pair Programmer", href: "/ai-tools" },
    { label: "Study Planner", href: "/ai-tools" },
    { label: "Roadmap Generator", href: "/ai-tools" },
    { label: "Resume Analyzer", href: "/ai-tools" },
  ]},
  { heading: "Community", links: [
    { label: "Forum", href: "/forum" },
    { label: "Discussions", href: "/discuss" },
    { label: "My Notes", href: "/notes" },
    { label: "Bookmarks", href: "/bookmarks" },
    { label: "Company Prep", href: "/companies" },
    { label: "Mock Interviews", href: "/interview" },
  ]},
];

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

/* ── motion building blocks ────────────────────────────────────── */

function TiltCard({ children, className, max = 8 }: { children: React.ReactNode; className?: string; max?: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [max, -max]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-max, max]), { stiffness: 200, damping: 20 });
  return (
    <div style={{ perspective: 1200 }} className={className}>
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); x.set((e.clientX - r.left) / r.width - 0.5); y.set((e.clientY - r.top) / r.height - 0.5); }}
        onMouseLeave={() => { x.set(0); y.set(0); }}
      >{children}</motion.div>
    </div>
  );
}

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, { duration: 1.2, ease: "easeOut", onUpdate: (v) => setDisplay(Math.round(v)) });
    return () => controls.stop();
  }, [inView, value]);
  return <span ref={ref}>{display}{suffix}</span>;
}

function Cube3D({ size = 88, className }: { size?: number; className?: string }) {
  const half = size / 2;
  const faces = [
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
        {faces.map((f) => <div key={f.label} className="cube-face" style={{ transform: f.transform, fontSize: size / 5 }}>{f.label}</div>)}
      </div>
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

/* ── page ────────────────────────────────────────────────────────── */

export function Landing({ signedIn, problems, totalProblems }: { signedIn: boolean; problems: LandingProblem[]; totalProblems: number }) {
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
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">{totalProblems > 0 ? totalProblems : "new"}</span>
            </Link>
            <Link href="/forum" className="hover:text-foreground">Forum</Link>
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#ai" className="hover:text-foreground">AI Suite</a>
            <a href="#how-it-works" className="hover:text-foreground">How it works</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {signedIn ? (
              <Button asChild size="sm"><Link href="/dashboard">Dashboard <ArrowRight className="size-4" /></Link></Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link href="/login">Sign in</Link></Button>
                <Button asChild size="sm"><Link href="/register">Get started</Link></Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* ── hero ── */}
        <section ref={heroRef} className="relative overflow-hidden border-b">
          <div aria-hidden className="bg-dots absolute inset-0 mask-[radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
          <motion.div style={{ y: floatSlow }} aria-hidden className="absolute -right-10 top-24 hidden lg:block">
            <Cube3D size={96} className="animate-float opacity-80" />
          </motion.div>
          <motion.div style={{ y: floatFast }} aria-hidden className="absolute left-6 bottom-16 hidden xl:block">
            <Cube3D size={56} className="opacity-40" />
          </motion.div>

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
              <Badge variant="outline" className="mb-5 gap-1.5 border-primary/40 bg-primary/5 px-3 py-1 text-primary">
                <Sparkles className="size-3.5" /> 26+ features · 9 AI tools · 100% free
              </Badge>
              <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl xl:text-[4.2rem]">
                Forge your skills.
                <br />
                <span className="relative inline-block text-primary">
                  Ace the interview.
                  <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.7, delay: 0.6 }} className="absolute -bottom-1.5 left-0 h-1.5 w-full origin-left rounded-full bg-primary/30 sm:-bottom-2" />
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-pretty text-lg text-muted-foreground">
                {APP_NAME} combines LeetCode-style problems, AI pair programming, spaced repetition, discussion forums, skill analytics and 9 AI tools — all in one focused, free platform.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="h-12 px-6 text-base shadow-[4px_4px_0_0] shadow-foreground transition-shadow hover:shadow-[2px_2px_0_0]">
                  <Link href={ctaHref}>Start solving free <ArrowRight className="size-4" /></Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {["No credit card", "12 languages", "9 AI tools", "Community forum"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-primary" /> {item}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="relative mx-auto w-full max-w-lg">
              <TiltCard max={7}>
                <div className="overflow-hidden rounded-xl border-2 border-foreground/80 bg-card shadow-[10px_10px_0_0] shadow-primary">
                  <div className="flex items-center gap-1.5 border-b bg-muted px-4 py-2.5">
                    <span className="size-2.5 rounded-full bg-hard" />
                    <span className="size-2.5 rounded-full bg-medium" />
                    <span className="size-2.5 rounded-full bg-easy" />
                    <span className="ml-3 font-mono text-xs text-muted-foreground">two-sum.js</span>
                    <motion.span initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.4, type: "spring", stiffness: 300 }} className="ml-auto rounded bg-easy/15 px-1.5 py-0.5 text-[10px] font-semibold text-easy">ACCEPTED</motion.span>
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
              <motion.div style={{ y: floatFast }} className="absolute -left-4 -top-5 sm:-left-10">
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="flex items-center gap-2 rounded-lg border-2 border-foreground/80 bg-background px-3 py-2 shadow-[4px_4px_0_0] shadow-foreground/80">
                  <Zap className="size-4 text-primary" /><span className="text-sm font-bold">+25 XP</span>
                </motion.div>
              </motion.div>
              <motion.div style={{ y: floatSlow }} className="absolute -bottom-5 -right-3 sm:-right-8">
                <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }} className="flex items-center gap-2 rounded-lg border-2 border-foreground/80 bg-background px-3 py-2 shadow-[4px_4px_0_0] shadow-foreground/80">
                  <Flame className="size-4 text-primary" /><span className="text-sm font-bold">14-day streak</span>
                </motion.div>
              </motion.div>
              <motion.div style={{ y: floatFast }} className="absolute -right-2 top-1/4 hidden sm:block lg:-right-12">
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.1 }} className="flex items-center gap-2 rounded-lg border-2 border-foreground/80 bg-primary px-3 py-2 text-primary-foreground shadow-[4px_4px_0_0] shadow-foreground/80">
                  <Award className="size-4" /><span className="text-sm font-bold">Badge earned!</span>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {/* language marquee */}
          <div className="relative border-t bg-muted/40 py-3">
            <div className="overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
              <div className="animate-marquee flex w-max gap-3 hover:paused">
                {[...LANGUAGES, ...LANGUAGES].map((language, index) => (
                  <span key={`${language.id}-${index}`} className="flex shrink-0 items-center gap-2 rounded-full border bg-background px-3.5 py-1.5 text-xs font-semibold">
                    <span className="flex size-5 items-center justify-center rounded bg-foreground font-mono text-[9px] font-bold text-background">{language.extension.slice(0, 2).toUpperCase()}</span>
                    {language.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* stats strip */}
          <div className="bg-foreground text-background">
            <div className="mx-auto grid max-w-6xl grid-cols-2 px-4 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="px-4 py-6 text-center">
                  <p className="text-3xl font-bold text-primary sm:text-4xl"><CountUp value={stat.value} suffix={stat.suffix} /></p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide opacity-70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── all features ── */}
        <section id="features" className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <SectionHeading eyebrow="Everything included" title="26+ features. Zero paywalls." subtitle="One platform for algorithms, frontend, AI tools, community and analytics — completely free." />
            <div className="mt-14 space-y-14">
              {FEATURE_GROUPS.map((group, gi) => (
                <motion.div key={group.group} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, delay: gi * 0.05 }}>
                  <div className="mb-6 flex items-center gap-3">
                    <div className={cn("flex size-8 items-center justify-center rounded-lg border", group.bg)}>
                      <group.icon className={cn("size-4", group.color)} />
                    </div>
                    <h3 className={cn("text-lg font-bold", group.color)}>{group.group}</h3>
                    <div className="flex-1 border-t" />
                    <span className="text-xs text-muted-foreground">{group.features.length} features</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.features.map((feature, fi) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.35, delay: fi * 0.04 }}
                        whileHover={{ y: -4 }}
                        className={cn("group rounded-xl border p-4 transition-all hover:shadow-[4px_4px_0_0] hover:shadow-primary", group.bg)}
                      >
                        <div className={cn("mb-2.5 flex size-8 items-center justify-center rounded-lg bg-background/80")}>
                          <feature.icon className={cn("size-4", group.color)} />
                        </div>
                        <h4 className="mb-1 text-sm font-semibold">{feature.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── live problems ── */}
        {problems.length > 0 && (
          <section id="problems" className="border-b bg-muted/40">
            <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 lg:grid-cols-[1fr_1.3fr]">
              <motion.div {...fadeUp}>
                <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">Problem bank</p>
                <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{totalProblems}+ real interview questions, ready to run</h2>
                <p className="mt-4 text-muted-foreground">DSA classics, JavaScript deep-dives and React pattern exercises — every problem executes against hidden test cases in the cloud, no setup needed.</p>
                <Button asChild size="lg" className="mt-6"><Link href="/problems">Browse all problems <ArrowRight className="size-4" /></Link></Button>
              </motion.div>
              <div className="overflow-hidden rounded-xl border-2 border-foreground/15">
                {problems.map((problem, index) => (
                  <motion.div key={problem.slug} initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.4, delay: index * 0.08 }}>
                    <Link href={`/problems/${problem.slug}`} className={cn("group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-primary/5", index % 2 === 1 && "bg-muted/30")}>
                      <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold group-hover:text-primary">{problem.title}</p>
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

        {/* ── AI suite spotlight ── */}
        <section id="ai" className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <SectionHeading eyebrow="AI Suite" title="9 AI tools. One platform." subtitle="From personalized coaching to pair programming — AI is woven into every part of your practice." />
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              <motion.div {...fadeUp} transition={{ delay: 0 }}>
                <TiltCard max={6}>
                  <div className="rounded-xl border-2 border-foreground/80 bg-card shadow-[8px_8px_0_0] shadow-foreground/80 h-full">
                    <div className="flex items-center gap-2 border-b px-4 py-3">
                      <Bot className="size-4 text-primary" />
                      <span className="text-sm font-semibold">AI Mentor</span>
                      <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-1.5 animate-pulse rounded-full bg-easy" /> live</span>
                    </div>
                    <div className="space-y-3 p-4 text-sm">
                      <div className="ml-8 rounded-lg bg-primary px-3 py-2 text-primary-foreground text-xs">Why is my solution O(n²)?</div>
                      <div className="mr-4 rounded-lg border bg-muted/50 px-3 py-2 text-xs">Your nested loop checks every pair. Use a hash map to look up complements in O(1) — bringing it to <strong>O(n)</strong>. 🎯</div>
                      <div className="flex flex-wrap gap-1.5">
                        {["Hint", "Debug", "Complexity", "Optimize"].map((c) => <span key={c} className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">{c}</span>)}
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>

              <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
                <TiltCard max={6}>
                  <div className="rounded-xl border-2 border-foreground/80 bg-card shadow-[8px_8px_0_0] shadow-primary h-full">
                    <div className="flex items-center gap-2 border-b px-4 py-3">
                      <Users className="size-4 text-primary" />
                      <span className="text-sm font-semibold">AI Pair Programmer</span>
                      <span className="ml-auto text-xs text-primary font-semibold">streaming</span>
                    </div>
                    <div className="space-y-3 p-4 text-sm">
                      <div className="ml-8 rounded-lg bg-primary px-3 py-2 text-primary-foreground text-xs">My DFS keeps timing out on large graphs</div>
                      <div className="mr-4 rounded-lg border bg-muted/50 px-3 py-2 text-xs">You&apos;re creating a new visited Set inside each call. Move it outside and pass it as a parameter — that&apos;s O(n²) → O(n) right there<span className="inline-block w-1 h-3 bg-foreground animate-pulse ml-0.5 align-middle" /></div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>

              <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
                <TiltCard max={6}>
                  <div className="rounded-xl border-2 border-foreground/80 bg-card shadow-[8px_8px_0_0] shadow-foreground/80 h-full">
                    <div className="flex items-center gap-2 border-b px-4 py-3">
                      <GraduationCap className="size-4 text-primary" />
                      <span className="text-sm font-semibold">Learning Coach</span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                        <p className="text-xs font-semibold text-primary">Interview Readiness</p>
                        <div className="mt-1 flex items-end gap-2">
                          <span className="text-2xl font-black">72</span>
                          <span className="text-xs text-muted-foreground mb-0.5">/100 · Intermediate</span>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs">
                        <p className="text-muted-foreground">🎯 Focus: Dynamic Programming (32% rate)</p>
                        <p className="text-muted-foreground">📅 Ready by: ~6 weeks at current pace</p>
                        <p className="text-muted-foreground">💪 Strong: Arrays (91%), Strings (84%)</p>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── learning intelligence ── */}
        <section className="border-b bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <SectionHeading eyebrow="Learning Intelligence" title="Practice smarter, not just harder" subtitle="Spaced repetition, weakness detection, daily plans and skill analytics to maximize every minute." />
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <motion.div {...fadeUp}>
                <div className="rounded-xl border-2 border-foreground/80 bg-card shadow-[8px_8px_0_0] shadow-foreground/80 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Brain className="size-5 text-primary" />
                    <span className="font-semibold">Smart Revision (Spaced Repetition)</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { title: "Two Sum", next: "Today", interval: 1 },
                      { title: "Binary Search", next: "Tomorrow", interval: 6 },
                      { title: "Merge Intervals", next: "In 14 days", interval: 14 },
                    ].map((card) => (
                      <div key={card.title} className="flex items-center justify-between rounded-lg border bg-background/60 px-3 py-2.5">
                        <span className="text-sm font-medium">{card.title}</span>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs", card.interval === 1 ? "text-primary font-semibold" : "text-muted-foreground")}>{card.next}</span>
                          <RefreshCw className="size-3 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">SM-2 algorithm schedules reviews at the perfect moment for maximum retention</p>
                </div>
              </motion.div>

              <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
                <div className="rounded-xl border-2 border-foreground/80 bg-card shadow-[8px_8px_0_0] shadow-foreground/80 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="size-5 text-primary" />
                    <span className="font-semibold">Skill Analytics & Mastery Map</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { cat: "Arrays", rate: 91, level: "Master" },
                      { cat: "Strings", rate: 84, level: "Expert" },
                      { cat: "Trees", rate: 67, level: "Practitioner" },
                      { cat: "Dynamic Programming", rate: 32, level: "Learner" },
                      { cat: "Graphs", rate: 18, level: "Novice" },
                    ].map((item) => (
                      <div key={item.cat} className="space-y-0.5">
                        <div className="flex justify-between text-xs">
                          <span>{item.cat}</span>
                          <span className={cn("font-semibold", item.rate >= 80 ? "text-easy" : item.rate >= 60 ? "text-primary" : item.rate >= 40 ? "text-medium" : "text-destructive")}>{item.level} · {item.rate}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div className={cn("h-full rounded-full", item.rate >= 80 ? "bg-easy" : item.rate >= 60 ? "bg-primary" : item.rate >= 40 ? "bg-medium" : "bg-destructive")} style={{ width: `${item.rate}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── community ── */}
        <section className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <SectionHeading eyebrow="Community" title="Learn together, grow faster" subtitle="Discussions, notes, bookmarks and activity feeds — a complete social layer for coders." />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: MessageSquare, title: "Discussion Forum", desc: "Per-problem discussions with community solutions, Q&A threads, upvotes and AI-generated summaries.", href: "/discuss" },
                { icon: StickyNote, title: "Personal Notes", desc: "Private markdown notes per problem. Save patterns, approaches and learning insights permanently.", href: "/notes" },
                { icon: Bookmark, title: "Bookmarks", desc: "Save problems and challenges to custom lists. Build your own curated review set.", href: "/bookmarks" },
                { icon: Users, title: "Follow & Feed", desc: "Follow top coders, see their accepted solutions and achievements in your activity feed.", href: "/leaderboard" },
              ].map((item, i) => (
                <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ y: -5 }}>
                  <Link href={item.href} className="group block rounded-xl border bg-card p-5 transition-all hover:border-primary hover:shadow-[4px_4px_0_0] hover:shadow-primary h-full">
                    <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary">
                      <item.icon className="size-5 text-primary transition-colors group-hover:text-primary-foreground" />
                    </div>
                    <h3 className="mb-1.5 font-semibold text-sm">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── gamification ── */}
        <section className="border-b bg-foreground text-background">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center mb-12">
              <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">Gamification</p>
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">Solve problems. Earn rewards. Level up.</h2>
              <p className="mt-3 opacity-70">XP, streaks, badges and leaderboards that turn daily practice into a habit.</p>
            </motion.div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Flame, title: "Streak System", desc: "Miss a day and it resets. Keep it alive for bonus XP and exclusive streak badges.", value: "🔥 94-day streak" },
                { icon: Zap, title: "XP & Levels", desc: "Easy: 10 XP · Medium: 25 XP · Hard: 50 XP. Level up and show off your rank.", value: "⚡ Level 14" },
                { icon: Award, title: "30+ Badges", desc: "Speed Solver, Century Club, Bug Squasher, Polyglot — unlock milestones that matter.", value: "🏅 8 badges" },
                { icon: Trophy, title: "Leaderboard", desc: "Weekly and all-time global leaderboards. Weekly resets keep it competitive for everyone.", value: "🏆 Top 3%" },
              ].map((item, i) => (
                <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }}>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-5 h-full">
                    <item.icon className="mb-3 size-6 text-primary" />
                    <p className="text-xs font-bold text-primary mb-1">{item.value}</p>
                    <h3 className="font-semibold mb-1.5">{item.title}</h3>
                    <p className="text-xs opacity-60 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── how it works ── */}
        <section id="how-it-works" className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <SectionHeading eyebrow="How it works" title="From zero to offer in three steps" subtitle="No setup, no installs — everything runs in your browser." />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <motion.div key={step.title} {...fadeUp} transition={{ duration: 0.45, delay: index * 0.1 }}>
                  <TiltCard max={5}>
                    <div className="relative h-full rounded-xl border-2 border-foreground/15 bg-card p-6 transition-colors hover:border-primary">
                      <span className="absolute -top-4 left-6 flex size-8 items-center justify-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground">{index + 1}</span>
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

        {/* ── testimonials ── */}
        <section className="border-b bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <SectionHeading eyebrow="Loved by coders" title="Don't just take our word for it" />
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {TESTIMONIALS.map((t, index) => (
                <motion.figure key={t.name} {...fadeUp} transition={{ duration: 0.4, delay: (index % 3) * 0.1 }} whileHover={{ y: -4 }} className="flex h-full flex-col rounded-xl border bg-card p-6">
                  <MessageSquareText className="mb-4 size-5 text-primary" />
                  <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">&ldquo;{t.quote}&rdquo;</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t pt-4">
                    <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{t.name[0]}</span>
                    <span>
                      <span className="block text-sm font-semibold">{t.name}</span>
                      <span className="block text-xs text-muted-foreground">{t.role}</span>
                    </span>
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="border-b">
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
          <div aria-hidden className="bg-dots absolute inset-0 opacity-30 mask-[radial-gradient(ellipse_at_center,black,transparent_70%)]" />
          <div className="absolute right-8 top-8 hidden md:block" aria-hidden><Cube3D size={64} className="opacity-70" /></div>
          <div className="relative mx-auto max-w-6xl px-4 py-20 text-center">
            <motion.div {...fadeUp}>
              <Flame className="mx-auto mb-5 size-10 text-primary" />
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">Your next offer starts with the next problem.</h2>
              <p className="mx-auto mt-4 max-w-md opacity-70">Free forever. No credit card. 26+ features. 9 AI tools. Just you, the editor and an AI mentor that never sleeps.</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg" className="h-12 px-8 text-base"><Link href={ctaHref}>Create your free account <ArrowRight className="size-4" /></Link></Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ── footer ── */}
      <footer className="border-t bg-background">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
            <div>
              <Logo />
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">The AI-powered platform for mastering data structures, algorithms and frontend engineering — built for your next interview.</p>
              <div className="mt-5 flex gap-2">
                {[{ icon: GitHubIcon, label: "GitHub" }, { icon: XIcon, label: "Twitter / X" }, { icon: YouTubeIcon, label: "YouTube" }].map((social) => (
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
                    <li key={link.label}><Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">{link.label}</Link></li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="border-t">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} {APP_NAME}. Built for coders, by Setups Works.</p>
            <p className="flex items-center gap-1.5">26+ features · 9 AI tools · 100% free <span className="text-primary">⚒</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.34 1.12 2.91.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.04 10.04 0 0 0 22 12.25C22 6.58 17.52 2 12 2" /></svg>;
}
function XIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
}
function YouTubeIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12z" /></svg>;
}
