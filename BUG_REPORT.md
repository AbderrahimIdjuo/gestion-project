# Bug Report — gestion-project

**Date:** 2026-08-08  
**Branch under test:** `cursor/application-bug-exploration-0cd4` (base `master` @ `b61da7c`)  
**Environment:** local `npm run dev` on `:3000`  
**Database:** Neon **testing** DB only (`#test db` → host `ep-patient-union-…`, database `verceldb`). Production Neon/Turso URLs remained commented. **No env vars modified. No production data touched.**  
**Auth:** Clerk test keys (`pk_test_` / `sk_test_`). Authenticated CRUD was **not** executable — `TEST_ADMIN_*` / `TEST_COMMERCANT_*` secrets unavailable (requested via environment setup actions).

## Method

1. `npm install` (Prisma client generated against test `DATABASE_URL`)
2. `npm run dev`
3. Static review of accounting/auth/API routes + print refactor from `b61da7c`
4. Unauthenticated HTTP probes (pages + APIs)
5. Browser exploration (home, sign-in, redirects, 404s, `/test`, mobile 375px)
6. Playwright smoke: `node scripts/qa-smoke.mjs` (artifacts in `qa-artifacts/`, gitignored)

### Smoke summary

- **27/28 structural checks passed** (auth redirects, API 401s, debitage 404s, public `/test`)
- Confirmed: signed-out home fires `GET /api/statistiques` → **401**
- Confirmed: Clerk probes `SignIn_clerk_catchall_check_*` on `/` (catch-all misconfig)
- Browser confirmed Clerk console error: `<SignIn/>` not configured correctly on `/`

### Verified fixed (do not reopen)

- Unauthenticated `/api/*` (except webhook/auth) → **401**
- Page protection for `/reglement`, `/versements`, `/facturesAchats`, `/fournisseurs*` → redirect `/sign-in`
- `requireAdmin` present on reglement PATCH/PUT/DELETE, solde-comptes, imports, fournisseur DELETE

---

## Critical

### BUG-001 — Comptes rapport print page emptied by print refactor

- **Severity:** Critical  
- **Steps to reproduce:**
  1. Open Transactions → rapport comptes dialog (`components/comptes-rapport-dialog.jsx`).
  2. Click print / open `/transactions/impressionRapportComptes`.
  3. Observe blank/broken App Router page.
- **Root cause:** Commit `b61da7c` deleted 288 lines from `app/(pages)/transactions/impressionRapportComptes/page.jsx`, leaving a **0-byte** file. UI still `window.open`s that route. Colocated `page.css` is orphaned; shared `@/styles/print-rapport.css` is never imported.
- **Proposed fix:** Restore the previous page component from `b61da7c^`, migrate styles to `styles/print-rapport.css` + local column CSS, and keep a default export.

### BUG-002 — Fully paid BL still increments fournisseur dette

- **Severity:** Critical  
- **Steps to reproduce:**
  1. Create BL type `achats` with `statutPaiement = paye` (montant payé field only shown for `enPartie`).
  2. UI posts `montantPaye: ""` (`components/add-bonLivraison.jsx`).
  3. API computes `montantImpaye = montantPaye ? total - montantPaye : total` → **full total**.
  4. Bank solde is still decremented for the payment path → dette and solde both wrong.
- **Root cause:** Falsy check on `montantPaye` in `app/api/bonLivraison/route.js` (~L167) + UI omits paid amount when status is `paye`.
- **Proposed fix:** Derive unpaid amount from status (`paye` → 0, `enPartie` → total−montantPaye, else total). UI should send `montantPaye = total` when status is `paye`.

### BUG-003 — BL DELETE reverses wrong dette and never restores solde

- **Severity:** Critical  
- **Steps to reproduce:**
  1. Create BL with partial/full payment (dette < total, solde already decremented).
  2. DELETE `/api/bonLivraison/[id]`.
  3. Dette decrements by **full `total`**; creation-time bank transactions/solde are not reversed.
- **Root cause:** `app/api/bonLivraison/[id]/route.js` (~L119–131) always `decrement: bonLivraison.total` and never touches `comptesBancaires` / payment transactions.
- **Proposed fix:** Reverse unpaid amount only; delete linked payment txs and restore solde for amounts actually paid at creation.

### BUG-004 — DELETE reglement always credits solde / increments dette

- **Severity:** Critical  
- **Steps to reproduce:**
  1. Create cheque/traite reglement with `statusPrelevement != confirme` (solde not yet debited).
  2. DELETE the reglement.
  3. `comptesBancaires.solde` is incremented and `fournisseurs.dette` incremented unconditionally.
- **Root cause:** `app/api/reglement/route.js` (~L1060–1066, L1138–1142) ignores `statusPrelevement` and whether dette was applied.
- **Proposed fix:** Restore solde only if status was `confirme`; restore dette only if it was decremented at create/confirm.

### BUG-005 — PUT reglement adjusts bank solde without statusPrelevement check

- **Severity:** Critical  
- **Steps to reproduce:**
  1. Create pending (non-confirmé) reglement.
  2. PUT changing `montant` and/or `compte`.
  3. Code increments old compte and decrements new compte even though money never left the bank.
- **Root cause:** `app/api/reglement/route.js` (~L836–858); same pattern in `app/api/tresorie/update/route.js` `syncLinkedReglement`.
- **Proposed fix:** Apply solde deltas only when `statusPrelevement === "confirme"`.

### BUG-006 — Annuler prélèvement does not restore fournisseur.dette

- **Severity:** Critical  
- **Steps to reproduce:**
  1. Create règlement via `fournisseurs/paiement` (dette decremented on create).
  2. Confirm then annule (or annule from en_attente) via confirm/PATCH flow.
  3. BL allocations reverse; **dette is never incremented back**.
- **Root cause:** Cas 3 in `app/api/reglements/[id]/confirm/route.ts` (~L157–214) and parallel PATCH path in `app/api/reglement/route.js` reverse BLs only.
- **Proposed fix:** On annule, `dette += reglement.montant` (mirror create); reverse cleanly on un-annule.

### BUG-007 — paiementBlUnique cheque/traite never reduces dette; DELETE then over-corrects

- **Severity:** Critical  
- **Steps to reproduce:**
  1. Pay a BL via `paiementBlUnique` with `cheque`/`traite`.
  2. Dette/solde unchanged (only espece/versement update them).
  3. Confirm prélèvement (solde debited; dette still untouched).
  4. DELETE reglement → solde + dette both incremented → permanent inconsistency vs `fournisseurs/paiement` which always decrements dette.
- **Root cause:** `app/api/bonLivraison/paiementBlUnique/route.js` (~L92–131); confirm route never touches dette.
- **Proposed fix:** Align with `fournisseurs/paiement` (decrement dette on create for all methods) **or** decrement on confirm; gate DELETE reverses on prior side effects.

### BUG-008 — DELETE /api/devis deletes articls (wrong model) and lacks requireAdmin

- **Severity:** Critical  
- **Steps to reproduce:**
  1. As any authenticated user, `DELETE /api/devis` with body `{ "ids": ["…"] }`.
  2. Handler runs `prisma.articls.deleteMany({ id: { in: ids } })` — not devis.
- **Root cause:** `app/api/devis/route.js` (~L463–483). No `requireAdmin()`; middleware only requires any session. Wrong Prisma model.
- **Proposed fix:** `prisma.devis.deleteMany` (plus money/stock side-effect reversal) and `await requireAdmin()`.

### BUG-009 — Fournisseur DELETE cascades money rows without restoring solde

- **Severity:** Critical  
- **Steps to reproduce:**
  1. Fournisseur has confirmed règlements / linked transactions that already decremented bank solde.
  2. Admin DELETE `/api/fournisseurs/[id]`.
  3. Cascade removes reglements/transactions; bank solde stays reduced.
- **Root cause:** `app/api/fournisseurs/[id]/route.js` (~L70–78) bare `fournisseurs.delete`; Prisma `onDelete: Cascade` on related money models.
- **Proposed fix:** Before delete, reverse confirmed payments’ solde (and related BL payment state as needed).

---

## High

### BUG-010 — clerkClient used without await (admin role + webhook)

- **Severity:** High  
- **Steps to reproduce:**
  1. PATCH `/api/admin/users/[id]/role` or receive Clerk `user.created` webhook.
  2. Code calls `clerkClient.users.updateUser(...)` on a **Promise** (Clerk v6 `clerkClient` is async).
  3. Contrast: `lib/auth-utils.ts` correctly does `const client = await clerkClient()`.
- **Root cause:** `app/api/admin/users/[id]/role/route.js:22`, `app/api/webhook/clerk/route.js:55`.
- **Proposed fix:** `const client = await clerkClient(); await client.users.updateUser(...)`.

### BUG-011 — Confirm prélèvement race can double-debit solde

- **Severity:** High  
- **Steps to reproduce:**
  1. Two concurrent confirm requests for the same reglement in `en_attente`.
  2. Both read `ancienStatusPrelevement` outside the transaction, then both debit solde.
- **Root cause:** `app/api/reglements/[id]/confirm/route.ts` (~L48–94) loads status before `$transaction`.
- **Proposed fix:** Re-read (or row-lock) reglement inside the transaction; abort if already `confirme`.

### BUG-012 — Devis DELETE [id] drops transactions without bank reverse

- **Severity:** High  
- **Steps to reproduce:**
  1. Delete a paid devis via DELETE `/api/devis/[id]`.
  2. Devis + transactions by `reference: numero` removed; `comptesBancaires.solde` / versements not restored.
- **Root cause:** `app/api/devis/[id]/route.js` (~L24–33).
- **Proposed fix:** Reverse linked payment txs’ solde (and versements) before delete.

### BUG-013 — tresorie DELETE “paiement fournisseur” uses wrong reference key

- **Severity:** High  
- **Steps to reproduce:**
  1. Confirm a règlement (transaction `reference = reglement.id`, label `paiement fournisseur`).
  2. Delete that tresorerie transaction.
  3. Handler queries BLs with `fournisseurId: reference` (reglement id ≠ fournisseur id); dette restore is commented out.
- **Root cause:** `app/api/tresorie/route.js` (~L334–388) vs confirm creating `reference: reglementExistant.id`.
- **Proposed fix:** Resolve via `ReglementId` / reglement row; reverse BL allocations + dette correctly.

### BUG-014 — Middleware admin mutation gate skipped when JWT role claim is null

- **Severity:** High  
- **Steps to reproduce:**
  1. Authenticate as non-admin whose session JWT omits `metadata.role`.
  2. Middleware allows mutations on `/api/admin`, `/api/users`, imports, solde-comptes through to handlers.
  3. Money routes like BL POST / `paiementBlUnique` rely only on “any auth”.
- **Root cause:** `middleware.ts` (~L74–84) fail-open when `role === null`.
- **Proposed fix:** Fail closed if role missing on admin prefixes; add `requireAdmin` on money-mutating handlers.

### BUG-015 — Post-login redirect lands on shell-less `/dashboard`

- **Severity:** High  
- **Steps to reproduce:**
  1. Sign in via `/sign-in` (or after middleware redirect for signed-in users on auth routes).
  2. Land on `/dashboard` — no Navbar/Sidebar (`app/dashboard/page.jsx`).
  3. Real app shell + dashboard UX lives on `/` (`app/page.jsx`).
- **Root cause:** `middleware.ts:123` redirects to `/dashboard`.
- **Proposed fix:** Redirect to `/`, or wrap `/dashboard` in the same layout shell.

### BUG-016 — Home embeds SignIn on non catch-all `/` (Clerk misconfiguration)

- **Severity:** High  
- **Steps to reproduce:**
  1. Open `http://localhost:3000/` signed out.
  2. Browser console: Clerk warns `<SignIn/>` is not configured correctly (needs catch-all or `routing="hash"`).
  3. Playwright observes aborted `SignIn_clerk_catchall_check_*` requests. Dedicated `/sign-in` is clean.
- **Root cause:** `app/page.jsx` mounts `<SignIn />` on `/` without hash/path routing props.
- **Proposed fix:** Prefer linking to `/sign-in/[[...sign-in]]`, or set `routing="hash"` / `path` props per Clerk docs.

---

## Medium

### BUG-017 — window.open before localStorage.setItem (print races)

- **Severity:** Medium  
- **Steps to reproduce:**
  1. Print BL / devis fournitures / devis PDF / clients rapport / historique paiements from list actions.
  2. New tab may read empty localStorage → blank print / spinner.
- **Root cause:** e.g. `columns.tsx:273–277`, `preview-bonLivraison.jsx:238–239`, `devis-actions.jsx:93–110`, `clients-rapport-dialog.jsx:460–461`, `commandes/page.jsx:292–298`. Correct pattern exists in `components/ui/print-button.jsx` (setItem then open).
- **Proposed fix:** Always `localStorage.setItem` before `window.open`, or pass data via query/session.

### BUG-018 — Sidebar Debitage links 404

- **Severity:** Medium  
- **Steps to reproduce:** Navigate Sidebar → Débitage → Marbre / Verre.  
- **Root cause:** `components/sidebar.jsx` links `/debitage/marbre`, `/debitage/verre`; no pages; not in middleware matcher → raw 404.  
- **Proposed fix:** Remove links or add pages.

### BUG-019 — Admin hub links to 10 non-existent routes

- **Severity:** Medium  
- **Steps to reproduce:** Open `/admin` (authenticated) and click Settings/Database/Audit/System/Access buttons.  
- **Root cause:** `app/admin/page.tsx` (~L65–136); only `/admin/users` exists.  
- **Proposed fix:** Remove stubs or implement pages.

### BUG-020 — newDeviSchema allows optional quantite/prixUnite → NaN totals

- **Severity:** Medium  
- **Steps to reproduce:** Submit devis line with empty qty/price; schema accepts `undefined`; totals can become NaN.  
- **Root cause:** `app/zodSchemas/newDeviSchema.jsx` (~L25–58) `.optional()` after preprocess.  
- **Proposed fix:** Require positive numbers for line items.

### BUG-021 — Historique paiements JSON.parse before null check

- **Severity:** Medium  
- **Steps to reproduce:** Open `/ventes/devis/[id]/historiquePaiements` without prior localStorage write.  
- **Root cause:** `historiquePaiements/page.jsx` (~L36–45) logs `JSON.parse(devisDetails)` before null guard → console exception / empty UI.  
- **Proposed fix:** Guard null before parse; prefer server fetch by id.

### BUG-022 — Signed-out home still queries statistiques (401 noise)

- **Severity:** Medium  
- **Steps to reproduce:** Load `/` while signed out; network shows `/api/statistiques` 401.  
- **Root cause:** `app/page.jsx` `useQuery` runs unconditionally before `isSignedIn` early return.  
- **Proposed fix:** `enabled: isSignedIn && isLoaded`.

### BUG-023 — `/test` publicly reachable outside middleware matcher

- **Severity:** Medium  
- **Steps to reproduce:** Open `/test` signed out → 200 “Test page”.  
- **Root cause:** Route not in `middleware.ts` matcher/protectedPrefixes.  
- **Proposed fix:** Remove page in production builds or protect it.

### BUG-024 — Factures Achats print is a stub

- **Severity:** Medium  
- **Steps to reproduce:** Click print on Factures Achats → toast “Fonctionnalité d'impression à venir”.  
- **Root cause:** `app/(pages)/facturesAchats/page.tsx` (~L247–248).  
- **Proposed fix:** Implement print or hide the control.

### BUG-025 — Admin-only pages lack page-level role guard

- **Severity:** Medium  
- **Steps to reproduce:** Non-admin with a session can navigate to `/parametres/*`, `/Employes` if they know the URL (Sidebar may hide links).  
- **Root cause:** Role filtering mainly in Sidebar; pages/APIs inconsistent.  
- **Proposed fix:** Server-side `requireAdmin` / layout guards on admin UI routes.

---

## Low

### BUG-026 — Invalid Tailwind class `justify between`

- **Severity:** Low  
- **Steps to reproduce:** Inspect layout next to settings sidebar on reglement/transactions/parametres/facturesAchats pages.  
- **Root cause:** Missing hyphen → class ignored (`justify between` vs `justify-between`) on ~10 pages.  
- **Proposed fix:** Replace with `justify-between`.

### BUG-027 — Sidebar expand relies on hover (poor touch UX)

- **Severity:** Low  
- **Steps to reproduce:** On mobile/touch, try expanding Sidebar sections that use `onMouseEnter`.  
- **Root cause:** Hover-only expand in `components/sidebar.jsx`.  
- **Proposed fix:** Click/tap toggles; ensure mobile drawer pattern.

---

## Testing gaps (blocked)

| Area | Status |
|------|--------|
| Authenticated create/edit/delete/search | Blocked — need `TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD` (+ optional commercant) |
| Pagination / filtering with real data | Blocked — needs auth |
| Role matrix (admin vs commercant) | Blocked — needs both roles |
| Empty states after deletes | Partially covered via static analysis; runtime needs auth |
| Race condition load tests | Static confirmation only (BUG-011) |
| DB inconsistency end-to-end assertions | Not run against live rows (safety: test DB only; no mutating probes without auth fixtures) |

## How to re-run smoke

```bash
npm install
npx playwright install chromium
npm run dev   # separate terminal; uses existing .env test DATABASE_URL
node scripts/qa-smoke.mjs
```

Artifacts: `qa-artifacts/smoke-results.json`, `home.png`, `sign-in-mobile.png`.
