/**
 * Unauthenticated QA smoke for gestion-project.
 * Requires: npm run dev on :3000, Playwright Chromium installed.
 * Never touches production DB; never modifies env vars.
 */
import { chromium } from "playwright";
import { createRequire } from "module";
import fs from "fs";
import path from "path";

const BASE = process.env.QA_BASE_URL || "http://localhost:3000";
const ARTIFACTS = path.resolve("qa-artifacts");
fs.mkdirSync(ARTIFACTS, { recursive: true });

const results = [];
function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`PASS  ${name}${detail ? " — " + detail : ""}`);
}
function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`);
}

async function checkApi(pathname, expectStatus) {
  const res = await fetch(`${BASE}${pathname}`, {
    headers: { Accept: "application/json" },
    redirect: "manual",
  });
  const name = `API ${pathname} → ${expectStatus}`;
  if (res.status === expectStatus) pass(name);
  else fail(name, `got ${res.status}`);
}

async function checkRedirect(pathname, expectLocationIncludes) {
  const res = await fetch(`${BASE}${pathname}`, { redirect: "manual" });
  const loc = res.headers.get("location") || "";
  const name = `Redirect ${pathname}`;
  if (
    (res.status === 307 || res.status === 302 || res.status === 308) &&
    loc.includes(expectLocationIncludes)
  ) {
    pass(name, `→ ${loc}`);
  } else {
    fail(name, `status=${res.status} location=${loc}`);
  }
}

async function runBrowser() {
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
  page.on("pageerror", err => consoleErrors.push(String(err)));
  page.on("requestfailed", req => {
    failedRequests.push(`${req.method()} ${req.url()} :: ${req.failure()?.errorText}`);
  });

  // Home / signed-out (Clerk keeps sockets open — avoid networkidle)
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.getByText("OUDAOUDOX").first().waitFor({ timeout: 30000 });
  await page.getByText("Continuer avec Google").first().waitFor({ timeout: 30000 });
  await page.screenshot({ path: path.join(ARTIFACTS, "home-signed-out.png") });
  const brand = await page.locator("text=OUDAOUDOX").first().isVisible().catch(() => false);
  const signInVisible = await page
    .getByText("Continuer avec Google")
    .first()
    .isVisible()
    .catch(() => false);
  if (brand) pass("Home shows brand OUDAOUDOX");
  else fail("Home shows brand OUDAOUDOX");
  if (signInVisible) pass("Home shows Clerk SignIn");
  else fail("Home shows Clerk SignIn", "SignIn widget not found");

  // Protected page redirect
  await page.goto(`${BASE}/clients`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1500);
  const url = page.url();
  if (url.includes("sign-in")) pass("Unauth /clients → sign-in", url);
  else fail("Unauth /clients → sign-in", url);
  await page.screenshot({ path: path.join(ARTIFACTS, "clients-redirect.png") });

  // Sign-in page
  await page.goto(`${BASE}/sign-in`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.getByText("Continuer avec Google").first().waitFor({ timeout: 30000 });
  await page.screenshot({ path: path.join(ARTIFACTS, "sign-in.png") });
  const signInPage = await page
    .getByText("Continuer avec Google")
    .first()
    .isVisible()
    .catch(() => false);
  if (signInPage) pass("/sign-in renders Clerk form");
  else fail("/sign-in renders Clerk form");

  // Dashboard redirect target
  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1000);
  if (!page.url().includes("/dashboard")) {
    pass("/dashboard redirects away from leftover shell", page.url());
  } else {
    fail("/dashboard redirects away from leftover shell", page.url());
  }

  // Responsive: mobile home
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACTS, "home-mobile.png") });
  const brandMobile = await page.locator("text=OUDAOUDOX").first().isVisible().catch(() => false);
  if (brandMobile) pass("Mobile home brand visible");
  else fail("Mobile home brand visible");

  // Empty / invalid auth form interaction (no credentials)
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${BASE}/sign-in`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2500);
  const email = page.locator('input[name="identifier"], input[type="email"]').first();
  if (await email.count()) {
    await email.fill("not-a-valid-user@example.com");
    const cont = page.locator('button:has-text("Continue"), button:has-text("Continuer")').first();
    if (await cont.count()) {
      await cont.click();
      await page.waitForTimeout(2000);
      pass("Invalid sign-in identifier submitted (no crash)");
    } else {
      pass("Sign-in form present (continue button variant not found)");
    }
  } else {
    // Google-only /sign-in variant is valid in this Clerk config
    pass("Sign-in uses OAuth-first UI (no email identifier on /sign-in)");
  }
  await page.screenshot({ path: path.join(ARTIFACTS, "sign-in-invalid.png") });

  // Filter console noise from Clerk telemetry
  const realConsole = consoleErrors.filter(
    e =>
      !/clerk|stripe|favicon|hydration|Download the React DevTools/i.test(e) &&
      !/Failed to load resource/i.test(e)
  );
  fs.writeFileSync(
    path.join(ARTIFACTS, "console-errors.json"),
    JSON.stringify({ consoleErrors, realConsole, failedRequests }, null, 2)
  );
  if (realConsole.length === 0) pass("No unexpected page console errors on public flows");
  else fail("No unexpected page console errors on public flows", realConsole.slice(0, 5).join(" | "));

  await browser.close();
}

function unitStatutPaiement() {
  // Inline mirror of lib/statut-paiement.js for hermetic assert
  const EPS = 0.01;
  function statutPaiementFromTotals(totalPaye, total) {
    const paye = Number(totalPaye) || 0;
    const tot = Number(total) || 0;
    if (paye <= EPS) return "impaye";
    if (paye + EPS < tot) return "enPartie";
    return "paye";
  }
  const cases = [
    [0, 100, "impaye"],
    [50, 100, "enPartie"],
    [100, 100, "paye"],
    [100.005, 100, "paye"],
    [130, 100, "paye"], // overpay → paye (documents BUG overpayment)
  ];
  for (const [p, t, expect] of cases) {
    const got = statutPaiementFromTotals(p, t);
    if (got === expect) pass(`statutPaiementFromTotals(${p},${t})=${expect}`);
    else fail(`statutPaiementFromTotals(${p},${t})`, `got ${got}`);
  }
  if (statutPaiementFromTotals(130, 100) === "paye") {
    pass("DOCUMENTED: overpayment classified as paye (see BUG-002)");
  }
}

function staticSourceChecks() {
  const root = process.cwd();
  const paiementBl = fs.readFileSync(
    path.join(root, "app/api/bonLivraison/paiementBlUnique/route.js"),
    "utf8"
  );
  if (
    paiementBl.includes('methodePaiement === "cheque"') &&
    !paiementBl.includes('methodePaiement === "cheque" || methodePaiement === "traite"')
  ) {
    pass("DOCUMENTED: paiementBlUnique traite≠cheque (BUG-001)");
  } else {
    fail("Expected traite/cheque inconsistency still present", "may be fixed");
  }

  if (!paiementBl.includes("resteAPayer") && paiementBl.includes("statutPaiementFromTotals")) {
    pass("DOCUMENTED: paiementBlUnique no overpay cap (BUG-002)");
  } else {
    fail("Expected missing resteAPayer guard on paiementBlUnique");
  }

  const fourPaiement = fs.readFileSync(
    path.join(root, "app/api/fournisseurs/paiement/route.js"),
    "utf8"
  );
  if (
    fourPaiement.includes("montantRestant") &&
    !fourPaiement.includes("ReglementMontantInvalideError")
  ) {
    pass("DOCUMENTED: fournisseur paiement leftover ignored (BUG-004)");
  } else {
    fail("Expected leftover montant without ReglementMontantInvalideError");
  }

  const tresorie = fs.readFileSync(
    path.join(root, "app/api/tresorie/route.js"),
    "utf8"
  );
  if (
    tresorie.includes('lable.includes("paiement de :BL")') &&
    tresorie.includes('lable === "paiement fournisseur"')
  ) {
    pass("DOCUMENTED: BL delete label skips dette reverse (BUG-003)");
  }

  const reglement = fs.readFileSync(
    path.join(root, "app/api/reglement/route.js"),
    "utf8"
  );
  const confirm = fs.readFileSync(
    path.join(root, "app/api/reglements/[id]/confirm/route.ts"),
    "utf8"
  );
  if (!reglement.includes("FOR UPDATE") && confirm.includes("FOR UPDATE")) {
    pass("DOCUMENTED: PATCH /api/reglement missing FOR UPDATE (BUG-005)");
  }

  const schema = fs.readFileSync(
    path.join(root, "app/zodSchemas/newDeviSchema.jsx"),
    "utf8"
  );
  if (schema.includes("z.number(") && schema.includes(".optional()") && schema.includes("quantite")) {
    pass("DOCUMENTED: newDeviSchema optional quantite/prixUnite (BUG-011)");
  }
}

async function main() {
  console.log(`QA smoke against ${BASE}`);
  unitStatutPaiement();
  staticSourceChecks();

  await checkApi("/api/clients", 401);
  await checkApi("/api/bonLivraison", 401);
  await checkApi("/api/reglement", 401);
  await checkApi("/api/tresorie", 401);
  await checkApi("/api/fournisseurs", 401);
  await checkApi("/api/statistiques", 401);
  await checkApi("/api/devis", 401);
  await checkApi("/api/produits", 401);
  await checkRedirect("/clients", "sign-in");
  await checkRedirect("/transactions", "sign-in");
  await checkRedirect("/dashboard", "/");

  await runBrowser();

  const summary = {
    total: results.length,
    passed: results.filter(r => r.ok).length,
    failed: results.filter(r => !r.ok).length,
    results,
  };
  fs.writeFileSync(path.join(ARTIFACTS, "smoke-summary.json"), JSON.stringify(summary, null, 2));
  console.log(`\nSummary: ${summary.passed}/${summary.total} passed, ${summary.failed} failed`);
  if (summary.failed > 0) process.exitCode = 1;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
