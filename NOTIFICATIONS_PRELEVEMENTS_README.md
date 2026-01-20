# Notifications de Prélèvements - Guide (Darija)

## Kifach ttesta (Comment tester)

### 1. Préparer les données de test

Bach ttesta, khassk t7t data f database. Daba kaynin 2 façons:

#### Option A: Via Prisma Studio (Plus facile)
```bash
npx prisma studio
```
- Dir f table `Reglement`
- Zid reglement jdid:
  - `datePrelevement`: Dir date dyal lyoma (today) wla bach ttesta "en retard", dir date dyal bach (yesterday)
  - `statusPrelevement`: Khassha tkoun `"en_attente"`
  - `fournisseurId`: Khassha tkoun ID dyal fournisseur mawjoud
  - `montant`: Dir chi montant (ex: 1000)
  - `methodePaiement`: Dir chi valeur (ex: "cheque")
  - `dateReglement`: Dir chi date
  - `compte`: Dir chi compte
  - `statut`: Dir "en_attente"

#### Option B: Via SQL direct
```sql
-- Zid reglement dyal lyoma
INSERT INTO "Reglement" (
  id, "fournisseurId", compte, montant, "methodePaiement", 
  "dateReglement", "datePrelevement", "statusPrelevement", statut,
  "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'ID_DYAL_FOURNISSEUR', -- Khassk tbeddelha b ID dyal fournisseur mawjoud
  'Compte Test',
  1500.00,
  'cheque',
  NOW(),
  CURRENT_DATE, -- Date dyal lyoma
  'en_attente',
  'en_attente',
  NOW(),
  NOW()
);

-- Zid reglement en retard (datePrelevement < today)
INSERT INTO "Reglement" (
  id, "fournisseurId", compte, montant, "methodePaiement", 
  "dateReglement", "datePrelevement", "statusPrelevement", statut,
  "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'ID_DYAL_FOURNISSEUR',
  'Compte Test',
  2000.00,
  'cheque',
  NOW(),
  CURRENT_DATE - INTERVAL '2 days', -- Date dyal bach (2 jours avant)
  'en_attente',
  'en_attente',
  NOW(),
  NOW()
);
```

### 2. Tester l'API directement

```bash
# F terminal, dir:
curl http://localhost:3000/api/reglements/today-prelevements
```

Khassk tchof JSON response b:
- `todayReglements`: Array dyal reglements dyal lyoma
- `overdueReglements`: Array dyal reglements en retard
- `count`: Total count

### 3. Tester le composant

1. Khassk t7t `<NavbarNotifications />` f navbar dyalek (ex: f layout.tsx wla navbar component)
2. Dir `npm run dev`
3. Tchof f navbar, khassk tchof bell icon
4. Ila kaynin reglements, khassk tchof badge b count
5. Klik 3la bell icon, khassk tchof dropdown b list dyal reglements
6. Tchof kifach kayt3ayno today vs overdue (couleurs différentes)

### 4. Tester auto-refresh

- B7al ma t7t data, tchof notification
- Dir update f database (b7al dir `statusPrelevement = 'confirme'`)
- Sstana 60 secondes, khassk tchof count ytbeddel automatiquement

## Kifach tdeploy (Comment déployer)

### 1. Vérifier package.json

Khassk tchof bach `postinstall` script kayn:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

Hada kayn déja f package.json dyalek, donc mzyan!

### 2. Vercel Deployment

Ila katdeploy 3la Vercel:

1. **Push code l GitHub:**
   ```bash
   git add .
   git commit -m "Add prelevements notifications"
   git push
   ```

2. **Vercel auto-deploy:**
   - Vercel kaydetecti changes automatiquement
   - Kaydir `npm install` (li kayn3awen `postinstall` script)
   - `postinstall` kaydir `prisma generate` automatiquement
   - Kaydir build

3. **Environment Variables:**
   - Khassk t7t `DATABASE_URL` f Vercel dashboard
   - Dir: Settings > Environment Variables > Add `DATABASE_URL`

4. **Build Settings (Ila khassha):**
   - Build Command: `npm run build` (default)
   - Install Command: `npm install` (default)
   - Output Directory: `.next` (default)

### 3. Vérifier après deployment

1. Dir f Vercel dashboard > Deployments
2. Tchof logs dyal build, khassk tchof:
   - `prisma generate` kaydir successfully
   - Build kaydir successfully
3. Testi l'endpoint: `https://ton-site.vercel.app/api/reglements/today-prelevements`
4. Tchof notifications f navbar

### 4. Troubleshooting

**Problème: Prisma Client not generated**
- Vérifier bach `postinstall` kayn f package.json
- Dir manual: `npx prisma generate` f Vercel build logs

**Problème: Database connection error**
- Vérifier `DATABASE_URL` f environment variables
- Tchof bach database kayn accessible (network, firewall, etc.)

**Problème: Notifications ma kayt3aynoch**
- Tchof browser console bach tchof errors
- Tchof network tab, tchof bach API kayreturni data
- Vérifier bach kaynin reglements b `statusPrelevement = 'en_attente'`

## Structure dyal fichiers

```
app/api/reglements/today-prelevements/
  └── route.ts                    # API endpoint

components/
  └── NavbarNotifications.tsx    # React component

package.json                      # Contient postinstall script
```

## Notes importantes

- **Auto-refresh:** Kaydir refresh toutes les 60 secondes automatiquement
- **Status:** Kayjib ghir reglements b `statusPrelevement = 'en_attente'`
- **Today vs Overdue:** 
  - Today: `datePrelevement = aujourd'hui`
  - Overdue: `datePrelevement < aujourd'hui`
- **Button "Confirmer":** Daba kaydir alert, khassk t3awen backend endpoint bach tmarki confirmé

## Prochaines étapes (TODO)

1. Implémenter endpoint `/api/reglements/[id]/confirm` bach tmarki reglement confirmé
2. Update statusPrelevement l "confirme" f database
3. Refresh notifications après confirmation

---

**Bonne chance! 🚀**

