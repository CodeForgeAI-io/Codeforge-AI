import type { NextAuthConfig } from "next-auth";

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
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [],
  callbacks: {
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      session.user.role = (token.role as "user" | "admin") ?? "user";
      session.user.username = (token.username as string) ?? "";
      return session;
    },
  },
} satisfies NextAuthConfig;
