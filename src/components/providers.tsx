"use client";

import { useState, type ReactNode } from "react";
import { SupabaseAuthProvider } from "@/lib/auth-client";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PostHogProvider } from "@/components/posthog-provider";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <PostHogProvider>
      <SupabaseAuthProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
            <Toaster richColors position="bottom-right" />
          </ThemeProvider>
        </QueryClientProvider>
      </SupabaseAuthProvider>
    </PostHogProvider>
  );
}
