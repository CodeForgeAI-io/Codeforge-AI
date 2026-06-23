"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";

export default function BetaSuccessPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applying, setApplying] = useState(true);
  const [result, setResult] = useState<{ ok: boolean; spotsLeft?: number; error?: string } | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) { router.replace("/beta/join"); return; }

    // Try to apply beta plan for OAuth users
    fetch("/api/beta/apply", { method: "POST" })
      .then((r) => r.json())
      .then((data) => setResult(data))
      .catch(() => setResult({ ok: false, error: "Something went wrong" }))
      .finally(() => setApplying(false));
  }, [session, status, router]);

  if (status === "loading" || applying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-8"><Logo href="/" /></div>

        {result?.ok ? (
          <>
            <div className="mb-6 flex justify-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/30">
                <CheckCircle2 className="size-10 text-green-500" />
              </div>
            </div>
            <h1 className="mb-3 text-2xl font-black tracking-tight">You&apos;re in! 🎉</h1>
            <p className="mb-2 text-muted-foreground">
              Your <span className="font-bold text-foreground">Go Plan</span> is active for 30 days.
            </p>
            {result.spotsLeft !== undefined && (
              <p className="mb-8 text-sm text-muted-foreground">
                Only <span className="font-bold text-primary">{result.spotsLeft} beta spots</span> remaining.
              </p>
            )}
            <Button className="w-full" size="lg" onClick={() => router.push("/dashboard")}>
              Go to Dashboard →
            </Button>
          </>
        ) : (
          <>
            <h1 className="mb-3 text-2xl font-black tracking-tight">Welcome back!</h1>
            <p className="mb-8 text-muted-foreground">
              {result?.error ?? "You're signed in. Head to your dashboard to start coding."}
            </p>
            <Button className="w-full" size="lg" onClick={() => router.push("/dashboard")}>
              Go to Dashboard →
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
