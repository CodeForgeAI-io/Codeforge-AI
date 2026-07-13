"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PROVIDER_LABELS: Record<string, string> = {
  credentials: "Email & password",
  email: "Email & password",
  google: "Google",
  github: "GitHub",
};

export function AccountSettings({
  email,
  providers,
}: {
  email: string | null;
  providers: string[];
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const shown = providers.filter((p) => PROVIDER_LABELS[p]);
  const hasCreds = providers.includes("credentials") || providers.includes("email");

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(password) && !/[0-9]/.test(password) && !/[^A-Za-z0-9]/.test(password)) {
      toast.error("Include an uppercase letter, number, or symbol");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password updated");
      setPassword("");
      setConfirm("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Your login email and connected sign-in methods.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
            <Mail className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="truncate text-sm font-medium">{email ?? "—"}</p>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Sign-in methods</p>
            <div className="flex flex-wrap gap-2">
              {shown.length === 0 ? (
                <span className="text-sm text-muted-foreground">None linked</span>
              ) : (
                shown.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium"
                  >
                    <CheckCircle2 className="size-3.5 text-easy" /> {PROVIDER_LABELS[p]}
                  </span>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{hasCreds ? "Change password" : "Set a password"}</CardTitle>
          <CardDescription>
            {hasCreds
              ? "Update the password you use to sign in."
              : "Add a password so you can also sign in without Google or GitHub."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="grid gap-4 sm:max-w-sm">
            <div className="grid gap-1.5">
              <Label htmlFor="new-password">New password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="new-password"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="pl-9 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  className="pl-9"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" disabled={saving} className="w-fit">
              {saving && <Loader2 className="size-4 animate-spin" />}
              {hasCreds ? "Update password" : "Set password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
