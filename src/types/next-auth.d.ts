import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "admin";
      username: string;
      onboardingComplete: boolean;
      plan: "free" | "go" | "plus";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "user" | "admin";
    username?: string;
    onboardingComplete?: boolean;
    plan?: "free" | "go" | "plus";
  }
}
