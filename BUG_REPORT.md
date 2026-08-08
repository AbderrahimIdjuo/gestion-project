# BUG REPORT — gestion-project

**Date:** 2026-08-08  
**Branch:** `cursor/application-bug-exploration-6954` (base: `master`, head includes Clerk API auth hardening)  
**Environment:** local Next.js dev (`npm run dev`), **Neon test DB** (`#test db` / `verceldb` — production Neon URL left commented), Clerk **test** keys  
**Constraints honored:** no env var changes, no production DB usage, no production data deletion  

## How this was tested

| Layer | What ran |
| --- | --- |
| Install | `npm install`, Prisma generate, Playwright Chromium |
| Server | `npm run dev` on `http://localhost:3000` |
| API probes | Unauthenticated GET/PUT against clients, produits, reglement, versements, BL, fournisseurs, solde-comptes, users, tresorie → all **401** |
| Browser | Manual Chromium exploration of `/`, `/sign-in`, `/sign-up`, protected redirects, `/test`, `/debitage/marbre`, mobile 375px |
| Playwright | `node scripts/qa-smoke.mjs` (artifacts under `qa-artifacts/`) |
| Static review | Full pass of `middleware.ts`, financial APIs, Clerk usage, print flows, sidebar/admin routes |

**Not fully executed (blocked):** authenticated CRUD, search/filter/pagination with real data, and role-gated UI flows — no `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` (or equivalent) were available in the environment. Accounting bugs below are confirmed by code path analysis against the current handlers.

---

## Summary

| Severity | Count |
| --- | --- |
| Critical | 3 |
| High | 10 |
| Medium | 8 |
| Low | 3 |

Middleware auth from the latest push correctly blocks unauthenticated API/page access for the main surfaces. Remaining defects are dominated by **dette/solde consistency**, broken **Clerk client awaits**, and **frontend routing/UX** issues.

---

## Critical

### BUG-001 — Fully paid BL creation still increases fournisseur dette
- **Severity:** Critical  
- **Steps to reproduce:**
  1. Open Achats → Bon de livraison → create an **achats** BL.
  2. Set statut paiement to **paye** (montant payé field is hidden).
  3. Choose a bank account and submit.
  4. Observe bank `solde` decreases by `total`, but `fournisseurs.dette` **also increases by `total`**.
- **Root cause:** UI sends empty `montantPaye` when statut is `paye`. API computes unpaid as `montantPaye ? total - montantPaye : total`, so falsy `montantPaye` means fully unpaid — even though `totalPaye`/`solde` correctly use `statutPaiement === "paye" ? total : …`.
- **Evidence:** `components/add-bonLivraison.jsx` (empty `montantPaye` for `paye`); `app/api/bonLivraison/route.js` lines ~74–79 vs ~167.
- **Proposed fix:** Compute unpaid as `totalNum - montant` (reuse the already-correct `montant` variable), or treat `statutPaiement === "paye"` as `montantImpaye = 0`.

### BUG-002 — BL DELETE adjusts dette by full total and never restores bank solde
- **Severity:** Critical  
- **Steps to reproduce:**
  1. Create unpaid achats BL of 1000 → dette += 1000.
  2. Partially pay 400 via règlement → dette/totalPaye update.
  3. Delete the BL as admin.
  4. Dette decrements by **1000** (not the remaining unpaid 600). Creation-time payments (if any) leave bank solde unrestored.
- **Root cause:** DELETE uses `dette: { decrement: bonLivraison.total }` and does not reverse creation-time `comptesBancaires`/`transactions` effects.
- **Evidence:** `app/api/bonLivraison/[id]/route.js` lines ~118–130.
- **Proposed fix:** Decrement dette by unpaid amount (`total - (totalPaye ?? 0)` for achats); reverse linked creation payments/transactions/solde inside the same transaction.

### BUG-003 — DELETE règlement always credits bank solde (even if never confirmed)
- **Severity:** Critical  
- **Steps to reproduce:**
  1. Create a cheque règlement with `statusPrelevement=en_attente` (solde unchanged at creation).
  2. DELETE `/api/reglement?id=…`.
  3. Bank `solde` **increases** by `montant` without a prior debit.
- **Root cause:** Solde restore runs unconditionally; no guard on `statusPrelevement === "confirme"` (or espece/versement that debited immediately). Dette is also always incremented, which compounds with BUG-006 for BL-unique cheque payments.
- **Evidence:** `app/api/reglement/route.js` lines ~1060–1066 and ~1138–1141.
- **Proposed fix:** Only restore solde when the règlement previously debited the account; only restore dette when dette was previously decremented.

---

## High

### BUG-004 — PUT règlement moves bank money regardless of prélèvement status
- **Severity:** High  
- **Steps to reproduce:** Create pending cheque règlement → edit montant/compte via PUT → old account credited and new account debited even though funds were never taken.  
- **Root cause:** Solde adjustment ignores `statusPrelevement`; only some transaction sync is gated on `confirme`.  
- **Evidence:** `app/api/reglement/route.js` ~836–857; similar pattern in `app/api/tresorie/update/route.js`.  
- **Proposed fix:** Wrap solde moves in `if (statusPrelevement === "confirme")` (and mirror for methods that debit immediately).

### BUG-005 — Cancelling a prélèvement does not restore fournisseur.dette
- **Severity:** High  
- **Steps to reproduce:** Pay fournisseur (dette decreases) → set status to `annule` via confirm/PATCH → BL `totalPaye` reverts, dette stays reduced.  
- **Root cause:** Cas 3 reverses BL allocations only; no `dette.increment`.  
- **Evidence:** `app/api/reglements/[id]/confirm/route.ts` ~157–214; `app/api/reglement/route.js` PATCH Cas 3.  
- **Proposed fix:** On transition to `annule`, restore dette by the règlement amount (and reverse when leaving `annule`).

### BUG-006 — `paiementBlUnique` skips dette for cheque/traite
- **Severity:** High  
- **Steps to reproduce:** Pay a BL with cheque via paiement dialog → BL `totalPaye` increases, dette unchanged → later confirm prélèvement → solde debited, dette still unchanged.  
- **Root cause:** Dette decrement only inside espece/versement branch; confirm route never touches dette.  
- **Evidence:** `app/api/bonLivraison/paiementBlUnique/route.js` ~92–131.  
- **Proposed fix:** Decrement dette at creation (like `/api/fournisseurs/paiement`) **or** on confirm — pick one consistent policy.

### BUG-007 — `clerkClient` async misuse breaks admin role update and user.created webhook
- **Severity:** High  
- **Steps to reproduce:** PATCH `/api/admin/users/:id/role` as admin, or trigger Clerk `user.created` webhook.  
- **Root cause:** In `@clerk/nextjs` v6, `clerkClient` is `() => Promise<ClerkClient>`; code calls `clerkClient.users…` without `await clerkClient()`.  
- **Evidence:** `app/api/admin/users/[id]/role/route.js` ~22; `app/api/webhook/clerk/route.js` ~55. Contrast: `lib/auth-utils.ts` and `app/api/users/route.js` use a proper client.  
- **Proposed fix:** `const client = await clerkClient(); await client.users.updateUser(...)`.

### BUG-008 — Concurrent confirm can double-debit bank solde
- **Severity:** High  
- **Steps to reproduce:** Fire two parallel POSTs to `/api/reglements/:id/confirm` with `status=confirme` on the same pending règlement.  
- **Root cause:** Status is read outside the transaction; both requests can see `en_attente` and both decrement solde.  
- **Evidence:** `app/api/reglements/[id]/confirm/route.ts` ~48–59 then Cas 1 ~99–109.  
- **Proposed fix:** Conditional update inside transaction (`updateMany` where status ≠ confirme), or row lock.

### BUG-009 — Deleting a fournisseur cascades financial history without reversing soldes
- **Severity:** High  
- **Steps to reproduce:** Create confirmed payments for a supplier → DELETE `/api/fournisseurs/:id` as admin.  
- **Root cause:** Prisma `onDelete: Cascade` removes reglements/transactions; handler does not reverse `comptesBancaires.solde`.  
- **Evidence:** `app/api/fournisseurs/[id]/route.js` DELETE.  
- **Proposed fix:** Reverse confirmed payment soldes before delete, or block delete while open financial history exists.

### BUG-010 — Devis DELETE removes payment transactions without reversing solde/versements
- **Severity:** High  
- **Steps to reproduce:** Pay a devis → DELETE `/api/devis/:id` as admin.  
- **Root cause:** Deletes devis then `transactions.deleteMany` by reference; no bank/versement reversal.  
- **Evidence:** `app/api/devis/[id]/route.js` ~24–33.  
- **Proposed fix:** Reverse each related payment’s solde/versement effects before deleting transactions.

### BUG-011 — Trésorerie DELETE “paiement fournisseur” reverses wrong BLs and skips dette
- **Severity:** High  
- **Steps to reproduce:** Confirm a cheque règlement (transaction `reference = reglement.id`) → delete that transaction via trésorerie API.  
- **Root cause:** Helper filters BLs with `fournisseurId: reference`, but confirm stores règlement id in `reference`. Dette restore is commented out.  
- **Evidence:** `app/api/tresorie/route.js` ~334–388; confirm creates `reference: reglementExistant.id`.  
- **Proposed fix:** Resolve via `ReglementId` / reglement lookup; restore dette; prefer allocation-based reversal.

### BUG-012 — Post-login redirect lands on shell-less `/dashboard`
- **Severity:** High  
- **Steps to reproduce:** Sign in via `/sign-in` → redirected to `/dashboard`, which has no Navbar/Sidebar (real shell is `/`).  
- **Root cause:** Middleware redirects authenticated users from sign-in/up to `/dashboard`.  
- **Evidence:** `middleware.ts` ~116–124; `app/dashboard/page.jsx` lacks shell; Sidebar Dashboard `href: "/"`.  
- **Proposed fix:** Redirect to `/`, or wrap `/dashboard` with the shared shell and align navigation.

### BUG-013 — Home `/` mounts `<SignIn/>` with invalid routing + unauthenticated stats fetch
- **Severity:** High  
- **Steps to reproduce:** Open `/` while signed out; open DevTools.  
- **Observed (Playwright + browser):**
  - Clerk page error: `<SignIn/>` not configured for non-catch-all `/` (suggests `routing="hash"` or catch-all).
  - `GET /api/statistiques?...` → **401** because `useQuery` has no `enabled: isSignedIn` and runs before the signed-out early return.
- **Evidence:** `app/page.jsx` ~136–149, ~196; `qa-artifacts/smoke-results.json`.  
- **Proposed fix:** Add `routing="hash"` (or link to `/sign-in`); set `enabled: !!isSignedIn` on dashboard queries.

---

## Medium

### BUG-014 — Collection DELETE `/api/devis` deletes `articls`, not devis
- **Severity:** Medium  
- **Steps to reproduce:** `DELETE /api/devis` with body `{ ids: [...] }`.  
- **Root cause:** Copy-paste: `prisma.articls.deleteMany`.  
- **Evidence:** `app/api/devis/route.js` ~463–483.  
- **Proposed fix:** Delete devis by ids, or remove the dead endpoint (UI uses `/api/devis/:id`).

### BUG-015 — Print race: `window.open` before `localStorage.setItem`
- **Severity:** Medium  
- **Steps to reproduce:** Click Imprimer on BL/devis/commandes/clients rapport → new tab often blank/stale.  
- **Root cause:** Tab opens before storage write is visible to the new document.  
- **Evidence:** `components/devis-actions.jsx`, `app/(pages)/achats/bonLivraison/columns.tsx`, `components/preview-bonLivraison.jsx`, `components/clients-rapport-dialog.jsx`, etc. (`PrintButton` already does set-then-open correctly.)  
- **Proposed fix:** Always `setItem` then `open`; prefer URL id + server fetch.

### BUG-016 — Print/historique pages infinite loader + unsafe `JSON.parse`
- **Severity:** Medium  
- **Steps to reproduce:** Open `/ventes/devis/{id}/historiquePaiements` in a fresh tab without prior print click.  
- **Root cause:** `JSON.parse(devisDetails)` before null check; missing empty state.  
- **Evidence:** `app/(pages)/ventes/devis/[id]/historiquePaiements/page.jsx` ~35–46.  
- **Proposed fix:** Guard parses in try/catch; show “Aucune donnée à imprimer”.

### BUG-017 — Sidebar Débitage links to non-existent routes
- **Severity:** Medium (High UX impact; runtime 404 confirmed)  
- **Steps to reproduce:** Expand Débitage → Marbre/Verre → **404**.  
- **Evidence:** `components/sidebar.jsx` ~91–102; Playwright/browser confirmed `/debitage/marbre` 404.  
- **Proposed fix:** Remove menu items until pages exist, or implement routes.

### BUG-018 — Admin hub links to many dead routes
- **Severity:** Medium  
- **Steps to reproduce:** Open `/admin` → click Paramètres généraux / Sauvegarde / Journaux / etc. → 404.  
- **Evidence:** Only `app/admin/page.tsx` and `app/admin/users/*` exist.  
- **Proposed fix:** Disable/remove unimplemented cards; keep working links only.

### BUG-019 — Admin-only pages lack page-level role guards
- **Severity:** Medium  
- **Steps to reproduce:** As non-admin, navigate directly to `/parametres/users-management`, `/parametres/categories`, `/Employes`, etc.  
- **Root cause:** Sidebar filters by role; pages only require authentication in middleware.  
- **Proposed fix:** Server-side `requireAdmin()` / redirect to `/no-access` on each admin page.

### BUG-020 — Invalid Tailwind class `justify between`
- **Severity:** Medium  
- **Steps to reproduce:** Open Paramètres pages, Transactions, Règlement, Factures Achats → flex rows do not space as intended.  
- **Evidence:** Typo in 10 files under `app/(pages)/parametres/*`, `transactions/page.tsx`, `reglement/page.tsx`, `facturesAchats/page.tsx`.  
- **Proposed fix:** Replace with `justify-between`.

### BUG-021 — Unauthenticated `/test` page is publicly accessible
- **Severity:** Medium  
- **Steps to reproduce:** Visit `/test` while signed out → “Test page” renders (200).  
- **Evidence:** Browser + Playwright smoke.  
- **Proposed fix:** Remove page, or add to middleware matcher + protect.

---

## Low

### BUG-022 — Factures Achats “Imprimer” is a stub
- **Severity:** Low  
- **Steps to reproduce:** `/facturesAchats` → Imprimer → toast “Fonctionnalité d'impression à venir”.  
- **Proposed fix:** Hide/disable until implemented.

### BUG-023 — Transaction dialog closes before mutation completes
- **Severity:** Low  
- **Steps to reproduce:** Create transaction → dialog closes immediately; failures still look done.  
- **Evidence:** `components/new-transaction.jsx` closes/resets right after `mutate`.  
- **Proposed fix:** Close in `onSuccess` only.

### BUG-024 — Sidebar expand is hover-only (touch/mobile fragile)
- **Severity:** Low  
- **Steps to reproduce:** Narrow viewport; labels stay collapsed (`w-16`); submenus hard without hover.  
- **Proposed fix:** Explicit expand toggle + drawer on small screens.

---

## Auth / security regression check (latest middleware)

These previously open issues appear **fixed** on this branch and were re-verified:

- Unauthenticated `/api/*` (non-webhook/auth) → **401**
- Unauthenticated `/reglement`, `/versements`, `/facturesAchats`, `/fournisseurs`, `/clients`, `/dashboard` → redirect to `/sign-in`
- `PUT /api/solde-comptes` unauthenticated → **401**
- Confirm route requires `requireAuth()`

Remaining auth gap (Medium): middleware admin gate is claim-optional; many money mutations remain available to any authenticated role (commerçant can POST BL/paiements/versements/confirm). Prefer handler-level `requireAdmin`/`requireRole` for sensitive money ops.

---

## Playwright smoke results

Command: `node scripts/qa-smoke.mjs`  
Artifacts: `qa-artifacts/smoke-results.json`, screenshots.

Confirmed at runtime:

- All probed APIs return 401 without session
- Protected pages redirect to `/sign-in`
- `/test` public, `/debitage/marbre` 404
- Home `/` Clerk SignIn configuration error + statistiques 401 noise
- Sign-in mobile layout OK (no horizontal overflow)

---

## Recommended fix order

1. **BUG-001 / BUG-002 / BUG-003 / BUG-004 / BUG-005 / BUG-006 / BUG-011** — accounting integrity  
2. **BUG-007 / BUG-008** — Clerk role updates + race on confirm  
3. **BUG-012 / BUG-013** — login UX and console noise  
4. **BUG-017 / BUG-018 / BUG-020 / BUG-021** — navigation and layout polish  
5. Remaining Medium/Low items  

---

## Follow-up needed for full QA coverage

Provide Clerk **test** user credentials (admin + commercant) as secrets, e.g.:

- `TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD`
- `TEST_COMMERCANT_EMAIL` / `TEST_COMMERCANT_PASSWORD`

Then re-run authenticated CRUD, search/filter/pagination, empty states, and responsive checks on all sidebar pages.
