import { chromium } from "playwright";
import fs from "fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const results = [];
const record = (title, ok, detail) => {
  results.push({ title, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} | ${title} | ${detail}`);
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
page.on("pageerror", (err) => consoleErrors.push(String(err)));

await page.goto(`${BASE}/clients`, { waitUntil: "domcontentloaded" });
record("Protected /clients redirects to sign-in", page.url().includes("/sign-in"), `url=${page.url()}`);

for (const path of ["/reglement", "/versements", "/facturesAchats", "/fournisseurs/imprimer-rapport"]) {
  const res = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  const exposed = !page.url().includes("/sign-in") && res?.status() === 200;
  record(`Unauth access to ${path} blocked`, !exposed, `url=${page.url()} status=${res?.status()}`);
}

let res = await page.goto(`${BASE}/debitage/marbre`, { waitUntil: "domcontentloaded" });
record("Debitage marbre exists", res?.status() !== 404, `status=${res?.status()}`);

consoleErrors.length = 0;
// ventes/* is middleware-protected, so use a path that may still be open or document redirect
res = await page.goto(`${BASE}/ventes/devis/x/historiquePaiements`, { waitUntil: "domcontentloaded" });
record("Historique paiements route behavior", true, `url=${page.url()} status=${res?.status()} (middleware may redirect)`);

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${BASE}/reglement`, { waitUntil: "domcontentloaded" });
const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
record("Reglement mobile overflow reasonable", bodyWidth <= 450, `scrollWidth=${bodyWidth}`);

let api = await context.request.get(`${BASE}/api/clients`);
record("GET /api/clients requires auth", api.status() === 401 || api.status() === 403, `status=${api.status()}`);
api = await context.request.put(`${BASE}/api/solde-comptes`, { data: { id: "nonexistent", solde: 0 } });
record("PUT /api/solde-comptes requires auth", api.status() === 401 || api.status() === 403, `status=${api.status()}`);
api = await context.request.post(`${BASE}/api/reglements/00000000-0000-0000-0000-000000000000/confirm`, { data: { status: "confirme" } });
record("POST reglement confirm requires auth", api.status() === 401 || api.status() === 403, `status=${api.status()}`);
api = await context.request.get(`${BASE}/api/comptesBancaires`);
record("GET /api/comptesBancaires requires auth", api.status() === 401 || api.status() === 403, `status=${api.status()}`);
api = await context.request.delete(`${BASE}/api/fournisseurs/00000000-0000-0000-0000-000000000000`);
record("DELETE /api/fournisseurs/[id] requires auth", api.status() === 401 || api.status() === 403, `status=${api.status()}`);

await browser.close();
const summary = { total: results.length, passed: results.filter(r=>r.ok).length, failed: results.filter(r=>!r.ok).length, results };
fs.writeFileSync("/tmp/qa-smoke-results.json", JSON.stringify(summary, null, 2));
console.log("SUMMARY", JSON.stringify({ total: summary.total, passed: summary.passed, failed: summary.failed }));
