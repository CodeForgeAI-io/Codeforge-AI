import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-secondary px-4 text-center">
      <div
        aria-hidden
        className="bg-dots pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(50%_50%_at_50%_45%,black,transparent)]"
      />
      <div className="relative">
        <p
          className="text-[120px] font-semibold leading-none tracking-tighter sm:text-[160px]"
          style={{ color: "#006bff" }}
        >
          404
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/">Back home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/problems">
              Browse problems <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
