# Page d'Impression des Règlements - Fournisseurs

## Description

Cette page permet d'imprimer et d'exporter les règlements d'un fournisseur dans un format professionnel et optimisé pour l'impression.

## Fonctionnalités

### 🖨️ **Impression Optimisée**

- Mise en page professionnelle pour l'impression
- Styles CSS dédiés à l'impression
- Gestion automatique des sauts de page
- Optimisation pour l'impression noir et blanc

### 📊 **Informations Affichées**

- **En-tête** : Logo de l'entreprise et informations de base
- **Informations du fournisseur** : Nom, ICE, téléphone
- **Tableau des règlements** : Date, compte, méthode de paiement, montant
- **Détails des chèques** : Tableau séparé pour les paiements par chèque (masqué à l'impression)

### 🎨 **Design et Mise en Forme**

- Badges colorés pour les méthodes de paiement
- Tableaux bien structurés avec totaux
- Responsive design pour différents formats d'impression
- **Note** : Les cartes d'information financière (Dette, Chiffre d'Affaires, Total Règlements) ont été supprimées pour une mise en page plus compacte

## Utilisation

### 1. **Accès depuis le dialogue fournisseur**

- Ouvrir le dialogue d'informations du fournisseur
- Cliquer sur le bouton "Imprimer" ou "PDF"
- Redirection automatique vers cette page

### 2. **Impression**

- Cliquer sur le bouton "Imprimer" (violet)
- Utiliser la fonction d'impression du navigateur
- Sauvegarder en PDF si nécessaire

### 3. **Navigation**

- Retour au dialogue fournisseur via le bouton retour du navigateur
- Les données sont conservées dans le localStorage

## Structure des Données

### **Données Requises (localStorage)**

```javascript
{
  "fournisseur": {
    "nom": "Nom du fournisseur",
    "ice": "ICE du fournisseur",
    "telephone": "Téléphone",
    "dette": 1500
  },
  "transactions": [
    {
      "date": "2024-01-15",
      "compte": "compte bancaire",
      "methodePaiement": "cheque",
      "montant": 500,
      "cheque": {
        "numero": "CH001"
      }
    }
  ],
  "bonLivraisons": [
    {
      "type": "achats",
      "total": 2000
    }
  ]
}
```

## Fichiers Associés

- **`page.jsx`** : Composant principal de la page
- **`print.css`** : Styles CSS optimisés pour l'impression
- **`README.md`** : Documentation (ce fichier)

## Intégration

### **Composant Parent**

- `components/infos-fournisseur-dialog.jsx`
- Boutons d'impression et d'export PDF

### **Composants Utilisés**

- `components/Entete-devis.jsx` : En-tête avec logos
- `components/ui/table` : Composants de tableau
- `components/ui/button` : Bouton d'impression

### **Fonctions Utilitaires**

- `formatCurrency()` : Formatage des montants
- `formatDate()` : Formatage des dates

## Personnalisation

### **Modifier les Styles d'Impression**

- Éditer le fichier `print.css`
- Ajuster les couleurs, marges et espacements
- Optimiser pour différents types d'imprimantes

### **Ajouter de Nouvelles Informations**

- Modifier la structure des données dans `page.jsx`
- Ajouter de nouvelles colonnes dans les tableaux
- Étendre les cartes d'information

## Avantages

✅ **Professionnel** : Mise en page adaptée aux rapports d'entreprise  
✅ **Optimisé** : Styles CSS dédiés à l'impression  
✅ **Complet** : Toutes les informations importantes incluses  
✅ **Flexible** : Support de l'impression et de l'export PDF  
✅ **Maintenable** : Code structuré et documenté

## Support Navigateur

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile (responsive)

## Notes Techniques

- Utilise le localStorage pour passer les données
- Styles CSS optimisés pour l'impression
- Gestion automatique des sauts de page
- Support des différents formats de papier
