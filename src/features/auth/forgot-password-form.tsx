"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "@/components/icons";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/schemas/auth";
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

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null) as { error?: string } | null;
        toast.error(data?.error ?? "Something went wrong. Try again.");
        return;
      }
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <Card className="glass">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="size-7 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Check your inbox</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                If an account exists for{" "}
                <span className="font-medium text-foreground">
                  {form.getValues("email")}
                </span>
                , you&apos;ll receive a password reset link shortly.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Didn&apos;t receive it? Check your spam folder or{" "}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setSent(false)}
              >
                try again
              </button>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-xl">Forgot your password?</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="pl-9"
                {...form.register("email")}
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Send reset link
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" /> Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
