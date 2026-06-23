"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Lock, CheckCircle2 } from "@/components/icons";
import { resetPasswordSchema, type ResetPasswordInput } from "@/schemas/auth";
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

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordInput) {
    if (!token) {
      toast.error("Invalid reset link. Please request a new one.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => null) as { error?: string } | null;
      if (!res.ok) {
        toast.error(data?.error ?? "Failed to reset password. Try again.");
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <Card className="glass">
        <CardContent className="pt-8 pb-8 text-center">
          <p className="text-sm text-muted-foreground">
            Invalid reset link. Please{" "}
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => router.push("/forgot-password")}
            >
              request a new one
            </button>
            .
          </p>
        </CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="glass">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="size-7 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Password updated!</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Your password has been changed successfully.
                You can now sign in with your new password.
              </p>
            </div>
            <Button onClick={() => router.push("/login")} className="mt-2">
              Go to sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const errors = form.formState.errors;

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-xl">Set a new password</CardTitle>
        <CardDescription>
          Choose a strong password for your CodeForge AI account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <input type="hidden" {...form.register("token")} />

          <div className="grid gap-1.5">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className="pl-9 pr-10"
                {...form.register("password")}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat your password"
                autoComplete="new-password"
                className="pl-9 pr-10"
                {...form.register("confirmPassword")}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowConfirm((v) => !v)}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
