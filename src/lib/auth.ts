import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";
import { loginSchema } from "@/schemas/auth";
import { authConfig } from "@/lib/auth.config";

const suffix = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 6);

function isAdminEmail(email: string): boolean {
  const admins = (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export async function generateUniqueUsername(base: string): Promise<string> {
  const cleaned =
    base
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "")
      .slice(0, 20) || "coder";
  const candidate = cleaned.length >= 3 ? cleaned : `${cleaned}123`;
  const existing = await User.findOne({ username: candidate }).lean();
  if (!existing) return candidate;
  return `${candidate.slice(0, 20)}-${suffix()}`;
}

const providers = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const parsed = loginSchema.safeParse(credentials);
      if (!parsed.success) return null;

      await connectDB();
      const user = await User.findOne({
        email: parsed.data.email.toLowerCase(),
      }).select("+password");

      if (!user?.password || user.banned) return null;

      const valid = await bcrypt.compare(parsed.data.password, user.password);
      if (!valid) return null;

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
      };
    },
  }),
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : []),
  ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? [
        GitHub({
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,

    async signIn({ user, account }) {
      if (!user.email) return false;
      if (account?.provider === "credentials") return true;

      // OAuth: provision or update the user record (JWT strategy, no adapter)
      await connectDB();
      const existing = await User.findOne({
        email: user.email.toLowerCase(),
      });

      if (existing?.banned) return false;

      if (existing) {
        if (account && !existing.providers.includes(account.provider)) {
          existing.providers.push(account.provider);
        }
        if (!existing.image && user.image) existing.image = user.image;
        await existing.save();
        return true;
      }

      const username = await generateUniqueUsername(
        user.email.split("@")[0] ?? user.name ?? "coder",
      );
      await User.create({
        name: user.name ?? username,
        username,
        email: user.email.toLowerCase(),
        image: user.image ?? null,
        password: null,
        providers: [account?.provider ?? "oauth"],
        role: isAdminEmail(user.email) ? "admin" : "user",
      });
      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user || trigger === "update") {
        // Full refresh on sign-in or explicit update()
        const email = (user?.email ?? token.email)?.toLowerCase();
        if (email) {
          await connectDB();
          const dbUser = await User.findOne({ email }).lean();
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
            token.username = dbUser.username;
            token.name = dbUser.name;
            token.picture = dbUser.image ?? token.picture;
            token.onboardingComplete = dbUser.onboarding?.completed ?? false;
            token.plan = dbUser.plan ?? "free";
          }
        }
      } else if (token.id && token.onboardingComplete !== true) {
        // Heal stale JWTs: token pre-dates the onboardingComplete field or was
        // issued before onboarding finished. One lightweight DB check — once the
        // token is updated to true, this branch never runs again.
        try {
          await connectDB();
          const dbUser = await User.findById(token.id)
            .select("onboarding plan")
            .lean();
          if (dbUser) {
            token.onboardingComplete = dbUser.onboarding?.completed ?? false;
            if (!token.plan) token.plan = dbUser.plan ?? "free";
          }
        } catch {
          // Never let a background DB error break the session
        }
      }
      return token;
    },
  },
});
