# Composants UI - Détails du Chèque

## Problème de conflit avec les Dialog

⚠️ **Important** : Les composants `Popover` peuvent avoir des conflits avec les `Dialog` ouverts à cause des problèmes de z-index et de contexte de portail. C'est pourquoi nous proposons une solution avec un Dialog simple.

## Couleurs des badges

Les badges de méthode de paiement ont des couleurs spécifiques pour une meilleure identification visuelle :

- **Espèce** : `bg-green-100 text-green-800` (vert)
- **Chèque** : `bg-purple-100 text-purple-800` (violet)
- **Autres méthodes** : `bg-gray-100 text-gray-800` (gris)

## Solution disponible

### ChequeDetailsDialog (RECOMMANDÉE)

Utilise un Dialog simple pour éviter les conflits avec les Dialog parents.

## Utilisation

```jsx
import { ChequeDetailsDialog } from "@/components/ui/cheque-details-dialog";

<TableCell className="text-center">
  <ChequeDetailsDialog
    methodePaiement={reglement.methodePaiement}
    cheque={reglement.cheque}
    montant={reglement.montant}
    compte={reglement.compte}
    date={reglement.date}
    formatCurrency={formatCurrency}
    formatDate={formatDate}
    type="EMIS" // ou "RECU" selon le contexte
  />
</TableCell>;
```

## Props

| Prop              | Type     | Description                                                           | Requis |
| ----------------- | -------- | --------------------------------------------------------------------- | ------ |
| `methodePaiement` | string   | La méthode de paiement (doit être "cheque" pour afficher les détails) | Oui    |
| `cheque`          | object   | L'objet chèque avec les détails (numero, dateReglement, type)         | Non    |
| `montant`         | number   | Le montant du chèque                                                  | Oui    |
| `compte`          | string   | Le compte bancaire utilisé                                            | Oui    |
| `date`            | string   | La date de la transaction                                             | Oui    |
| `formatCurrency`  | function | Fonction pour formater la monnaie                                     | Oui    |
| `formatDate`      | function | Fonction pour formater la date                                        | Oui    |
| `type`            | string   | Le type de chèque ("EMIS" ou "RECU"), par défaut "EMIS"               | Non    |

## Avantages

- **Aucun conflit** : Utilise le même système que les Dialog parents
- **Cohérence visuelle** : Même style et comportement que les autres Dialog
- **Accessibilité** : Gestion native du focus et de la navigation clavier
- **Responsive** : S'adapte automatiquement aux différentes tailles d'écran

## Comportement

- **Espèce** : Badge vert, non cliquable
- **Chèque** : Badge violet avec curseur pointer, ouvre un Dialog avec les détails au clic
- **Autres méthodes** : Badge gris sans interaction
- Les valeurs manquantes sont remplacées par des valeurs par défaut appropriées
- Le Dialog s'ouvre au centre de l'écran avec une animation fluide
