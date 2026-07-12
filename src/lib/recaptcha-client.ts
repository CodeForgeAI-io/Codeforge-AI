/**
 * Client helper for reCAPTCHA v3. Lazily loads Google's script the first time a
 * token is requested (so it doesn't run on pages with no protected form), then
 * executes an invisible check and returns a token. Returns `null` on any
 * failure or when no site key is configured — the caller/server decides what
 * to do, and the server treats a missing token as a failed check.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

declare global {
  interface Window {
    grecaptcha?: {
      ready(cb: () => void): void;
      execute(siteKey: string, opts: { action: string }): Promise<string>;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (!SITE_KEY) return Promise.reject(new Error("no-site-key"));
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    if (window.grecaptcha) return resolve();
    const s = document.createElement("script");
    s.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("recaptcha-load-failed"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Get a reCAPTCHA v3 token for an action (e.g. "register", "feedback").
 * @returns the token, or `null` if reCAPTCHA is unavailable.
 */
export async function getRecaptchaToken(action: string): Promise<string | null> {
  if (!SITE_KEY) return null;
  try {
    await loadScript();
    return await new Promise<string>((resolve, reject) => {
      if (!window.grecaptcha) return reject(new Error("recaptcha-missing"));
      window.grecaptcha.ready(() => {
        window.grecaptcha!.execute(SITE_KEY!, { action }).then(resolve).catch(reject);
      });
    });
  } catch {
    return null;
  }
}
