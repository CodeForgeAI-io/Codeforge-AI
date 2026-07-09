// Sandboxed Web Worker script for the landing-hero JavaScript playground.
//
// We serve this from a dedicated same-origin route (instead of a blob: URL)
// so it can carry its OWN Content-Security-Policy. A blob:/data: worker
// inherits the parent document's CSP, and the site-wide policy deliberately
// forbids 'unsafe-eval'. Running the visitor's code needs the Function
// constructor (an eval), so we scope 'unsafe-eval' to THIS worker realm only —
// which has no DOM and, via `default-src 'none'`, no network access. The main
// document's strict CSP is unaffected.

/** Runs inside the Web Worker. Relays console output via postMessage; the
 *  parent page enforces the execution timeout and can terminate() it. */
const WORKER_SRC = `
  const fmt = (v) => {
    if (typeof v === "string") return v;
    try { return JSON.stringify(v); } catch { return String(v); }
  };
  const send = (type) => (...args) => postMessage({ type, text: args.map(fmt).join(" ") });
  console.log = send("log");
  console.error = send("error");
  console.warn = send("warn");
  console.info = send("info");
  onmessage = (e) => {
    const start = performance.now();
    try {
      new Function(e.data)();
      postMessage({ type: "done", ms: Math.max(1, Math.round(performance.now() - start)) });
    } catch (err) {
      postMessage({ type: "error", text: String(err) });
      postMessage({ type: "done", ms: Math.max(1, Math.round(performance.now() - start)) });
    }
  };
`;

export function GET() {
  return new Response(WORKER_SRC, {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      // eval is allowed ONLY in this worker; no DOM, no network (default-src 'none').
      "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-eval'",
      "Cache-Control": "public, max-age=3600, immutable",
    },
  });
}
