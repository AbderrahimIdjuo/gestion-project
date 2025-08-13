# Composants de Boutons d'Impression

## Description

Système unifié de boutons d'impression qui suit le même raisonnement que le code original des règlements des fournisseurs.

## Composants Disponibles

### 1. **PrintButton** - Bouton d'impression de base

Composant principal qui gère la logique d'impression avec localStorage et redirection.

#### Props

- `data` : Données à sauvegarder dans localStorage
- `localStorageKey` : Clé pour sauvegarder les données
- `targetRoute` : Route de redirection après sauvegarde
- `onClick` : Fonction personnalisée à exécuter
- `children` : Texte du bouton (défaut: "Imprimer")
- `variant`, `size`, `className` : Props standard de Button

#### Utilisation

```jsx
<PrintButton
  data={{ fournisseur, transactions }}
  localStorageKey="fournisseur-rapport"
  targetRoute="/fournisseurs/imprimer"
>
  Imprimer Rapport
</PrintButton>
```

### 2. **PrintReportButton** - Bouton pour rapports avec redirection

Spécialisé pour les rapports qui nécessitent une redirection vers une page d'impression.

#### Utilisation

```jsx
<PrintReportButton
  data={{ fournisseur, transactions, bonLivraisons }}
  localStorageKey="fournisseur-reglements-rapport"
  targetRoute="/fournisseurs/imprimer-reglements"
>
  Imprimer
</PrintReportButton>
```

### 3. **DirectPrintButton** - Bouton pour impression directe

Pour les pages qui utilisent directement `window.print()`.

#### Utilisation

```jsx
<DirectPrintButton>Imprimer</DirectPrintButton>
```

## Logique d'Impression

### **Pour les Rapports avec Redirection :**

1. Sauvegarde des données dans localStorage
2. Redirection vers la page d'impression dédiée
3. La page d'impression récupère les données et affiche le contenu formaté

### **Pour l'Impression Directe :**

1. Exécution immédiate de `window.print()`
2. Impression de la page actuelle

## Avantages

✅ **Unifié** : Même logique pour tous les boutons d'impression  
✅ **Maintenable** : Code centralisé et réutilisable  
✅ **Flexible** : Support de différents types d'impression  
✅ **Consistent** : Même apparence et comportement partout  
✅ **Type-safe** : Props bien définies et documentées

## Migration

### **Avant (ancien code) :**

```jsx
const handlePrint = () => {
  const reportData = { fournisseur, transactions };
  localStorage.setItem("key", JSON.stringify(reportData));
  router.push("/route");
};

<Button onClick={handlePrint}>
  <Printer className="mr-2 h-4 w-4" /> Imprimer
</Button>;
```

### **Après (nouveau composant) :**

```jsx
<PrintReportButton
  data={{ fournisseur, transactions }}
  localStorageKey="key"
  targetRoute="/route"
>
  Imprimer
</PrintReportButton>
```

## Fichiers Modifiés

- `components/infos-fournisseur-dialog.jsx`
- `components/print-commandeFourniture.jsx`
- `app/(pages)/ventes/factures/imprimer/page.jsx`
- `app/(pages)/transactions/impression/page.jsx`
- `app/(pages)/transactions/impressionRapportComptes/page.jsx`
- `app/(pages)/ventes/devis/[id]/pdf/page.jsx`
- `app/(pages)/ventes/devis/[id]/historiquePaiements/page.jsx`
- `app/(pages)/ventes/devis/imprimerFournitures/page.jsx`
- `app/(pages)/clients/imprimer-rapport/page.jsx`
- `app/(pages)/achats/bonLivraison/imprimer-rapport/page.jsx`
- `app/(pages)/achats/bonLivraison/imprimer/page.jsx`
- `app/(pages)/achats/commandes/imprimer/page.jsx`
- `app/(pages)/fournisseurs/imprimer-reglements/page.jsx`

## Notes Techniques

- Utilise le hook `useRouter` de Next.js pour la navigation
- Gestion automatique du localStorage
- Styles cohérents avec la classe `bg-purple-500 hover:bg-purple-600 !text-white rounded-full`
- Support complet des props de Button de shadcn/ui
