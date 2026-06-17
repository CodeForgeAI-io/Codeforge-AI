import type { NextAuthConfig } from "next-auth";

const isProd = process.env.NODE_ENV === "production";

/**
 * Edge-safe NextAuth config shared with middleware. No database imports
 * here — anything touching Mongoose lives in `src/lib/auth.ts`.
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,    // 7 days
    updateAge: 24 * 60 * 60,     // refresh once per day
  },
  cookies: {
    sessionToken: {
      name: isProd ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const, // lax allows OAuth redirects; strict breaks GitHub/Google
        path: "/",
        secure: isProd,
        maxAge: 7 * 24 * 60 * 60,
      },
    },
    callbackUrl: {
      name: isProd ? "__Secure-next-auth.callback-url" : "next-auth.callback-url",
      options: { httpOnly: false, sameSite: "lax" as const, path: "/", secure: isProd },
    },
    csrfToken: {
      name: isProd ? "__Host-next-auth.csrf-token" : "next-auth.csrf-token",
      options: { httpOnly: false, sameSite: "lax" as const, path: "/", secure: isProd },
    },
    pkceCodeVerifier: {
      name: isProd ? "__Secure-next-auth.pkce.code_verifier" : "next-auth.pkce.code_verifier",
      options: { httpOnly: true, sameSite: "lax" as const, path: "/", secure: isProd, maxAge: 900 },
    },
    nonce: {
      name: isProd ? "__Secure-next-auth.nonce" : "next-auth.nonce",
      options: { httpOnly: true, sameSite: "lax" as const, path: "/", secure: isProd, maxAge: 900 },
    },
  },
  providers: [],
  callbacks: {
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      session.user.role = (token.role as "user" | "admin") ?? "user";
      session.user.username = (token.username as string) ?? "";
      session.user.onboardingComplete = (token.onboardingComplete as boolean) ?? false;
      session.user.plan = (token.plan as "free" | "go" | "plus") ?? "free";
      return session;
    },
  },
} satisfies NextAuthConfig;
