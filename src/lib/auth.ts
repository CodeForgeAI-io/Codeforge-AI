/**
 * Server auth entrypoint. Since the Supabase Auth cutover this just re-exports
 * the Supabase-backed session reader, so every `import { auth } from "@/lib/auth"`
 * call site keeps working unchanged. Sign-in / sign-up / OAuth live in
 * `@/lib/auth-actions` and `/auth/callback`. (Was NextAuth.)
 */
export { auth } from "@/lib/supabase-auth";
export type { AppSession, AppSessionUser } from "@/lib/supabase-auth";
