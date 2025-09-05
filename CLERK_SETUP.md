# Clerk Authentication Setup Guide

Ce document explique comment configurer et utiliser Clerk pour l'authentification avec contrôle d'accès basé sur les rôles dans votre projet Next.js.

## 🚀 Installation et Configuration

### 1. Dépendances installées

```bash
npm install @clerk/nextjs svix
```

### 2. Variables d'environnement

Créez un fichier `.env.local` avec les clés suivantes :

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key_here
CLERK_SECRET_KEY=your_secret_key_here

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/sso-callback
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/sso-callback

# Webhook secret (optionnel, pour la gestion automatique des rôles)
CLERK_WEBHOOK_SECRET=your_webhook_secret_here
```

### 3. Configuration Clerk

1. Créez un compte sur [clerk.com](https://clerk.com)
2. Créez une nouvelle application
3. Copiez vos clés API dans le fichier `.env.local`
4. Configurez les URLs de redirection dans votre dashboard Clerk

## 🔐 Structure de l'authentification

### Provider Principal

Le composant `ClerkProviderWrapper` enveloppe toute l'application dans `app/rootLayout.tsx`.

### Middleware de protection

Le fichier `middleware.ts` protège les routes :

- `/dashboard` → Utilisateurs authentifiés
- `/admin/*` → Rôle "admin" uniquement
- `/commercant/*` → Rôles "admin" ou "commercant"

## 👥 Gestion des rôles

### Types de rôles

- **admin** : Accès complet à toutes les fonctionnalités
- **commercant** : Accès aux fonctionnalités commerciales

### Attribution automatique des rôles

- Nouveaux utilisateurs → Rôle "commercant" par défaut
- Webhook automatique dans `/api/webhook/clerk/route.js`

### Mise à jour manuelle des rôles

Seuls les administrateurs peuvent promouvoir des utilisateurs via :

- Interface d'administration : `/admin/users`
- API : `PATCH /api/admin/users/[id]/role`

## 🛠️ Utilisation dans le code

### Vérification des rôles côté serveur

```typescript
import { requireAdmin, requireRole, getUserRole } from "@/lib/auth-utils";

// Vérifier si l'utilisateur est admin
const { userId, userRole } = await requireAdmin();

// Vérifier un rôle spécifique
const { userId, userRole } = await requireRole("commercant");

// Obtenir le rôle de l'utilisateur
const role = await getUserRole();
```

### Vérification des rôles côté client

```typescript
import { useUser } from "@clerk/nextjs";

function MyComponent() {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role;

  if (userRole === "admin") {
    return <AdminPanel />;
  }

  return <CommercantPanel />;
}
```

### Protection des composants

```typescript
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Vérifier le rôle
  const user = await currentUser();
  const userRole = user?.publicMetadata?.role;

  if (userRole !== "admin") {
    redirect("/dashboard");
  }

  return <AdminContent />;
}
```

## 📱 Pages d'authentification

### Connexion

- Route : `/sign-in`
- Composant : `SignIn` de Clerk
- Redirection après connexion : `/dashboard`

### Inscription

- Route : `/sign-up`
- Composant : `SignUp` de Clerk
- Redirection après inscription : `/dashboard`

## 🔧 Gestion des utilisateurs

### Interface d'administration

- Route : `/admin/users`
- Fonctionnalités :
  - Voir tous les utilisateurs
  - Promouvoir des utilisateurs au rôle admin
  - Gérer les rôles

### API de gestion des rôles

```typescript
// Promouvoir un utilisateur
PATCH /api/admin/users/[id]/role
Body: { "role": "admin" }
```

## 🎨 Personnalisation de l'interface

### Thème Clerk

Modifiez l'apparence dans `components/clerk-provider.tsx` :

```typescript
<ClerkProvider
  appearance={{
    elements: {
      formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
      card: "shadow-lg",
      headerTitle: "text-2xl font-bold text-gray-900",
    },
  }}
>
```

### Navigation conditionnelle

Dans `components/navbar.tsx`, les liens s'affichent selon le rôle :

```typescript
{
  user?.publicMetadata?.role === "admin" && (
    <Link href="/admin">Administration</Link>
  );
}
```

## 🚨 Sécurité

### Protection des routes

- Middleware vérifie l'authentification et les rôles
- Redirection automatique vers `/sign-in` si non authentifié
- Redirection vers `/dashboard` si accès refusé

### Vérification côté serveur

- Toujours vérifier les rôles côté serveur pour les API
- Utiliser `requireAdmin()` et `requireRole()` pour la protection

### Webhooks

- Vérification des signatures avec `svix`
- Attribution automatique des rôles par défaut

## 📋 Checklist de déploiement

- [ ] Variables d'environnement configurées
- [ ] Clés Clerk valides
- [ ] Webhook configuré dans Clerk Dashboard
- [ ] URLs de redirection configurées
- [ ] Middleware testé
- [ ] Rôles attribués aux utilisateurs existants
- [ ] Interface d'administration testée

## 🔍 Dépannage

### Erreurs courantes

1. **"Authentication required"**

   - Vérifiez que l'utilisateur est connecté
   - Vérifiez la configuration du middleware

2. **"Access denied"**

   - Vérifiez le rôle de l'utilisateur
   - Vérifiez les permissions de la route

3. **Webhook non fonctionnel**
   - Vérifiez `CLERK_WEBHOOK_SECRET`
   - Vérifiez la configuration dans Clerk Dashboard

### Logs de débogage

Activez les logs dans le middleware et les webhooks pour diagnostiquer les problèmes.

## 📚 Ressources supplémentaires

- [Documentation Clerk](https://clerk.com/docs)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Clerk Webhooks](https://clerk.com/docs/webhooks)
- [Clerk User Management](https://clerk.com/docs/users/user-management)
