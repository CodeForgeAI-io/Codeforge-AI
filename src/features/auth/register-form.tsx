"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpAction } from "@/lib/auth-actions";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "@/components/icons";
import { registerSchema, type RegisterInput } from "@/schemas/auth";
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
import { OAuthButtons } from "./oauth-buttons";
import { getRecaptchaToken } from "@/lib/recaptcha-client";

export function RegisterForm({
  google,
  github,
}: {
  google: boolean;
  github: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", username: "", email: "", password: "", terms: undefined },
  });

  async function onSubmit(values: RegisterInput) {
    setSubmitting(true);
    try {
      const recaptchaToken = await getRecaptchaToken("register");
      const result = await signUpAction(values, recaptchaToken);
      if (!result.ok) {
        toast.error(result.error ?? "Registration failed");
        return;
      }
      import("posthog-js").then(({ default: posthog }) => {
        posthog.identify(values.email, { email: values.email, name: values.name, username: values.username });
        posthog.capture("user_registered", { method: "email" });
      });
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const errors = form.formState.errors;

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="space-y-2 px-0 pt-0">
        <CardTitle className="text-[26px] font-bold tracking-tight">Create your account</CardTitle>
        <CardDescription>
          Start solving problems and tracking your progress
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <OAuthButtons google={google} github={github} callbackUrl="/dashboard" />
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Ada Lovelace" {...form.register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="ada" {...form.register("username")} />
              {errors.username && (
                <p className="text-xs text-destructive">
                  {errors.username.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...form.register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className="pr-10"
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="flex items-start gap-2.5">
            <input
              id="terms"
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 accent-primary cursor-pointer"
              {...form.register("terms")}
            />
            <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              I agree to the{" "}
              <a href="/terms" target="_blank" className="text-primary underline underline-offset-2 hover:text-primary/80">
                Terms &amp; Conditions
              </a>{" "}
              and{" "}
              <a href="/privacy" target="_blank" className="text-primary underline underline-offset-2 hover:text-primary/80">
                Privacy Policy
              </a>
            </label>
          </div>
          {errors.terms && (
            <p className="text-xs text-destructive">{errors.terms.message}</p>
          )}
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Create account
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
