import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Logo } from "@/components/shared/logo";

// Auth pages (sign in / sign up / password reset) must never be indexed —
// they were ranking as "Sign in | CodeForge AI" for the brand query.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-secondary px-4 py-10">
      <Logo className="mb-8" />
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
