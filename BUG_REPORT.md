# BUG REPORT — gestion-project

**Date:** 2026-08-09  
**Branch tested:** `cursor/application-bug-exploration-82b2` @ `cf8425a`  
**Environment:** local Next.js 14 (`npm run dev`), **testing Neon DB only** (`#test db` in `.env`; production URL remains commented). Env vars were **not** modified.  
**Auth:** Clerk test keys. Authenticated CRUD skipped — `TEST_ADMIN_*` / `TEST_COMMERCANT_*` secrets not available.  
**Automation:** Playwright smoke `scripts/qa-smoke.mjs` → **32/32 passed** (artifacts in `qa-artifacts/`, gitignored). Browser exploration confirmed console/network issues on `/`.

---

## Executive summary

Commit `cf8425a` fixed several Critical accounting bugs (BL payé dette, BL DELETE reverse, règlement DELETE/PUT solde guards, confirm/annuler dette alignment, restored empty `impressionRapportComptes` page).

Remaining highest-risk issues: **DELETE `/api/devis` deletes `articls` without admin**, **transaction edit syncs solde/dette for unconfirmed chèques**, **paiementBlUnique model inconsistency**, **fournisseur DELETE leaves bank solde wrong**, plus UI races and role-guard gaps.

---

## Fixed in `cf8425a` (do not re-open)

| Former issue | Status |
|---|---|
| BL POST increments dette when `statut=paye` / omitted `montantPaye` | Fixed (`montantImpaye=0` when paye; UI sends `montantPaye=total`) |
| BL DELETE does not reverse dette/solde | Fixed (refund + reverse reglements + dette residual) |
| DELETE règlement always restores solde | Fixed (guard on `statusPrelevement === "confirme"`) |
| PUT règlement adjusts solde without confirm check | Fixed on PUT path |
| Annuler prélèvement does not restore `fournisseur.dette` | Fixed (confirm Cas 2 + PATCH) |
| `impressionRapportComptes/page.jsx` empty (0 bytes) | Fixed (12 072 bytes restored) |

---

## Open bugs

### BUG-001 — DELETE `/api/devis` deletes `articls` and skips admin check
- **Severity:** Critical
- **Steps to reproduce:**
  1. Authenticate as any user (including non-admin).
  2. `DELETE /api/devis` with body `{ "ids": ["<articlId>", ...] }`.
  3. Observe response `"N records deleted."`
- **Root cause:** `app/api/devis/route.js` `DELETE` calls `prisma.articls.deleteMany` and never calls `requireAdmin()`. Middleware only requires auth for `/api/devis` (not in admin mutation list). Contrasts with `DELETE /api/devis/[id]` which deletes a devis (admin) but still fails to reverse bank payments.
- **Proposed fix:** Require admin. Change list DELETE to delete **devis** by id (cascade articls) and reverse linked payment soldes inside a transaction. Never expose raw articls deletion under `/api/devis`.

### BUG-002 — Editing a transaction linked to an unconfirmed règlement moves bank solde and dette
- **Severity:** Critical
- **Steps to reproduce:**
  1. Create a fournisseur chèque règlement (`statusPrelevement=en_attente`).
  2. Confirm a linked transaction exists (or create via flow that attaches `ReglementId`).
  3. `PUT /api/tresorie/update` changing the transaction amount/compte.
  4. Observe `comptesBancaires.solde` and `fournisseurs.dette` change even though prélèvement was never confirmed.
- **Root cause:** `syncLinkedReglementOnTransactionEdit` in `app/api/tresorie/update/route.js` always increments/decrements solde and adjusts dette with no `statusPrelevement === "confirme"` guard (unlike fixed PUT `/api/reglement`).
- **Proposed fix:** Mirror PUT règlement guards; only adjust solde/dette when confirmed. For `en_attente`, sync cheque/reglement metadata only.

### BUG-003 — `paiementBlUnique` increments `totalPaye` for chèque/traite without dette/solde (and traite creates no cheque)
- **Severity:** Critical
- **Steps to reproduce:**
  1. `POST /api/bonLivraison/paiementBlUnique` with `methodePaiement=cheque` (or `traite`).
  2. BL `totalPaye` increases; fournisseur `dette` unchanged; no bank transaction.
  3. For `traite`, no `cheques` row is created (unlike `fournisseurs/paiement`).
- **Root cause:** `app/api/bonLivraison/paiementBlUnique/route.js` always `totalPaye: { increment }` before method check; dette/solde only for `espece`/`versement`; cheque create gated on `methodePaiement === "cheque"` only.
- **Proposed fix:** Align with deferred-confirm model: create règlement/cheque for both cheque and traite; defer `totalPaye`/dette until confirm (or apply immediately for all methods—pick one consistent model).

### BUG-004 — DELETE fournisseur cascades reglements/transactions without reversing bank solde
- **Severity:** Critical
- **Steps to reproduce:**
  1. Create confirmed fournisseur payments that decremented `comptesBancaires.solde`.
  2. `DELETE /api/fournisseurs/:id` as admin.
  3. Related `Reglement` / BL / cheques cascade-delete; bank solde stays reduced.
- **Root cause:** `app/api/fournisseurs/[id]/route.js` bare `prisma.fournisseurs.delete`; Prisma `onDelete: Cascade` removes children without solde reverse.
- **Proposed fix:** Before delete, reverse solde for every confirmed règlement (and decide BL create-time payment policy) inside a transaction.

### BUG-005 — DELETE devis by id removes payment transactions without reversing bank solde
- **Severity:** High
- **Steps to reproduce:**
  1. Pay a devis (bank solde incremented via recette).
  2. `DELETE /api/devis/:id` as admin.
  3. Devis deleted; `transactions.deleteMany({ reference: numero })` runs; solde remains inflated.
- **Root cause:** `app/api/devis/[id]/route.js` deletes txs without reversing `comptesBancaires.solde` / related versements; not atomic with devis delete.
- **Proposed fix:** For each linked tx, reverse compte solde (and versement) inside one Prisma transaction before delete.

### BUG-006 — Confirm prélèvement race can double-apply solde/dette
- **Severity:** High
- **Steps to reproduce:**
  1. Create `en_attente` chèque règlement with `datePrelevement`.
  2. Fire two parallel `POST /api/reglements/:id/confirm` with `{ "status": "confirme" }`.
  3. Both may apply Cas 1 using the same pre-tx snapshot → double solde decrement + double dette decrement.
- **Root cause:** `app/api/reglements/[id]/confirm/route.ts` loads `reglementExistant` outside `$transaction`; status update is last inside tx with no conditional/`FOR UPDATE`.
- **Proposed fix:** Re-fetch inside tx with row lock, or `updateMany` where `statusPrelevement = ancien` and abort if count=0.

### BUG-007 — `clerkClient` used without await in admin role + webhook
- **Severity:** High
- **Steps to reproduce:**
  1. `PATCH /api/admin/users/:id/role` or trigger Clerk `user.created` webhook.
  2. Role update fails or throws (Promise has no `.users`).
- **Root cause:** `@clerk/nextjs` v6 exports async `clerkClient()`. `app/api/admin/users/[id]/role/route.js` and `app/api/webhook/clerk/route.js` call `await clerkClient.users.updateUser(...)`. (`app/api/users/route.js` correctly uses `createClerkClient`.)
- **Proposed fix:** `const client = await clerkClient(); await client.users.updateUser(...)`.

### BUG-008 — Tresorerie DELETE `handleSpecialLabels` wrong reference for paiement fournisseur
- **Severity:** High
- **Steps to reproduce:**
  1. Confirm a prélèvement (tx `lable="paiement fournisseur"`, `reference=reglement.id`).
  2. `DELETE /api/tresorie?id=<txId>`.
  3. Solde may restore via depense branch, but BL `totalPaye` / dette / reglement sync use `fournisseurId: reference` which does not match.
- **Root cause:** `handleSpecialLabels` in `app/api/tresorie/route.js` assumes `reference` is `fournisseurId`; confirm/`paiementBlUnique` store `reglement.id`. Dette restore is commented out.
- **Proposed fix:** Resolve via `ReglementId` / allocations; reverse dette when confirmed; sync or delete reglement.

### BUG-009 — Post-login `/dashboard` has no app shell (Navbar/Sidebar)
- **Severity:** High
- **Steps to reproduce:**
  1. Sign in (middleware redirects to `/dashboard`).
  2. Page renders without Navbar/Sidebar; real shell lives on `/`.
- **Root cause:** Shell is per-page; `app/dashboard/page.jsx` omits it; Sidebar “Dashboard” points to `/`.
- **Proposed fix:** Redirect signed-in users to `/`, or hoist Navbar+Sidebar into root layout / add them to `/dashboard`.

### BUG-010 — Admin-only pages rely on Sidebar filter only
- **Severity:** High
- **Steps to reproduce:**
  1. Sign in as commercant.
  2. Navigate directly to `/parametres/banques` or `/Employes`.
  3. Pages load (middleware only checks auth, not role).
- **Root cause:** Role filtering only in `components/sidebar.jsx`; pages lack server-side `requireAdmin` / role redirect.
- **Proposed fix:** Server-side role guard on parametres/* and Employes (and preferably middleware prefixes).

### BUG-011 — Compte rapport print ignores `transfert` (preview includes it)
- **Severity:** High
- **Steps to reproduce:**
  1. Open Transactions → Rapport compte with `transfert` rows.
  2. Preview totals/running balance include transfert as dépense.
  3. Click Imprimer → print page only handles `recette`/`depense`/`vider`.
- **Root cause:** `components/comptes-rapport-dialog.jsx` includes `transfert`; `app/(pages)/transactions/impressionRapportComptes/page.jsx` `calculateTotals` / running balance omit it. Designation labels also differ (raw description vs mapped labels).
- **Proposed fix:** Mirror dialog logic (totals, running balance, designation mapping) in the print page.

### BUG-012 — `window.open` before `localStorage.setItem` race on several print flows
- **Severity:** High
- **Steps to reproduce:**
  1. Print from devis actions, clients rapport, BL preview, etc.
  2. New tab may read empty/stale localStorage and render blank/wrong data.
- **Root cause:** e.g. `components/devis-actions.jsx`, `components/clients-rapport-dialog.jsx`, `components/preview-bonLivraison.jsx` open the tab before writing storage. (Some flows like comptes rapport correctly setItem first.)
- **Proposed fix:** Always `localStorage.setItem` then `window.open` (see `print-button.jsx` / factures pattern).

### BUG-013 — Legacy chèque/traite may double-decrement dette on confirm after `cf8425a`
- **Severity:** High
- **Steps to reproduce:**
  1. Confirm an `en_attente` chèque created **before** `cf8425a` (old path already decremented dette at creation).
  2. Confirm flow now also decrements dette → double decrement.
- **Root cause:** Model change in `fournisseurs/paiement` (defer dette) + confirm now always decrements dette on →`confirme`, without detecting legacy rows.
- **Proposed fix:** One-time data migration, or confirm only adjusts dette when not already applied (flag / heuristic).

### BUG-014 — Home `/` embeds `<SignIn/>` without catch-all / hash routing
- **Severity:** Medium
- **Steps to reproduce:**
  1. Open `/` signed out.
  2. Console: `Clerk: The <SignIn/> component is not configured correctly` + `SignIn_clerk_catchall_check_*` aborted (Playwright + browser confirmed).
- **Root cause:** `<SignIn />` on `/` without `routing="hash"` or `[[...sign-in]]` catch-all; dedicated `/sign-in/[[...sign-in]]` is correct.
- **Proposed fix:** Use `routing="hash"` on home SignIn, or redirect unauthenticated users to `/sign-in`.

### BUG-015 — Signed-out home still fetches `/api/statistiques` (401 loop noise)
- **Severity:** Medium
- **Steps to reproduce:**
  1. Load `/` signed out; Network shows repeated `GET /api/statistiques` → 401 (smoke + browser).
- **Root cause:** `app/page.jsx` `useQuery` runs before `isSignedIn` early return; missing `enabled: isLoaded && isSignedIn`.
- **Proposed fix:** Gate the query with `enabled`.

### BUG-016 — Sidebar Débitage links 404
- **Severity:** Medium
- **Steps to reproduce:** Sidebar → Débitage → Marbre/Verre → Next.js 404 (smoke: status 404).
- **Root cause:** `components/sidebar.jsx` links to `/debitage/marbre|verre` with no app routes.
- **Proposed fix:** Remove menu items or implement pages.

### BUG-017 — Admin hub links to non-existent routes
- **Severity:** Medium
- **Steps to reproduce:** Open `/admin` → cards for settings/database/audit/system/access → 404 (only `/admin/users` exists).
- **Root cause:** Stub links in `app/admin/page.tsx`.
- **Proposed fix:** Remove stubs or implement routes.

### BUG-018 — Shared localStorage key `params` across print flows
- **Severity:** Medium
- **Steps to reproduce:** Open two print tabs from transactions / reglement / devis / facturesAchats that all write `params`.
- **Root cause:** Same key overwritten → wrong filters/data in the other tab.
- **Proposed fix:** Namespace keys (`transactions-params`, `reglement-params`, …).

### BUG-019 — historiquePaiements parses localStorage before null check
- **Severity:** Medium
- **Steps to reproduce:** Open `/ventes/devis/[id]/historiquePaiements` without prior localStorage.
- **Root cause:** `JSON.parse(devisDetails)` before null guard → throw.
- **Proposed fix:** Guard then parse; remove parse-in-`console.log`.

### BUG-020 — Devis schema allows empty qty/price → NaN totals
- **Severity:** Medium
- **Steps to reproduce:** Create devis with empty quantite/prixUnite; submit/totals show NaN.
- **Root cause:** `newDeviSchema` marks fields `.optional()`; UI multiplies without defaults.
- **Proposed fix:** Require positive numbers or default 0 and block submit.

### BUG-021 — Factures Achats print is a stub
- **Severity:** Medium
- **Steps to reproduce:** Factures Achats → Imprimer → toast “à venir”; `window.open` commented.
- **Root cause:** Incomplete feature in `app/(pages)/facturesAchats/page.tsx`.
- **Proposed fix:** Implement print page or hide the button.

### BUG-022 — BL DELETE trusts query `type` / `fournisseurId` over DB
- **Severity:** Medium
- **Steps to reproduce:** `DELETE /api/bonLivraison/:id?type=retour` on an `achats` BL.
- **Root cause:** `resolvedType = type || existing.type` in `app/api/bonLivraison/[id]/route.js` → wrong dette direction.
- **Proposed fix:** Always use DB `existing.type` / `existing.fournisseurId`.

### BUG-023 — BL DELETE multi-BL does not sync `cheque.montant`
- **Severity:** Medium
- **Steps to reproduce:** Delete one BL covered by a multi-BL chèque règlement.
- **Root cause:** `reverseReglementsLinkedToBl` reduces `reglement.montant` but leaves linked `cheques.montant` at full amount.
- **Proposed fix:** Update cheque montant in the same reverse path.

### BUG-024 — Transactions impression footer ignores `vider`
- **Severity:** Medium
- **Steps to reproduce:** Print filtered transaction list including `vider`.
- **Root cause:** `groupTransactionsByType` includes `vider`; `total()` only adjusts `recette`/`depense` in `impression/page.jsx`.
- **Proposed fix:** Include `vider` (and `transfert` if applicable) in footer totals.

### BUG-025 — `/test` publicly reachable
- **Severity:** Low–Medium
- **Steps to reproduce:** Visit `/test` signed out → 200 “Test page” (smoke confirmed).
- **Root cause:** Not in middleware matcher / protectedPrefixes.
- **Proposed fix:** Remove page or protect it.

### BUG-026 — Invalid Tailwind class `justify between`
- **Severity:** Low
- **Steps to reproduce:** Load transactions/reglement/parametres/facturesAchats headers — spacing wrong.
- **Root cause:** Typo `justify between` instead of `justify-between` on ~10 pages.
- **Proposed fix:** Replace with `justify-between`.

### BUG-027 — Middleware admin gate skipped when JWT role claim is null
- **Severity:** High (defense-in-depth gap; enables BUG-001 for authenticated non-admins if route forgets `requireAdmin`)
- **Steps to reproduce:** Authenticate with session claims omitting `publicMetadata.role`; call sensitive mutations not covered by route-level `requireAdmin`.
- **Root cause:** `middleware.ts` allows through when `role === null`, relying on handlers.
- **Proposed fix:** Ensure Clerk JWT template includes role; treat missing role as deny for admin mutation prefixes; add `/api/devis` DELETE to admin list once semantics fixed.

---

## Smoke / exploration matrix

| Area | Result |
|---|---|
| Install deps | `npm install` (lockfile had peer drift; Playwright added as devDependency) |
| Dev server | Ready on `:3000` with `.env.local` + `.env` (test DB) |
| Auth redirects | All protected pages → `/sign-in` |
| API unauthenticated | `/api/*` probes → 401; DELETE `/api/devis` → 401 anonymously |
| Home brand + Clerk UI | Pass |
| Home statistiques 401 | Confirmed bug |
| Clerk SignIn misconfig | Confirmed (browser console + catchall probe) |
| Débitage routes | 404 |
| `/test` public | Confirmed |
| Mobile 390px home/sign-in | Layout OK |
| Authenticated CRUD / pagination / filters | **Skipped** — need test login secrets |
| Production DB | **Not used** |

---

## Recommended fix order

1. BUG-001 / BUG-027 — devis DELETE articls + admin gate  
2. BUG-002 — tresorie update syncLinked solde/dette guard  
3. BUG-003 — paiementBlUnique consistency  
4. BUG-004 / BUG-005 — delete cascades without bank reverse  
5. BUG-006 / BUG-007 / BUG-008 / BUG-013 — confirm race, clerkClient, special labels, legacy dette  
6. BUG-009–012 / BUG-014–015 — shell, role guards, print races, Clerk home, stats gate  

---

## How to re-run smoke

```bash
npm install
npx playwright install chromium
npm run dev   # separate terminal, test DB only
node scripts/qa-smoke.mjs
```
