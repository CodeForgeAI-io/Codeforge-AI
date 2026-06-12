import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm
        google={!!process.env.GOOGLE_CLIENT_ID}
        github={!!process.env.GITHUB_CLIENT_ID}
      />
    </Suspense>
  );
}
