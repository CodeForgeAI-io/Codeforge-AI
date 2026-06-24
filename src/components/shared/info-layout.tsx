import Link from "next/link";
import { Heart } from "@/components/icons";
import { APP_NAME, APP_VERSION } from "@/lib/constants";

export function InfoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="text-sm font-bold text-primary">
            {APP_NAME}
          </Link>
          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link href="/problems" className="hover:text-foreground transition-colors hidden sm:block">Problems</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors hidden sm:block">Pricing</Link>
            <Link href="/changelog" className="hover:text-foreground transition-colors hidden sm:block">Changelog</Link>
            <Link href="/feedback" className="hover:text-foreground transition-colors">Feedback</Link>
            <Link href="/beta/join" className="rounded-md border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-400 hover:bg-purple-500/20 transition-colors">
              Join Beta
            </Link>
            <Link href="/login" className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-12">
        {children}
      </main>

      <footer className="border-t">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-y-3 px-4 py-5 text-xs text-muted-foreground sm:grid-cols-3 sm:items-center">
          <p>© {new Date().getFullYear()} {APP_NAME}</p>
          <div className="flex items-center justify-center gap-1.5">
            from the
            <Heart className="size-3 fill-red-500 text-red-500" />
            <img src="/white.png" alt="Setups Works" className="h-6 w-auto hidden dark:inline-block" />
            <img src="/black.png" alt="Setups Works" className="h-6 w-auto inline-block dark:hidden" />
          </div>
          <div className="flex items-center gap-4 sm:justify-end">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/changelog" className="hover:text-foreground transition-colors">Changelog</Link>
            <Link href="/feedback" className="hover:text-foreground transition-colors">Feedback</Link>
            <a href="https://github.com/CodeForgeAI-io/Codeforge-AI" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
            <a href="https://www.linkedin.com/company/codeforge-ai/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">LinkedIn</a>
            <a href="https://www.instagram.com/codeforgeai.io/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Instagram</a>
            <span className="rounded-full border px-2 py-0.5 font-mono">v{APP_VERSION}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
