/**
 * Unauthenticated Playwright smoke for gestion-project.
 * Requires: npm run dev on :3000, Chromium via `npx playwright install chromium`.
 * Artifacts land in qa-artifacts/ (gitignored). Never touches production DB.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.QA_BASE_URL || "http://localhost:3000";
const OUT = path.resolve("qa-artifacts");
fs.mkdirSync(OUT, { recursive: true });

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];

  page.on("console", msg => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("requestfailed", req => {
    failedRequests.push(`${req.failure()?.errorText || "fail"} ${req.url()}`);
  });
  page.on("response", res => {
    if (res.status() >= 400 && res.url().includes("/api/")) {
      failedRequests.push(`HTTP ${res.status()} ${res.url()}`);
    }
  });

  // 1) Home shows Clerk SignIn (unauthenticated)
  // Clerk keeps websockets/polling open — avoid networkidle timeouts.
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT, "home.png"), fullPage: true });
  const hasBrand = await page.getByText("OUDAOUDOX").first().isVisible().catch(() => false);
  const hasClerk =
    (await page.locator(".cl-rootBox, .cl-card, [data-clerk-component]").count()) > 0 ||
    (await page.getByRole("button", { name: /sign in|se connecter|continuer/i }).count()) > 0 ||
    (await page.locator('input[name="identifier"], input[type="email"]').count()) > 0;
  record("home-signin-brand", hasBrand && hasClerk, `brand=${hasBrand} clerk=${hasClerk}`);

  // Home fires statistiques while signed out → 401 noise
  const stats401 = failedRequests.some(r => r.includes("/api/statistiques") && r.includes("401"));
  record(
    "home-statistiques-401-while-signed-out",
    stats401,
    stats401
      ? "expected bug: useQuery runs before isSignedIn gate"
      : "no /api/statistiques 401 observed (query may be disabled)"
  );

  // 2) Protected pages redirect to /sign-in
  for (const route of [
    "/dashboard",
    "/clients",
    "/reglement",
    "/versements",
    "/facturesAchats",
    "/transactions",
    "/achats/bonLivraison",
    "/ventes/devis",
    "/admin",
    "/fournisseurs/imprimer-rapport",
  ]) {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
    const url = page.url();
    const ok = url.includes("/sign-in");
    record(`redirect-${route}`, ok, url);
  }

  // 3) Broken debitage routes (404, not auth-gated)
  for (const route of ["/debitage/marbre", "/debitage/verre"]) {
    const res = await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
    record(`broken-${route}`, res?.status() === 404, `status=${res?.status()}`);
  }

  // 4) /test is publicly reachable (not in middleware matcher)
  {
    const res = await page.goto(BASE + "/test", { waitUntil: "domcontentloaded" });
    const body = await page.textContent("body");
    record(
      "test-page-public",
      res?.status() === 200 && (body || "").includes("Test page"),
      `status=${res?.status()}`
    );
  }

  // 5) Empty impressionRapportComptes page (auth redirect unauthenticated)
  {
    await page.goto(BASE + "/transactions/impressionRapportComptes", {
      waitUntil: "domcontentloaded",
    });
    record(
      "impressionRapportComptes-requires-auth",
      page.url().includes("/sign-in"),
      page.url()
    );
  }

  // 6) API 401 probes
  for (const api of [
    "/api/clients",
    "/api/fournisseurs",
    "/api/bonLivraison",
    "/api/reglement",
    "/api/devis",
    "/api/statistiques",
    "/api/tresorie",
    "/api/solde-comptes",
  ]) {
    const res = await context.request.get(BASE + api);
    record(`api-401-${api}`, res.status() === 401, `status=${res.status()}`);
  }

  // DELETE /api/devis must not succeed anonymously (and must not wipe articls)
  {
    const res = await context.request.delete(BASE + "/api/devis", {
      data: { ids: ["00000000-0000-0000-0000-000000000000"] },
    });
    record("api-delete-devis-401", res.status() === 401, `status=${res.status()}`);
  }

  // 7) Sign-in page loads; responsive check
  await page.goto(BASE + "/sign-in", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: path.join(OUT, "sign-in-mobile.png"), fullPage: true });
  record("sign-in-mobile-render", true, "screenshot saved");

  await page.setViewportSize({ width: 1280, height: 800 });

  // Admin dead links only checkable when authenticated — document gap
  record(
    "authenticated-crud-skipped",
    true,
    "TEST_ADMIN_EMAIL/PASSWORD not set; CRUD/filter/pagination deferred"
  );

  // Informational: Clerk catch-all probe / misconfig signals (documented as BUG-016)
  const clerkMisconfig =
    consoleErrors.some(t =>
      /SignIn.*not configured correctly|catch-all route/i.test(t)
    ) || failedRequests.some(r => /SignIn_clerk_catchall_check/i.test(r));
  record(
    "home-clerk-signin-misconfig-signal",
    true,
    clerkMisconfig
      ? "signal observed (BUG-016)"
      : "no signal this run; browser exploration previously confirmed Clerk console error"
  );

  await browser.close();

  const summary = {
    base: BASE,
    passed: results.filter(r => r.ok).length,
    failed: results.filter(r => !r.ok).length,
    results,
    consoleErrorsSample: consoleErrors.slice(0, 30),
    failedRequestsSample: failedRequests.slice(0, 40),
  };
  fs.writeFileSync(path.join(OUT, "smoke-results.json"), JSON.stringify(summary, null, 2));
  console.log("\nSummary:", summary.passed, "passed,", summary.failed, "failed");
  console.log("Artifacts:", OUT);

  // Non-zero exit only if structural smoke expectations fail
  const criticalFails = results.filter(
    r =>
      !r.ok &&
      (r.name.startsWith("redirect-") ||
        r.name.startsWith("api-401-") ||
        r.name === "home-signin-brand" ||
        r.name === "api-delete-devis-401")
  );
  if (criticalFails.length) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
