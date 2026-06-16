"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronRight,
  Code2,
  Trophy,
  BookOpen,
  Lightbulb,
  Zap,
  Target,
  Flame,
  Rocket,
  Coffee,
  Sprout,
  Star,
} from "lucide-react";

/* ── data ──────────────────────────────────────────────────────── */

const GOALS = [
  { id: "faang", icon: Trophy, label: "Crack FAANG / MAANG", desc: "Google, Amazon, Meta, Apple, Netflix" },
  { id: "competitive", icon: Zap, label: "Competitive Programming", desc: "Codeforces, LeetCode contests, ICPC" },
  { id: "learn-dsa", icon: BookOpen, label: "Learn DSA from Scratch", desc: "Build a strong foundation step by step" },
  { id: "improve", icon: Lightbulb, label: "Improve Problem-Solving", desc: "Get sharper and faster at algorithms" },
];

const LEVELS = [
  { id: "beginner", icon: Sprout, label: "Beginner", desc: "Just getting started with coding challenges", color: "text-green-500" },
  { id: "intermediate", icon: Star, label: "Intermediate", desc: "Comfortable with basics, want to level up", color: "text-blue-500" },
  { id: "advanced", icon: Flame, label: "Advanced", desc: "Experienced, targeting top-tier companies", color: "text-orange-500" },
];

const TOPICS = [
  "Arrays", "Strings", "Linked Lists", "Trees", "Graphs",
  "Dynamic Programming", "Backtracking", "Binary Search",
  "Heap / Priority Queue", "Sliding Window", "Two Pointers",
  "Stack / Queue", "Bit Manipulation", "Greedy", "Math",
  "Sorting", "Tries", "Union Find",
];

const COMPANIES = [
  "Google", "Amazon", "Meta", "Microsoft", "Apple",
  "Netflix", "Uber", "Stripe", "Adobe", "Flipkart",
  "Goldman Sachs", "Atlassian", "Salesforce", "Oracle",
];

const DAILY_GOALS = [
  { value: 1, icon: Coffee, label: "1 / day", tag: "Casual", desc: "Perfect for building a habit slowly" },
  { value: 3, icon: Target, label: "3 / day", tag: "Consistent", desc: "Solid daily practice routine" },
  { value: 5, icon: Rocket, label: "5 / day", tag: "Focused", desc: "Serious preparation mode" },
  { value: 10, icon: Flame, label: "10+ / day", tag: "Intensive", desc: "All-in grind for fast results" },
];

const TOTAL_STEPS = 7; // 0=welcome, 1=goal, 2=level, 3=topics, 4=companies, 5=daily, 6=done

/* ── animation ──────────────────────────────────────────────────── */

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

/* ── component ──────────────────────────────────────────────────── */

export function OnboardingWizard({ name }: { name: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [dailyGoal, setDailyGoal] = useState(3);

  function go(next: number) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  function toggleTopic(t: string) {
    setTopics((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  function toggleCompany(c: string) {
    setCompanies((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }

  async function finish() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, level, topics, companies, dailyGoal }),
      });
      if (!res.ok) throw new Error();
      // Refresh JWT so middleware sees onboardingComplete=true
      await update();
      go(6);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const progress = step === 0 ? 0 : Math.round(((step) / (TOTAL_STEPS - 1)) * 100);

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* top bar */}
      <div className="flex h-14 items-center justify-between px-6 border-b">
        <Logo href="/" />
        {step > 0 && step < TOTAL_STEPS - 1 && (
          <span className="text-xs text-muted-foreground">Step {step} of {TOTAL_STEPS - 2}</span>
        )}
      </div>

      {/* progress bar */}
      {step > 0 && step < TOTAL_STEPS - 1 && (
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      )}

      {/* step content */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="w-full max-w-2xl"
          >
            {step === 0 && <StepWelcome name={name} onNext={() => go(1)} />}
            {step === 1 && (
              <StepGoal
                value={goal}
                onChange={setGoal}
                onBack={() => go(0)}
                onNext={() => go(2)}
              />
            )}
            {step === 2 && (
              <StepLevel
                value={level}
                onChange={setLevel}
                onBack={() => go(1)}
                onNext={() => go(3)}
              />
            )}
            {step === 3 && (
              <StepTopics
                value={topics}
                onToggle={toggleTopic}
                onBack={() => go(2)}
                onNext={() => go(4)}
              />
            )}
            {step === 4 && (
              <StepCompanies
                value={companies}
                onToggle={toggleCompany}
                onBack={() => go(3)}
                onNext={() => go(5)}
                onSkip={() => go(5)}
              />
            )}
            {step === 5 && (
              <StepDailyGoal
                value={dailyGoal}
                onChange={setDailyGoal}
                onBack={() => go(4)}
                onFinish={finish}
                submitting={submitting}
              />
            )}
            {step === 6 && (
              <StepDone
                name={name}
                goal={goal}
                level={level}
                topics={topics}
                dailyGoal={dailyGoal}
                onStart={() => router.push("/dashboard")}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── step components ────────────────────────────────────────────── */

function StepWelcome({ name, onNext }: { name: string; onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 border-2 border-primary/20">
        <Code2 className="size-10 text-primary" />
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome, {name.split(" ")[0]}! 👋
        </h1>
        <p className="mt-3 text-muted-foreground text-base max-w-md mx-auto">
          Let&apos;s take 2 minutes to personalise your CodeForge AI experience so you hit your goals faster.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-1">
        {["SM-2 Spaced Repetition", "AI Pair Programmer", "Company Prep", "Smart Analytics"].map((f) => (
          <span key={f} className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
            <Check className="size-3 text-primary" /> {f}
          </span>
        ))}
      </div>
      <Button size="lg" className="mt-2 px-8" onClick={onNext}>
        Get Started <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}

function StepGoal({
  value,
  onChange,
  onBack,
  onNext,
}: {
  value: string;
  onChange: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeader
        step={1}
        title="What's your main goal?"
        desc="We'll tailor your problem set and AI recommendations around this."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {GOALS.map(({ id, icon: Icon, label, desc }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              "group flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all",
              value === id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/50 hover:bg-muted/40",
            )}
          >
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", value === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary")}>
              <Icon className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
            {value === id && <Check className="ml-auto size-4 text-primary shrink-0 mt-0.5" />}
          </button>
        ))}
      </div>
      <StepNav onBack={onBack} onNext={onNext} nextDisabled={!value} />
    </div>
  );
}

function StepLevel({
  value,
  onChange,
  onBack,
  onNext,
}: {
  value: string;
  onChange: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeader
        step={2}
        title="What's your experience level?"
        desc="Be honest — we'll give you appropriately challenging problems."
      />
      <div className="grid gap-3">
        {LEVELS.map(({ id, icon: Icon, label, desc, color }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              "group flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
              value === id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/50 hover:bg-muted/40",
            )}
          >
            <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl border bg-background", value === id ? "border-primary" : "border-border")}>
              <Icon className={cn("size-6", color)} />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{label}</p>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
            {value === id && <Check className="size-5 text-primary shrink-0" />}
          </button>
        ))}
      </div>
      <StepNav onBack={onBack} onNext={onNext} nextDisabled={!value} />
    </div>
  );
}

function StepTopics({
  value,
  onToggle,
  onBack,
  onNext,
}: {
  value: string[];
  onToggle: (t: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeader
        step={3}
        title="Which topics do you want to focus on?"
        desc="Pick at least 1. You can change this any time from your settings."
      />
      <div className="flex flex-wrap gap-2">
        {TOPICS.map((t) => {
          const sel = value.includes(t);
          return (
            <button
              key={t}
              onClick={() => onToggle(t)}
              className={cn(
                "rounded-full border-2 px-3.5 py-1.5 text-sm font-medium transition-all",
                sel
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/60 hover:bg-muted/50",
              )}
            >
              {sel && <Check className="inline size-3 mr-1 -mt-0.5" />}
              {t}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <button
          className="text-xs text-primary hover:underline"
          onClick={() => TOPICS.forEach((t) => !value.includes(t) && onToggle(t))}
        >
          Select all
        </button>
        {value.length > 0 && (
          <>
            <span className="text-muted-foreground text-xs">·</span>
            <button className="text-xs text-muted-foreground hover:text-foreground hover:underline" onClick={() => value.forEach(onToggle)}>
              Clear
            </button>
            <span className="ml-auto text-xs text-muted-foreground">{value.length} selected</span>
          </>
        )}
      </div>
      <StepNav onBack={onBack} onNext={onNext} nextDisabled={value.length === 0} />
    </div>
  );
}

function StepCompanies({
  value,
  onToggle,
  onBack,
  onNext,
  onSkip,
}: {
  value: string[];
  onToggle: (c: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeader
        step={4}
        title="Any target companies?"
        desc="We'll surface company-tagged problems in your feed. Totally optional."
        optional
      />
      <div className="flex flex-wrap gap-2">
        {COMPANIES.map((c) => {
          const sel = value.includes(c);
          return (
            <button
              key={c}
              onClick={() => onToggle(c)}
              className={cn(
                "rounded-full border-2 px-4 py-2 text-sm font-medium transition-all",
                sel
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/60 hover:bg-muted/50",
              )}
            >
              {sel && <Check className="inline size-3 mr-1 -mt-0.5" />}
              {c}
            </button>
          );
        })}
      </div>
      <StepNav onBack={onBack} onNext={onNext} nextDisabled={false} onSkip={onSkip} />
    </div>
  );
}

function StepDailyGoal({
  value,
  onChange,
  onBack,
  onFinish,
  submitting,
}: {
  value: number;
  onChange: (v: number) => void;
  onBack: () => void;
  onFinish: () => void;
  submitting: boolean;
}) {
  return (
    <div className="space-y-6">
      <StepHeader
        step={5}
        title="How many problems per day?"
        desc="Consistency beats intensity. Pick what you can realistically commit to."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {DAILY_GOALS.map(({ value: v, icon: Icon, label, tag, desc }) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={cn(
              "group flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all",
              value === v
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/50 hover:bg-muted/40",
            )}
          >
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", value === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary")}>
              <Icon className="size-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{label}</p>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", value === v ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                  {tag}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
            {value === v && <Check className="ml-auto size-4 text-primary shrink-0 mt-0.5" />}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <Button onClick={onFinish} disabled={submitting} size="lg" className="px-8">
          {submitting ? "Saving..." : "Finish Setup"}
          {!submitting && <ChevronRight className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

function StepDone({
  name,
  goal,
  level,
  topics,
  dailyGoal,
  onStart,
}: {
  name: string;
  goal: string;
  level: string;
  topics: string[];
  dailyGoal: number;
  onStart: () => void;
}) {
  const goalLabel = GOALS.find((g) => g.id === goal)?.label ?? goal;
  const levelLabel = LEVELS.find((l) => l.id === level)?.label ?? level;

  return (
    <div className="flex flex-col items-center text-center gap-6">
      {/* celebration ring */}
      <div className="relative flex size-24 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: "2s" }} />
        <div className="relative flex size-20 items-center justify-center rounded-full bg-primary shadow-[0_0_0_4px] shadow-primary/20">
          <Check className="size-10 text-primary-foreground" strokeWidth={3} />
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">You&apos;re all set, {name.split(" ")[0]}!</h1>
        <p className="mt-2 text-muted-foreground">Your personalised CodeForge AI experience is ready.</p>
      </div>

      {/* summary card */}
      <div className="w-full rounded-xl border-2 border-border bg-muted/30 p-5 text-left space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your profile</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <SummaryRow label="Goal" value={goalLabel} />
          <SummaryRow label="Level" value={levelLabel} />
          <SummaryRow label="Daily target" value={`${dailyGoal === 10 ? "10+" : dailyGoal} problems/day`} />
          <SummaryRow label="Focus topics" value={topics.length > 3 ? `${topics.slice(0, 3).join(", ")} +${topics.length - 3}` : topics.join(", ")} />
        </div>
      </div>

      <Button size="lg" className="px-10" onClick={onStart}>
        Start Coding <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}

/* ── shared sub-components ──────────────────────────────────────── */

function StepHeader({
  step,
  title,
  desc,
  optional,
}: {
  step: number;
  title: string;
  desc: string;
  optional?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold text-primary uppercase tracking-widest">Step {step} / 5</span>
        {optional && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Optional</span>
        )}
      </div>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function StepNav({
  onBack,
  onNext,
  nextDisabled,
  onSkip,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled: boolean;
  onSkip?: () => void;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="size-4" /> Back
      </Button>
      <div className="flex items-center gap-2">
        {onSkip && (
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onSkip}>
            Skip
          </Button>
        )}
        <Button onClick={onNext} disabled={nextDisabled} size="sm" className="px-6">
          Continue <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
