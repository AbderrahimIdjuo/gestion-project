# Setup Instructions - Notifications de Prélèvements

## Fichiers créés

### 1. `app/api/reglements/today-prelevements/route.ts`
Route API TypeScript qui retourne les prélèvements d'aujourd'hui et en retard.

### 2. `components/NavbarNotifications.tsx`
Composant React client qui affiche les notifications avec badge et dropdown.

### 3. `NOTIFICATIONS_PRELEVEMENTS_README.md`
Guide complet en darija pour tester et déployer.

## Vérification package.json

Le script `postinstall` est **déjà présent** dans votre `package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

✅ Pas besoin de modification!

## Utilisation

### Ajouter le composant dans votre navbar

Exemple dans `app/layout.tsx` ou votre composant navbar:

```tsx
import { NavbarNotifications } from "@/components/NavbarNotifications";

// Dans votre navbar:
<NavbarNotifications />
```

## Test rapide

1. **Créer un règlement de test:**
   ```sql
   INSERT INTO "Reglement" (
     id, "fournisseurId", compte, montant, "methodePaiement", 
     "dateReglement", "datePrelevement", "statusPrelevement", statut,
     "createdAt", "updatedAt"
   ) VALUES (
     gen_random_uuid(),
     'VOTRE_FOURNISSEUR_ID',
     'Test',
     1000.00,
     'cheque',
     NOW(),
     CURRENT_DATE, -- Aujourd'hui
     'en_attente',
     'en_attente',
     NOW(),
     NOW()
   );
   ```

2. **Vérifier l'API:**
   ```bash
   curl http://localhost:3000/api/reglements/today-prelevements
   ```

3. **Vérifier le composant:**
   - Ajouter `<NavbarNotifications />` dans votre navbar
   - Vous devriez voir une icône de cloche avec un badge si des prélèvements sont en attente

## Dépendances

Toutes les dépendances sont déjà installées:
- ✅ `date-fns` (pour le formatage de dates)
- ✅ `@radix-ui/react-popover` (pour le dropdown)
- ✅ `lucide-react` (pour les icônes)
- ✅ `@prisma/client` (pour la base de données)

## Notes

- Le composant se rafraîchit automatiquement toutes les 60 secondes
- Seuls les règlements avec `statusPrelevement = 'en_attente'` sont affichés
- Le bouton "Confirmer" affiche actuellement une alerte (à implémenter côté backend)

