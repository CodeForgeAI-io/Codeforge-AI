"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Eye,
  EyeOff,
  Flame,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const BETA_LIMIT = 50;

const PERKS = [
  { icon: Zap, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20", label: "Go Plan free for 30 days", sub: "No credit card required" },
  { icon: Bot, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", label: "Unlimited AI tools", sub: "Mentor, Pair Programmer & Coach" },
  { icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20", label: "All contests & leaderboards", sub: "Weekly challenges + daily streaks" },
  { icon: Flame, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", label: "Early access features", sub: "Shape the product with your feedback" },
];

function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function BetaJoinPage() {
  const router = useRouter();
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/beta/join")
      .then((r) => r.json())
      .then((d) => setSpotsLeft(d.spotsLeft ?? 0))
      .catch(() => setSpotsLeft(null));
  }, []);

  const claimed = spotsLeft !== null ? BETA_LIMIT - spotsLeft : null;
  const pct = claimed !== null ? Math.min(100, (claimed / BETA_LIMIT) * 100) : 0;
  const full = spotsLeft === 0;

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setError("");
      setForm((prev) => ({ ...prev, [k]: e.target.value }));
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (full) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/beta/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }

      setSuccess(true);
      // Auto sign in and redirect
      const r = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (r?.ok) router.push("/dashboard");
      else router.push("/login");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/beta/success" });
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/30">
              <CheckCircle2 className="size-10 text-green-500" />
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-black">You&apos;re in! 🎉</h2>
          <p className="text-muted-foreground">Signing you in and heading to dashboard…</p>
          <Loader2 className="mx-auto mt-4 size-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 size-[700px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 right-0 size-[500px] rounded-full bg-purple-500/10 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Nav */}
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Logo href="/" />
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Already have an account? <span className="text-primary font-semibold">Sign in</span>
          </Link>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">

            {/* ── Left: Hero copy ── */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm font-700 text-purple-400">
                <Sparkles className="size-3.5" />
                Beta · Limited to {BETA_LIMIT} users
              </div>

              <h1 className="mb-5 text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
                Join the{" "}
                <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-purple-500 bg-clip-text text-transparent">
                  Beta.
                </span>
                <br />
                Get Go Plan{" "}
                <span className="text-foreground">Free.</span>
              </h1>

              <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
                The first <strong className="text-foreground">50 users</strong> who join {APP_NAME} beta get the{" "}
                <strong className="text-foreground">Go Plan free for one month</strong> — AI tools, contests, and everything else, zero cost.
              </p>

              {/* Spot counter */}
              <div className="mb-8 rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-sm">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">Beta spots claimed</span>
                  <span className="font-black text-primary">
                    {claimed !== null ? claimed : "—"} / {BETA_LIMIT}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {spotsLeft !== null ? (
                    full
                      ? "All spots have been claimed. Follow us for future updates."
                      : <><span className="font-bold text-orange-500">{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left</span> — claim yours before it&apos;s gone!</>
                  ) : "Loading spots…"}
                </p>
              </div>

              {/* Perks */}
              <ul className="space-y-3">
                {PERKS.map(({ icon: Icon, color, bg, label, sub }) => (
                  <li key={label} className={cn("flex items-center gap-4 rounded-xl border p-3.5", bg)}>
                    <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg bg-background/60", bg.split(" ")[0])}>
                      <Icon className={cn("size-4", color)} />
                    </div>
                    <div>
                      <div className="text-sm font-700 text-foreground">{label}</div>
                      <div className="text-xs text-muted-foreground">{sub}</div>
                    </div>
                    <CheckCircle2 className={cn("ml-auto size-4 shrink-0", color)} />
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Right: Join form ── */}
            <div className="rounded-3xl border border-border bg-card/60 p-8 shadow-2xl backdrop-blur-sm sm:p-10">
              <div className="mb-7 text-center">
                <h2 className="text-2xl font-black tracking-tight">Create your account</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {full ? "Beta is full — join the waitlist below" : "Secure your beta spot in seconds"}
                </p>
              </div>

              {/* Google */}
              <Button
                type="button"
                variant="outline"
                className="mb-5 w-full gap-3 py-5 text-sm font-semibold"
                onClick={handleGoogle}
                disabled={googleLoading || full}
              >
                {googleLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-xs text-muted-foreground">or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Full name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Alex Johnson"
                        className="pl-9"
                        value={form.name}
                        onChange={set("name")}
                        disabled={full || loading}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Username</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                      <Input
                        id="username"
                        placeholder="alex_dev"
                        className="pl-7"
                        value={form.username}
                        onChange={(e) => { setError(""); setForm((p) => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })); }}
                        disabled={full || loading}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="alex@example.com"
                      className="pl-9"
                      value={form.email}
                      onChange={set("email")}
                      disabled={full || loading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 8 characters"
                      className="pl-9 pr-10"
                      value={form.password}
                      onChange={set("password")}
                      disabled={full || loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Must include uppercase, number, or symbol.</p>
                </div>

                {error && (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full gap-2 py-5 text-base font-bold"
                  disabled={full || loading}
                >
                  {loading ? (
                    <><Loader2 className="size-4 animate-spin" /> Creating account…</>
                  ) : full ? (
                    "Beta is full"
                  ) : (
                    <>Claim my beta spot <ArrowRight className="size-4" /></>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  By joining you agree to our{" "}
                  <Link href="/terms" className="text-primary hover:underline">Terms</Link>
                  {" & "}
                  <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
