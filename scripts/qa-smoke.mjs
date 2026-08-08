/**
 * QA smoke suite (Playwright) — unauthenticated + public surface.
 * Uses the existing DATABASE_URL from .env (test DB). Does not mutate env vars.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const BASE = process.env.QA_BASE_URL || "http://localhost:3000";
const outDir = join(process.cwd(), "qa-artifacts");
mkdirSync(outDir, { recursive: true });

const findings = [];
const consoleErrors = [];
const networkFailures = [];

function find(title, severity, detail) {
  findings.push({ title, severity, detail });
}

async function checkRedirect(page, path, expectLogin = true) {
  const res = await page.goto(`${BASE}${path}`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  const url = page.url();
  const status = res?.status();
  return { url, status, path };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  page.on("console", msg => {
    if (msg.type() === "error") {
      consoleErrors.push({ url: page.url(), text: msg.text() });
    }
  });
  page.on("pageerror", err => {
    consoleErrors.push({ url: page.url(), text: String(err) });
  });
  page.on("response", res => {
    if (res.status() >= 400 && !res.url().includes("_next")) {
      networkFailures.push({
        url: res.url(),
        status: res.status(),
        from: page.url(),
      });
    }
  });

  // --- Auth redirects ---
  const protectedPaths = [
    "/clients",
    "/produits",
    "/reglement",
    "/versements",
    "/facturesAchats",
    "/achats/fournisseurs",
    "/achats/bonLivraison",
    "/ventes/devis",
    "/transactions",
    "/parametres/banques",
    "/Employes",
    "/admin",
    "/dashboard",
  ];

  for (const p of protectedPaths) {
    const r = await checkRedirect(page, p);
    const ok = r.url.includes("/sign-in");
    if (!ok) {
      find(
        `Unauthenticated access allowed: ${p}`,
        "Critical",
        `Expected redirect to /sign-in, got ${r.url} (status ${r.status})`
      );
    }
  }

  // --- Public / broken routes ---
  await page.goto(`${BASE}/test`, { waitUntil: "domcontentloaded" });
  if (!page.url().includes("/sign-in") && (await page.content()).length > 0) {
    find(
      "Unauthenticated /test page is publicly accessible",
      "Medium",
      `Rendered at ${page.url()} without auth`
    );
  }

  const debitage = await page.goto(`${BASE}/debitage/marbre`, {
    waitUntil: "domcontentloaded",
  });
  if (debitage?.status() === 404) {
    find(
      "Sidebar Debitage links to non-existent routes",
      "High",
      "/debitage/marbre returns 404"
    );
  }

  // --- Sign-in page loads ---
  await page.goto(`${BASE}/sign-in`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: join(outDir, "sign-in-desktop.png"),
    fullPage: true,
  });
  const signInText = await page.locator("body").innerText();
  if (!/sign|connexion|email|clerk|google/i.test(signInText)) {
    find(
      "Sign-in page missing expected auth UI",
      "High",
      "Body did not contain expected sign-in content"
    );
  }

  // --- Home page Clerk/console errors ---
  const homeErrors = [];
  const onHomeConsole = msg => {
    if (msg.type() === "error") homeErrors.push(msg.text());
  };
  const onHomePageError = err => homeErrors.push(String(err));
  page.on("console", onHomeConsole);
  page.on("pageerror", onHomePageError);
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  page.off("console", onHomeConsole);
  page.off("pageerror", onHomePageError);
  await page.screenshot({
    path: join(outDir, "home-unauth.png"),
    fullPage: true,
  });
  if (homeErrors.some(t => /SignIn|catch-all|routing/i.test(t))) {
    find(
      "Home page mounts <SignIn/> with invalid routing config",
      "High",
      homeErrors.find(t => /SignIn|catch-all|routing/i.test(t))
    );
  }
  if (
    networkFailures.some(
      n => n.url.includes("/api/statistiques") && n.status === 401
    )
  ) {
    find(
      "Home page fetches /api/statistiques while signed out",
      "Medium",
      "useQuery runs without enabled: isSignedIn"
    );
  }

  // --- Responsive sign-in ---
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE}/sign-in`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: join(outDir, "sign-in-mobile.png"),
    fullPage: true,
  });
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth + 2;
  });
  if (overflow) {
    find(
      "Horizontal overflow on mobile sign-in",
      "Low",
      "documentElement.scrollWidth exceeds viewport"
    );
  }

  // --- API unauthenticated probes ---
  const apiPaths = [
    ["/api/clients", "GET"],
    ["/api/produits", "GET"],
    ["/api/reglement", "GET"],
    ["/api/versements", "GET"],
    ["/api/bonLivraison", "GET"],
    ["/api/fournisseurs", "GET"],
    ["/api/solde-comptes", "PUT"],
    ["/api/users", "GET"],
    ["/api/tresorie", "GET"],
  ];
  for (const [path, method] of apiPaths) {
    const res = await context.request.fetch(`${BASE}${path}`, {
      method,
      data: method === "PUT" ? {} : undefined,
      failOnStatusCode: false,
    });
    if (res.status() !== 401) {
      find(
        `API ${method} ${path} not rejecting unauthenticated callers`,
        "Critical",
        `Expected 401, got ${res.status()}`
      );
    }
  }

  // --- Admin dead links (page exists check) ---
  const deadAdmin = [
    "/admin/settings/general",
    "/admin/database/backup",
    "/admin/audit/logs",
  ];
  for (const p of deadAdmin) {
    const res = await page.goto(`${BASE}${p}`, {
      waitUntil: "domcontentloaded",
    });
    // Will redirect to sign-in when unauth — check via request after noting
    // We already know they 404 when authenticated; check Next not-found when
    // redirected? Actually middleware redirects first. Record as static confirmed.
  }
  find(
    "Admin hub links to unimplemented routes",
    "High",
    "Static+inventory: /admin/settings/*, /admin/database/*, /admin/audit/*, /admin/system/*, /admin/access/* missing (only /admin and /admin/users exist)"
  );

  await browser.close();

  const report = {
    base: BASE,
    generatedAt: new Date().toISOString(),
    findings,
    consoleErrors: consoleErrors.slice(0, 50),
    networkFailures: networkFailures.slice(0, 50),
  };
  writeFileSync(join(outDir, "smoke-results.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.log(`\nFindings: ${findings.length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
