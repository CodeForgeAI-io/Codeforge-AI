"use client";

import { useEffect } from "react";

/** Registers the service worker so the app is installable / works offline. */
export function PWARegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }
    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("[pwa] service worker registration failed:", err));
    };
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
