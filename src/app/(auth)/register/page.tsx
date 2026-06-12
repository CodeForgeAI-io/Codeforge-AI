import { Suspense } from "react";
import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm
        google={!!process.env.GOOGLE_CLIENT_ID}
        github={!!process.env.GITHUB_CLIENT_ID}
      />
    </Suspense>
  );
}
