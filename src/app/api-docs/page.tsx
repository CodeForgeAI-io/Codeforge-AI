"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "@/components/icons";
import { Logo } from "@/components/shared/logo";

const SWAGGER_VERSION = "5.17.14";
const CSS = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui.css`;
const JS = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui-bundle.js`;

declare global {
  interface Window {
    SwaggerUIBundle?: (opts: Record<string, unknown>) => void;
  }
}

export default function ApiDocsPage() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = CSS;
    document.head.appendChild(link);

    const init = () => {
      if (!window.SwaggerUIBundle) return;
      window.SwaggerUIBundle({
        url: "/api/openapi",
        dom_id: "#swagger-ui",
        deepLinking: true,
        tryItOutEnabled: true,
        validatorUrl: null,
        defaultModelsExpandDepth: 0,
      });
    };

    let script = document.querySelector<HTMLScriptElement>(`script[src="${JS}"]`);
    if (script && window.SwaggerUIBundle) {
      init();
    } else if (!script) {
      script = document.createElement("script");
      script.src = JS;
      script.crossOrigin = "anonymous";
      script.onload = init;
      document.body.appendChild(script);
    } else {
      script.addEventListener("load", init);
    }

    return () => {
      link.remove();
    };
  }, []);

  return (
    <div className="min-h-svh bg-white dark:bg-neutral-950">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-3">
          <Logo href="/" />
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">API Reference</span>
        </div>
        <Link href="/help" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Docs
        </Link>
      </header>
      {/* Swagger UI mounts here and brings its own styling. */}
      <div id="swagger-ui" className="mx-auto max-w-5xl px-2 py-4" />
    </div>
  );
}
