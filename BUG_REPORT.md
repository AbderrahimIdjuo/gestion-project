# Bug Report — gestion-project

**Date:** 2026-08-07  
**Branch under test:** `cursor/application-bug-exploration-91ed` (based on `master` @ `ad7a0c4`)  
**Environment:** local Next.js `npm run dev` on `http://localhost:3000`  
**Database:** testing database only (`DATABASE_URL` labeled `#test db` in `.env`; production Neon URL left commented). No environment variables were modified. No production data was deleted.  
**Methods:** dependency install, static code review of pages/APIs, curl probes, Playwright smoke script (`scripts/qa-smoke.mjs`), browser exploration of unauthenticated flows.  
**Auth limitation:** Clerk sign-in is Google OAuth / hosted UI; no test credentials were available, so authenticated create/edit/delete UI paths were validated via API/code review rather than signed-in browser sessions.

**Playwright smoke summary:** 13 checks → **3 passed / 10 failed** (failures map to confirmed bugs below).

---

## Critical

### BUG-001 — Most API routes accept unauthenticated requests

- **Severity:** Critical
- **Steps to reproduce:**
  1. With no Clerk session, call `GET /api/clients`, `GET /api/comptesBancaires`, `GET /api/fournisseurs/infinitPagination`.
  2. Observe `200` responses with real business data.
  3. Call `PUT /api/solde-comptes`, `POST /api/fournisseurs/paiement`, `POST /api/reglements/:id/confirm`, `DELETE /api/fournisseurs/:id` without auth.
  4. Observe business errors (`400`/`404`/`500`) instead of `401`/`403`.
- **Root cause:** `middleware.ts` matches `/api/(.*)` but only enforces redirects for page prefixes. ~67 of ~76 API route files never call `auth()` / `requireAdmin()`.
- **Proposed fix:** Require authentication for all `/api/*` except webhooks; require admin (or role checks) for mutations affecting money, stock, users, and imports.

### BUG-002 — Financial pages render without login

- **Severity:** Critical
- **Steps to reproduce:**
  1. Open an incognito window.
  2. Visit `/reglement`, `/versements`, `/facturesAchats`, `/fournisseurs/imprimer-rapport`.
  3. Pages return `200` and show live financial UI/data (payments, balances, invoices).
  4. Compare with `/clients`, which correctly redirects to `/sign-in`.
- **Root cause:** Those paths are absent from both `protectedPrefixes` and `config.matcher` in `middleware.ts` (lines 16–28, 48–78).
- **Proposed fix:** Add `/reglement`, `/versements`, `/facturesAchats`, and `/fournisseurs` to matcher + protected prefixes; also protect their APIs.

### BUG-003 — Anyone can overwrite bank account balances

- **Severity:** Critical
- **Steps to reproduce:**
  1. `PUT /api/solde-comptes` with `{ "id": "<compteId>", "solde": 0 }` and no auth cookie.
  2. Endpoint attempts `comptesBancaires.update` directly (invalid id → `500`, valid id would overwrite).
- **Root cause:** `app/api/solde-comptes/route.js` has no auth and blindly sets `solde`.
- **Proposed fix:** Call `requireAdmin()`; prefer incremental adjustments tied to transactions; audit log changes.

### BUG-004 — Fully paid BL still increases fournisseur dette

- **Severity:** Critical
- **Steps to reproduce:**
  1. Create an achats BL with `statutPaiement: "paye"` without sending `montantPaye` (common UI path).
  2. Bank solde is decremented by `total`, but dette is also incremented by `total`.
- **Root cause:** In `app/api/bonLivraison/route.js` (~L74–79, L167):
  - Paid amount for the BL uses `statutPaiement === "paye" ? total : montantPaye`.
  - Dette uses `montantPaye ? total - montantPaye : total`, so a falsy `montantPaye` treats the BL as fully unpaid.
- **Proposed fix:** Derive unpaid as `total - paid`, where `paid = statutPaiement === "paye" ? total : (parseFloat(montantPaye) || 0)`.

### BUG-005 — Deleting a BL adjusts dette by full total (ignores payments)

- **Severity:** Critical
- **Steps to reproduce:**
  1. Create unpaid achats BL for 1000 → dette +1000.
  2. Pay 400 → dette −400.
  3. Delete BL → dette −1000.
  4. Net dette is −400 vs expected 0; allocations cascade away while règlements may remain.
- **Root cause:** `app/api/bonLivraison/[id]/route.js` (~L118–130) always `decrement: bonLivraison.total`. Does not reverse creation-time bank/transaction side effects for paid amounts.
- **Proposed fix:** Use unpaid remainder `total - (totalPaye ?? 0)` for achats; reverse linked payments/soldes inside the same DB transaction.

### BUG-006 — Cancelling a prélèvement does not restore fournisseur dette

- **Severity:** Critical
- **Steps to reproduce:**
  1. Create a fournisseur paiement (dette decremented at create).
  2. Set `statusPrelevement` to `annule`.
  3. BL `totalPaye` is reversed; fournisseur `dette` is not incremented back.
- **Root cause:** Cas 3 in `app/api/reglement/route.js` (~L412–468) and confirm route cancel path reverse BL allocations only; no `fournisseurs.update({ dette: { increment } })`.
- **Proposed fix:** On transition into `annule`, restore dette by reglement montant; mirror the DELETE path that already restores dette.

### BUG-007 — Deleting an unconfirmed cheque/traite credits the bank incorrectly

- **Severity:** Critical
- **Steps to reproduce:**
  1. Create a cheque reglement with `statusPrelevement: en_attente` (solde not touched at create).
  2. `DELETE` the reglement.
  3. Account `solde` is incremented by the montant that was never reserved.
- **Root cause:** `app/api/reglement/route.js` (~L1060–1066) always increments solde on delete; creation only debits for espece/versement, and cheque debit happens on confirm.
- **Proposed fix:** Restore solde only when `statusPrelevement === "confirme"` (or when a debiting transaction exists).

### BUG-008 — Secrets committed in tracked `.env` / `.env.local`

- **Severity:** Critical
- **Steps to reproduce:**
  1. `git ls-files .env .env.local` shows both files tracked.
  2. `.gitignore` lists `.env`, but tracked files remain in the repository history.
- **Root cause:** Env files were committed before ignore rules (or force-added). They contain database URLs, Clerk keys, and blob tokens.
- **Proposed fix:** Remove from the index (`git rm --cached`), ensure `.env*` ignore coverage, rotate all exposed credentials, scrub git history if the repo is/was public.

---

## High

### BUG-009 — Editing a pending reglement moves bank money that was never reserved

- **Severity:** High
- **Steps to reproduce:**
  1. Create cheque reglement `en_attente`.
  2. PUT new montant and/or compte.
  3. Old compte is credited and new compte debited even though create never deducted.
- **Root cause:** `app/api/reglement/route.js` (~L837–858) syncs solde on montant/compte change without gating on `confirme` (transaction sync is gated; solde sync is not).
- **Proposed fix:** Apply solde reverse/reapply only when `statusPrelevement === "confirme"`.

### BUG-010 — Single-BL cheque payment skips dette update

- **Severity:** High
- **Steps to reproduce:**
  1. Pay a BL via `POST /api/bonLivraison/paiementBlUnique` with cheque/traite.
  2. `totalPaye`/allocation update; `fournisseurs.dette` is only decremented inside the espece/versement branch (~L92–131).
- **Root cause:** Dette update nested under cash methods; bulk `fournisseurs/paiement` always decrements dette.
- **Proposed fix:** Apply dette updates consistently with the chosen confirmation model (always on create, or only on confirm — but same rule everywhere). Cap `totalPaye` at BL total server-side.

### BUG-011 — Supplier payment can reduce dette more than allocated BLs

- **Severity:** High
- **Steps to reproduce:**
  1. Pay a montant larger than sum of unpaid achats BLs via `/api/fournisseurs/paiement`.
  2. Dette decrements by full montant; leftover allocation remainder is silently ignored.
- **Root cause:** Dette updated before allocation loop; no rejection when remaining amount > epsilon (unlike `lib/reglement-montant-bl-sync.js`).
- **Proposed fix:** Reject overpayment or only decrement dette by allocated amount.

### BUG-012 — Deleting a fournisseur orphans bank money via cascades

- **Severity:** High
- **Steps to reproduce:**
  1. Create confirmed payments (solde already decremented).
  2. Unauthenticated `DELETE /api/fournisseurs/:id`.
  3. Prisma cascades remove reglements/transactions without reversing soldes.
- **Root cause:** `app/api/fournisseurs/[id]/route.js` raw delete + schema cascades; no compensating accounting.
- **Proposed fix:** Soft-delete or pre-delete reverse of confirmed payments; require admin.

### BUG-013 — Prélèvement confirm endpoint: no auth + double-confirm race

- **Severity:** High
- **Steps to reproduce:**
  1. `POST /api/reglements/:id/confirm` with `{ "status": "confirme" }` without auth (returns domain errors, not 401).
  2. Fire two concurrent confirms on the same pending reglement.
  3. Both can pass the status check and both decrement solde / create transactions.
- **Root cause:** `app/api/reglements/[id]/confirm/route.ts` lacks `requireAdmin()` and uses non-atomic read-then-update.
- **Proposed fix:** Auth + conditional `updateMany` where status ≠ confirme (or unique side-effect guard).

### BUG-014 — Clerk admin role / webhook uses broken `clerkClient.users` shape

- **Severity:** High
- **Steps to reproduce:**
  1. As admin, PATCH `/api/admin/users/:id/role`.
  2. Or receive Clerk `user.created` webhook.
  3. Calls `clerkClient.users.updateUser(...)` fail because `@clerk/nextjs` v6 exports `clerkClient` as an async factory.
- **Root cause:** `app/api/admin/users/[id]/role/route.js:22` and `app/api/webhook/clerk/route.js:55` misuse the API; `lib/auth-utils.ts` correctly does `const client = await clerkClient()`.
- **Proposed fix:** `const client = await clerkClient(); await client.users.updateUser(...)`.

### BUG-015 — Print flows open a tab before writing `localStorage`

- **Severity:** High
- **Steps to reproduce:**
  1. From devis actions / BL columns / several rapport dialogs, click print.
  2. New tab often mounts before `localStorage.setItem` completes → blank/crash.
- **Root cause:** `window.open(...)` precedes `localStorage.setItem(...)` in e.g. `components/devis-actions.jsx` (~93–109), `app/(pages)/achats/bonLivraison/columns.tsx` (~272–276), `components/preview-bonLivraison.jsx`, `components/clients-rapport-dialog.jsx`.
- **Proposed fix:** Always `setItem` first, then `open`; prefer URL query / server fetch by id.

### BUG-016 — Print pages call `JSON.parse` on null / missing storage

- **Severity:** High
- **Steps to reproduce:**
  1. Open print/historique URLs without prior print action (or hit BUG-015 race).
  2. Console throws on `JSON.parse(null)` / invalid JSON.
- **Root cause:**
  - `historiquePaiements/page.jsx` parses before null checks (~L37, L43).
  - `factures/imprimer/page.jsx` logs `JSON.parse(storedData)` outside the `if` (~L106).
  - Similar patterns on devis PDF / commandes imprimer pages.
- **Proposed fix:** Guard null, wrap parse in try/catch, show empty-state/redirect when missing.

### BUG-017 — Post-login lands on nav-less `/dashboard`

- **Severity:** High
- **Steps to reproduce:**
  1. Sign in → middleware redirects to `/dashboard`.
  2. Page has no sidebar/navbar; main app shell lives on `/`.
- **Root cause:** `middleware.ts` (~L37–38) redirects to `/dashboard`; `app/dashboard/page.jsx` lacks shell used by `app/page.jsx`.
- **Proposed fix:** Redirect authenticated users to `/`, or reuse the same layout on `/dashboard`.

### BUG-018 — Sidebar “Débitage” links 404

- **Severity:** High
- **Steps to reproduce:** Expand Débitage → Marbre / Verre → `404 Page introuvable`.
- **Root cause:** `components/sidebar.jsx` links to `/debitage/marbre` and `/debitage/verre`; no pages exist (Playwright confirmed 404).
- **Proposed fix:** Remove menu entries or implement pages.

### BUG-019 — Admin hub is mostly dead links

- **Severity:** High
- **Steps to reproduce:** Open `/admin` and click Paramètres / Sauvegarde / Journaux / etc.
- **Root cause:** `app/admin/page.tsx` links to many `/admin/*` routes; only `/admin` and `/admin/users` exist.
- **Proposed fix:** Remove/disable unimplemented cards; keep working entries only.

### BUG-020 — Invalid Tailwind class `justify between` breaks layouts

- **Severity:** High
- **Steps to reproduce:** Open Paramètres pages, Règlement, Transactions, Factures Achats on desktop; settings rail + content stack instead of side-by-side.
- **Root cause:** Typo `justify between` instead of `justify-between` in 10 files (e.g. `parametres/*/page.tsx`, `reglement/page.tsx:1524`, `transactions/page.tsx:964`, `facturesAchats/page.tsx:269`).
- **Proposed fix:** Global replace with `justify-between`.

### BUG-021 — Nouveau devis: Zod `.parse` in button `onClick` aborts submit UX

- **Severity:** High
- **Steps to reproduce:** Submit incomplete nouveau devis; ZodError hits console; RHF error UI often never runs cleanly.
- **Root cause:** `app/(pages)/ventes/devis/nouveau/page.jsx` (~764–781) calls `newDeviSchema.parse(watch())` in `onClick`.
- **Proposed fix:** Remove parse from `onClick`; rely on `handleSubmit` / `safeParse`.

---

## Medium

### BUG-022 — Devis line qty/price optional → NaN totals

- **Severity:** Medium
- **Steps to reproduce:** Add article, clear quantité/prix, save.
- **Root cause:** Schema marks fields optional; UI multiplies possibly undefined values (`nouveau/page.jsx`, `newDeviSchema`).
- **Proposed fix:** Require positive numbers; block submit when lines incomplete.

### BUG-023 — Produits filters reset + dead `statut` filter

- **Severity:** Medium
- **Steps to reproduce:** Adjust prix/stock sliders; after refetch, range snaps back. `statut` is sent but ignored by API.
- **Root cause:** `produits/page.jsx` overwrites slider state from API max/min; GET `api/produits` never reads `statut`.
- **Proposed fix:** Initialize bounds once; implement or remove `statut`.

### BUG-024 — Empty states missing `<TableRow>` (invalid table DOM)

- **Severity:** Medium
- **Steps to reproduce:** Search with no results on Clients / Fournisseurs.
- **Root cause:** Bare `<TableCell colSpan=…>` under `<TableBody>` in `clients/page.jsx:261`, `achats/fournisseurs/page.jsx:422`.
- **Proposed fix:** Wrap in `<TableRow>`.

### BUG-025 — Commercant “Nouveau …” query params ignored

- **Severity:** Medium
- **Steps to reproduce:** From `/commercant`, click “Nouveau client/produit” (`?action=new`); create dialog does not open.
- **Root cause:** Links set `action=new`; no page reads it.
- **Proposed fix:** On mount, open create dialog when `action=new`.

### BUG-026 — Dead `/tresorie/rapport` from commercant

- **Severity:** Medium
- **Steps to reproduce:** `/commercant` → “Rapport trésorerie” → missing page.
- **Root cause:** Link to `/tresorie/rapport` with only API routes under `app/api/tresorie/*`.
- **Proposed fix:** Link to an existing report UI or add the page.

### BUG-027 — New règlement: weak/no client-side validation

- **Severity:** Medium
- **Steps to reproduce:** Open new règlement, leave montant empty/negative / omit fournisseur, confirm.
- **Root cause:** `new-reglement.jsx` `useForm()` without resolver.
- **Proposed fix:** Zod schema: montant `> 0`, required fournisseur/compte/méthode/dates.

### BUG-028 — Sidebar hover-only expand hurts mobile/touch

- **Severity:** Medium
- **Steps to reproduce:** Narrow viewport; labels/submenus rely on `onMouseEnter`.
- **Root cause:** `components/sidebar.jsx` hover expand pattern.
- **Proposed fix:** Explicit toggle/drawer for small screens.

### BUG-029 — Role gates are UI-only for several admin areas

- **Severity:** Medium
- **Steps to reproduce:** As `commercant`, visit `/Employes` or `/parametres/users-management` directly.
- **Root cause:** Sidebar filters by role; pages/middleware only check signed-in, not role.
- **Proposed fix:** Server-side `requireAdmin()` (or equivalent) on those pages/layouts/APIs.

### BUG-030 — Stock sortie can go negative; stock POST unauthenticated

- **Severity:** Medium
- **Steps to reproduce:** Create STOCK(sortie) BL with qty > stock; or anonymous `POST /api/produits/stock`.
- **Root cause:** Decrement without floor check; stock route lacks auth and uses non-atomic read-modify-write.
- **Proposed fix:** Auth; reject negative stock; use atomic `increment`/`decrement`.

### BUG-031 — Deleting a devis can leave bank balances inconsistent

- **Severity:** Medium
- **Steps to reproduce:** Pay devis (solde affected) → admin DELETE devis.
- **Root cause:** `app/api/devis/[id]/route.js` deletes devis then related transactions without reversing compte/versement side effects in one transaction.
- **Proposed fix:** Reuse tresorie reverse helpers inside a single `$transaction`.

### BUG-032 — Clerk `<SignIn/>` misconfiguration warning on landing

- **Severity:** Medium
- **Steps to reproduce:** Open `/` and inspect console.
- **Root cause:** Browser console: Clerk SignIn component routing not configured correctly for the embedded usage on the landing page.
- **Proposed fix:** Align Clerk routing (`signInUrl` / `routing` / catch-all) with the landing embed pattern, or link out to `/sign-in` only.

---

## Low

### BUG-033 — Factures Achats “Imprimer” stubbed out

- **Severity:** Low
- **Steps to reproduce:** Click Imprimer on factures achats → toast “à venir”.
- **Root cause:** `facturesAchats/page.tsx` comments out `window.open`.
- **Proposed fix:** Wire print route or hide the button until ready.

### BUG-034 — Product form allows negative stock

- **Severity:** Low
- **Steps to reproduce:** Create product with stock `-5`.
- **Root cause:** `product-form-dialog.jsx` `z.number()` without `.min(0)`.
- **Proposed fix:** `.min(0)` for stock (and non-negative prix).

### BUG-035 — Typo in solde-comptes payload variable (`resopns`)

- **Severity:** Low
- **Steps to reproduce:** Code review of `app/api/solde-comptes/route.js`.
- **Root cause:** `const resopns = await req.json();` — readability/maintainability smell next to missing auth.
- **Proposed fix:** Rename to `response`/`body` when securing the route.

### BUG-036 — Node engine mismatch warning

- **Severity:** Low
- **Steps to reproduce:** `npm install` on Node 22 → `EBADENGINE` (package requires `20.x`).
- **Root cause:** `package.json` `engines.node` is `20.x`.
- **Proposed fix:** Document supported Node version / align CI and local runtimes.

### BUG-037 — Fournisseurs import button commented out (recent change)

- **Severity:** Low / intentional?
- **Steps to reproduce:** Open suppliers page; import control is commented out (commit `ad7a0c4`).
- **Root cause:** UI feature disabled in source without alternate import path on that page.
- **Proposed fix:** Confirm product intent; restore or remove dead code paths cleanly.

---

## Playwright evidence (unauthenticated smoke)

| Check | Result |
|------|--------|
| `/clients` → sign-in | PASS |
| `/reglement` blocked | FAIL (200, exposed) |
| `/versements` blocked | FAIL (200, exposed) |
| `/facturesAchats` blocked | FAIL (200, exposed) |
| `/fournisseurs/imprimer-rapport` blocked | FAIL (200, exposed) |
| `/debitage/marbre` exists | FAIL (404) |
| Mobile `/reglement` overflow ≤450px | PASS (375) |
| `GET /api/clients` requires auth | FAIL (200) |
| `PUT /api/solde-comptes` requires auth | FAIL (500) |
| `POST .../confirm` requires auth | FAIL (404) |
| `GET /api/comptesBancaires` requires auth | FAIL (200) |
| `DELETE /api/fournisseurs/:id` requires auth | FAIL (500) |

Reproduce with:

```bash
npm run dev
# with playwright available:
node scripts/qa-smoke.mjs
```

---

## Recommended fix order

1. **Auth hard gate** for pages + APIs (BUG-001, BUG-002, BUG-003, BUG-013) and rotate leaked secrets (BUG-008).
2. **Accounting invariants** for BL create/delete, reglement cancel/delete/edit, and cheque confirm races (BUG-004–BUG-007, BUG-009–BUG-012).
3. **Clerk client correctness** for admin/webhook role assignment (BUG-014).
4. **UX correctness**: print/localStorage races, layout typo, dead nav links, dashboard redirect (BUG-015–BUG-021).
5. Medium/low validation, empty states, and mobile nav polish.

---

## Out of scope / not fully exercised

- Signed-in CRUD UI for clients/produits/devis (no test Clerk user credentials in this environment).
- Production database (intentionally unused).
- Destructive cleanup of existing test-DB business records (avoided; probes used nonexistent IDs or read-only GETs where possible).
