# BUG_REPORT — gestion-project QA

**Date:** 2026-08-18  
**Branch under test:** `cursor/application-bug-exploration-4517` (includes `4647c74` payment-status refactor)  
**Base:** `master` @ `4647c74`  
**Environment:** Next.js 14 + Clerk (test keys) + Prisma against the **Neon test DB** (`#test db` active in `.env`). Production DB URL remains commented and was **not** used.  
**Env vars:** **Not modified.**  

## Executive summary

Automated exploration focused on the payment-status refactor (`statutPaiementFromTotals`), accounting reverse paths, auth gates, and signed-out UI. **Playwright smoke: 31/31 passed.** Several prior Critical bugs are **fixed**; remaining Critical/High issues concentrate on **BL unique payment (traite / overpay)**, **dette inconsistency on transaction delete**, **fournisseur leftover montant**, and **règlement confirm race on PATCH**.

Authenticated create/edit/delete/search could not be exercised end-to-end: `TEST_ADMIN_*` / `TEST_COMMERCANT_*` secrets are not provisioned in this environment (setup action requested).

---

## Methodology

| Layer | What ran |
|-------|----------|
| Install | `npm install` (Prisma generate); Playwright Chromium for smoke |
| Server | `npm run dev` on `:3000` |
| Browser | Playwright headless + manual Computer Use exploration of home, sign-in/up, protected redirects, mobile/desktop |
| API | Unauthenticated probes → expect **401**; redirect probes for pages |
| Static | Source review of payment APIs touched by `4647c74` + known accounting hotspots |
| Smoke | `node scripts/qa-smoke.mjs` → **31/31** (`qa-artifacts/`) |

### Smoke highlights

- Public home shows brand **OUDAOUDOX** + Clerk Google Sign-In
- Unauthenticated `/clients`, `/transactions` → `/sign-in`
- `/dashboard` → `/`
- APIs `/api/{clients,bonLivraison,reglement,tresorie,fournisseurs,statistiques,devis,produits}` → **401**
- Mobile home brand visible; no unexpected page console errors on public flows

---

## Bugs found

### BUG-001 — `paiementBlUnique`: traite does not create a cheque record

- **Severity:** Critical  
- **Status:** Still open (unchanged by `4647c74`)  
- **Steps to reproduce:**  
  1. Authenticate as admin.  
  2. Open a BL → Paiement → method **Traite** with numero + dates → Confirm.  
  3. Inspect DB: `Reglement.methodePaiement = traite`, `chequeId` / `Cheques` row **missing**; `numero` null.  
- **Root cause:** Only `"cheque"` creates a cheque; fournisseur paiement correctly treats both:

```54:65:app/api/bonLivraison/paiementBlUnique/route.js
      if (methodePaiement === "cheque") {
        cheque = await prisma.cheques.create({
```

vs `app/api/fournisseurs/paiement/route.js` (`cheque || traite`).  
- **Proposed fix:** Use `methodePaiement === "cheque" || methodePaiement === "traite"` (same as fournisseur path). Align numero / transaction linking.

---

### BUG-002 — `paiementBlUnique` allows overpayment → statut forced to `paye`

- **Severity:** High  
- **Status:** **New / amplified by `4647c74`**  
- **Steps to reproduce:**  
  1. BL total `100`, `totalPaye` `80`.  
  2. POST `/api/bonLivraison/paiementBlUnique` with `montant: 50` (espèce).  
  3. Observe `totalPaye = 130`, `statutPaiement = paye`; espèce also decrements fournisseur `dette` by 50.  
- **Root cause:** Server adds raw montant then uses helper that treats any `paye + EPS >= total` as `paye`. Client no longer caps amount; no `resteAPayer` guard.

```42:48:app/api/bonLivraison/paiementBlUnique/route.js
      const nouveauTotalPaye = (bl.totalPaye ?? 0) + montantNum;
      await prisma.bonLivraison.update({
        // ...
          statutPaiement: statutPaiementFromTotals(nouveauTotalPaye, bl.total),
```

```10:16:lib/statut-paiement.js
  if (paye <= STATUT_PAIEMENT_EPS) return "impaye";
  if (paye + STATUT_PAIEMENT_EPS < tot) return "enPartie";
  return "paye";
```

- **Proposed fix:** Cap with `resteAPayer(bl.total, bl.totalPaye)`; reject overpay with **400** (mirror `ReglementMontantInvalideError`). Keep client validation as defense in depth.

---

### BUG-003 — Deleting trésorerie “paiement de :BL” does not restore dette / orphans règlement

- **Severity:** Critical  
- **Status:** Still open  
- **Steps to reproduce:**  
  1. Pay a BL via `paiementBlUnique` (espèce) → bank −montant, dette −montant, BL `totalPaye` up.  
  2. Delete that transaction in Trésorerie.  
  3. Bank solde restored; BL `totalPaye` reduced; **fournisseur `dette` not increased**; `Reglement` + `ReglementBlAllocation` remain.  
- **Root cause:** Label matches `paiement de :BL` branch (BL reverse only). Full reverse (`reversePaiementFournisseur`, dette + delete règlement) only runs for `lable === "paiement fournisseur"`.

```348:369:app/api/tresorie/route.js
  if (lable.includes("paiement de :BL")) {
    // totalPaye decrement + statut only — no dette, no reglement cleanup
  }
```

```456:459:app/api/tresorie/route.js
  if (lable === "paiement fournisseur") {
    await reversePaiementFournisseur(tx, transaction);
  }
```

Espèce create path **did** decrement dette (`paiementBlUnique` ~141–146).  
- **Proposed fix:** When `ReglementId` is set (or label is BL unique payment), call `reversePaiementFournisseur` (or equivalent) so dette, allocations, and règlement stay consistent.

---

### BUG-004 — POST fournisseur paiement: leftover amount ignored while full dette decremented

- **Severity:** High  
- **Status:** Still open  
- **Steps to reproduce:**  
  1. Fournisseur with one unpaid BL of `100`.  
  2. Pay `150` espèce via `/api/fournisseurs/paiement`.  
  3. Règlement = 150; BL allocated 100; leftover 50 dropped; dette −150; bank −150.  
- **Root cause:** Allocation loop leaves unused `montantRestant` with **no validation**; solde/dette use full `montant`. Contrast: `applyReglementMontantChangeToBonLivraisons` throws `ReglementMontantInvalideError` when leftover > 0.  
- **Proposed fix:** After allocation, if `Math.round(montantRestant * 100) / 100 > 0`, throw and abort transaction; or only debit allocated amount.

---

### BUG-005 — PATCH `/api/reglement` confirm path still races

- **Severity:** High  
- **Status:** Still open on PATCH; dedicated confirm route is fixed  
- **Steps to reproduce:**  
  1. Create chèque règlement `en_attente`.  
  2. Fire two parallel `PATCH /api/reglement` with `statusPrelevement: "confirme"`.  
  3. Observe double solde/dette decrement and duplicate transactions.  
- **Root cause:** PATCH Cas 1 reads status then applies effects **without** row lock/claim. Fixed path: `app/api/reglements/[id]/confirm/route.ts` uses `FOR UPDATE` + atomic claim.  
- **Proposed fix:** Reuse confirm-route locking in PATCH, or remove confirm capability from PATCH and force clients through `/confirm`.

---

### BUG-006 — Trésorerie edit of en_attente règlement skips BL reallocation

- **Severity:** High  
- **Status:** Open inconsistency (confirm-gating over-corrected)  
- **Steps to reproduce:**  
  1. Create chèque règlement linked to BL (`totalPaye` updated at create, `statusPrelevement=en_attente`).  
  2. Edit montant via trésorerie PUT.  
  3. Règlement montant changes; BL allocations do **not**. Same edit via PUT `/api/reglement` reallocates BLs.  
- **Root cause:** `syncLinkedReglementOnTransactionEdit` gates **both** solde/dette **and** BL sync on `isConfirmed` (`app/api/tresorie/update/route.js` ~129–195). Chèque/traite already touched BL at creation.  
- **Proposed fix:** Always sync BL allocations on montant change; keep solde/dette gated on `confirme`.

---

### BUG-007 — Incomplete EPS / `statutPaiementFromTotals` migration on cancel & delete

- **Severity:** Medium  
- **Status:** **New** (incomplete `4647c74` migration)  
- **Steps to reproduce:** Reverse/cancel a payment leaving `totalPaye` within `0.01` of `total` via PATCH annule / DELETE reglement → statut can stay `enPartie` while pay paths would mark `paye`.  
- **Root cause:** Cas 3 / DELETE still use raw `>` / `<` / `>=` (e.g. `app/api/reglement/route.js` ~435–450, ~1135–1181; confirm cancel ~256–292).  
- **Proposed fix:** Replace all statut writes with `statutPaiementFromTotals`.

---

### BUG-008 — Fournisseur DELETE can cascade règlements without reversing bank solde

- **Severity:** High  
- **Status:** Still open (mitigated when BLs exist)  
- **Steps to reproduce:**  
  1. Fournisseur with confirmed règlements but **no** BLs.  
  2. `DELETE /api/fournisseurs/:id`.  
  3. Règlements/transactions cascade away; `comptesBancaires.solde` not incremented back.  
- **Root cause:** Delete only blocks when BL count > 0 (`app/api/fournisseurs/[id]/route.js` ~39–55); Prisma cascade drops règlements without reverse.  
- **Proposed fix:** Refuse delete if any règlements/transactions exist, or reverse confirmed payment side-effects before delete.

---

### BUG-009 — Middleware soft-allows admin routes when JWT role is null

- **Severity:** Medium  
- **Status:** Still open (by design + defense in depth)  
- **Steps to reproduce:** Authenticated user whose session token lacks `publicMetadata.role` → middleware does not 403 admin mutations / redirect admin pages.  
- **Root cause:** Explicit soft-allow when `role === null` (`middleware.ts` ~105–116, ~162–168). Handlers/layouts still call `requireAdmin()` / `requireAdminPage()`.  
- **Proposed fix:** Fail closed on admin paths when claim missing once Clerk JWT template is mandatory; keep handler checks.

---

### BUG-010 — BL create “already paid” delete understates dette

- **Severity:** High  
- **Status:** Still open (same family as BUG-003)  
- **Steps to reproduce:**  
  1. Create achats BL as `paye` (montant = total → dette +0, bank −total) via POST `/api/bonLivraison`.  
  2. Delete that transaction.  
  3. Bank restored, BL unpaid; dette still 0 (should increase by unpaid amount).  
- **Root cause:** Create increments dette only for unpaid remainder; delete BL-label path never adjusts dette (`handleSpecialLabels`).  
- **Proposed fix:** On reverse of BL-create payment, `dette += montant` (or recompute from unpaid BLs).

---

### BUG-011 — `newDeviSchema` allows missing quantite / prixUnite

- **Severity:** Medium  
- **Status:** Still open  
- **Steps to reproduce:** Nouveau devis → add article line with empty qty/price → Enregistrer can succeed (UI totals show 0).  
- **Root cause:** Both fields are `.optional()` after preprocess (`app/zodSchemas/newDeviSchema.jsx` ~25–58); same pattern in `updateDeviSchema.jsx`.  
- **Proposed fix:** Require positive numbers after preprocess; reject empty/`undefined`.

---

### BUG-012 — PaiementBLDialog Confirm stuck after API error

- **Severity:** High  
- **Status:** Still open  
- **Steps to reproduce:** Open BL payment → valid amount → API fails → button stays “En cours...” / disabled.  
- **Root cause:** `setLoading(false)` only inside success path of `toast.promise` (`components/paiement-BL.jsx` ~43–97).  
- **Proposed fix:** `try/finally { setLoading(false) }` (or `.finally` on the promise).

---

### BUG-013 — Devis PaiementDialog: loading stuck + weak montant validation

- **Severity:** High  
- **Status:** Open  
- **Steps to reproduce:**  
  1. Montant > reste → toast error, Confirm stays disabled (`setLoading(true)` then early `return` without clear).  
  2. Empty/NaN montant can be submitted.  
  3. Mutation error never clears loading (`onSuccess` only).  
- **Root cause:** `components/paiement-dialog.jsx` ~110–138.  
- **Proposed fix:** Mirror BL: `Number.isFinite` + `finally` / `onError` to clear loading; block NaN.

---

### BUG-014 — PaiementFournisseur closes immediately / no montant validation

- **Severity:** High  
- **Status:** Still open  
- **Steps to reproduce:** Submit empty/invalid montant or failing API → dialog closes/resets immediately; NaN can be posted.  
- **Root cause:**

```107:112:components/paiement-fournisseur.jsx
  const onSubmit = async data => {
    paiementFournisseur.mutate(data);
    onClose();
    reset();
  };
```

- **Proposed fix:** Validate montant; `onClose`/`reset` only in `onSuccess`; disable submit while pending.

---

### BUG-015 — Print designation labels differ (vider / transfert)

- **Severity:** Low  
- **Status:** Still open  
- **Steps to reproduce:** Print chronological transactions vs compte rapport for same vider/transfert row → different wording.  
- **Root cause:** Chronological table hardcodes `"Vider la caisse"`; compte rapport uses `getCompteRapportDesignation` (`lib/functions.js`).  
- **Proposed fix:** Reuse shared designation helper in both print views.

---

### BUG-016 — Devis paiement dialog not responsive

- **Severity:** Low  
- **Status:** Open  
- **Steps to reproduce:** Open devis payment on ~390px width → 3-column grid overflows.  
- **Root cause:** Hard `grid-cols-3` in `components/paiement-dialog.jsx` (~220+). BL/fournisseur already use responsive grids.  
- **Proposed fix:** Apply `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.

---

## Previously reported issues now fixed (verified)

| Topic | Evidence |
|-------|----------|
| Bulk DELETE `/api/devis` articls typo | Bulk DELETE commented; `[id]` has `requireAdmin` + bank reverse |
| `syncLinkedReglement` solde/dette without confirm | Gated on `statusPrelevement === "confirme"` |
| Confirm race on `/api/reglements/[id]/confirm` | `FOR UPDATE` + atomic claim |
| `clerkClient` without await | Fixed in auth helpers / admin routes |
| BL DELETE reverse | Implemented in `bonLivraison/[id]` |
| Annuler prélèvement dette restore | Cas 2 restores dette |
| `/dashboard` shell without Navbar | Redirects to `/` |
| Shared `params` localStorage collisions | Namespaced keys |
| window.open before setItem | setItem then open across print flows |
| Compte print ignoring transfert/vider | Handled in `lib/functions.js` helpers |
| Admin sidebar leaking admin links to commercant | Role-filtered sidebar + AdminOnlyLayout |
| Empty states / page reset on filter | Present on skimmed list pages |

---

## Limitations

1. **No `TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD`** (or commercant equivalents) → authenticated CRUD, pagination with real data, and live accounting mutations were **not** executed against the test DB from the browser. Bugs above are proven by code + unauthenticated/smoke/static checks; Critical accounting bugs should be re-verified with a test admin session.  
2. Clerk sign-in UI is **Google OAuth–first** in this project config; email/password invalid-input paths are limited on `/sign-in` (sign-up shows optional email + Cloudflare CAPTCHA).  
3. Env vars were **not** changed; active `DATABASE_URL` is the labeled **test** Neon database.

---

## Recommended fix order

1. BUG-001 (traite) + BUG-002 (overpay) — payment integrity  
2. BUG-003 / BUG-010 — dette consistency on delete  
3. BUG-004 — leftover fournisseur paiement  
4. BUG-005 — PATCH confirm race  
5. BUG-006 — BL sync on en_attente edit  
6. BUG-012–014 — payment dialog UX / invalid inputs  
7. BUG-007, BUG-008, BUG-009, BUG-011, BUG-015, BUG-016  

---

## Artifacts

- Smoke script: `scripts/qa-smoke.mjs`  
- Run: with `npm run dev` → `node scripts/qa-smoke.mjs`  
- Screenshots / JSON: `qa-artifacts/` (gitignored)
