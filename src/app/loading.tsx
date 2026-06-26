/**
 * Fallback navigation skeleton for public routes (home, problems, blog, careers,
 * help, forum, pricing…) that don't ship their own loading.tsx. Gives the App
 * Router an instant Suspense boundary so clicking a link paints immediately
 * instead of hanging on the dynamic server render. Platform routes have their
 * own richer skeleton which takes precedence.
 */
export default function PublicLoading() {
  return (
    <div className="animate-pulse">
      {/* slim header bar mirrors the sticky public header height */}
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="h-6 w-32 rounded bg-muted" />
          <div className="hidden gap-5 md:flex">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 w-14 rounded bg-muted/60" />
            ))}
          </div>
          <div className="h-8 w-24 rounded-lg bg-muted" />
        </div>
      </div>

      {/* page body placeholder */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mx-auto mb-8 max-w-2xl space-y-3 text-center">
          <div className="mx-auto h-9 w-3/4 rounded-lg bg-muted" />
          <div className="mx-auto h-4 w-2/3 rounded bg-muted/60" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
