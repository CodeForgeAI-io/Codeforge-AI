"use client";

import { useEffect, useRef } from "react";
import "swagger-ui-dist/swagger-ui.css";

export function SwaggerUI() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let ui: { unmount?: () => void } | undefined;

    import("swagger-ui-dist/swagger-ui-bundle").then((mod) => {
      const SwaggerUIBundle = mod.default ?? mod;
      ui = SwaggerUIBundle({
        url: "/api/docs",
        domNode: containerRef.current,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
        layout: "BaseLayout",
        docExpansion: "list",
        defaultModelsExpandDepth: 1,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      });
    });

    return () => {
      ui?.unmount?.();
    };
  }, []);

  return (
    <div className="swagger-wrapper mx-auto max-w-7xl px-2 py-6">
      <div ref={containerRef} />
    </div>
  );
}
