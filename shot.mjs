import { chromium } from "@playwright/test";
const b = await chromium.launch();
for (const scheme of ["light", "dark"]) {
  const p = await b.newPage({ viewport: { width: 1100, height: 300 }, deviceScaleFactor: 2, colorScheme: scheme });
  await p.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  await p.screenshot({ path: `./.hdr_${scheme}.png`, clip: { x: 0, y: 0, width: 520, height: 70 } });
  await p.close();
}
await b.close();
