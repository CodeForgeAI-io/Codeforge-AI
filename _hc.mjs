import { chromium } from "@playwright/test";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message.slice(0,150)));
await p.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 60000 });
await p.waitForTimeout(1500);
// 1. run the default two-sum sample
await p.getByRole("button", { name: "Run" }).click();
await p.waitForTimeout(1200);
const out1 = await p.locator("text=[0,1]").count();
const out2 = await p.locator("text=Runs right here in your browser").count();
const timing = await p.locator("text=finished in").count();
console.log("two-sum output:", out1 > 0 ? "OK" : "MISSING", "| rocket line:", out2 > 0 ? "OK" : "MISSING", "| timing:", timing > 0 ? "OK" : "MISSING");
// 2. edit the code and re-run (real editing works)
await p.locator("textarea[aria-label='JavaScript playground editor']").fill("console.log(6*7)");
await p.getByRole("button", { name: "Run" }).click();
await p.waitForTimeout(900);
const out42 = await p.locator("text=/^42$/").count();
console.log("edited code output 42:", out42 > 0 ? "OK" : "MISSING");
// 3. infinite loop gets killed by the 3s timeout
await p.locator("textarea[aria-label='JavaScript playground editor']").fill("while(true){}");
await p.getByRole("button", { name: "Run" }).click();
await p.waitForTimeout(4200);
const to = await p.locator("text=timed out").count();
console.log("infinite-loop timeout:", to > 0 ? "OK" : "MISSING");
await p.locator("textarea").first().scrollIntoViewIfNeeded();
await p.screenshot({ path: "/private/tmp/claude-501/-Users-nitheeshdr-Downloads-code-learning-coding/5fb5bb9a-b9d7-4411-886e-7f6ad88427fe/scratchpad/lp/hc-hero.png" });
console.log("page errors:", errs.length ? errs.join("|") : "none");
await b.close();
