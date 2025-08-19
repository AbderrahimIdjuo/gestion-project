import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function CommercantPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const userRole = user?.publicMetadata?.role as string;

  // Allow both commercant and admin roles to access this page
  if (userRole !== "commercant" && userRole !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Espace Commercial</h1>
        <p className="text-muted-foreground">
          Gestion des clients, produits et ventes
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Clients Management */}
        <Card>
          <CardHeader>
            <CardTitle>Gestion des clients</CardTitle>
            <CardDescription>Gérez votre base de clients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/clients">Voir tous les clients</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/clients?action=new">Nouveau client</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Products Management */}
        <Card>
          <CardHeader>
            <CardTitle>Catalogue produits</CardTitle>
            <CardDescription>Gérez votre inventaire</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/produits">Voir tous les produits</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/produits?action=new">Nouveau produit</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Sales Management */}
        <Card>
          <CardHeader>
            <CardTitle>Gestion des ventes</CardTitle>
            <CardDescription>Créez devis et factures</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/ventes/devis">Nouveau devis</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/ventes/factures">Nouvelle facture</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Purchases Management */}
        <Card>
          <CardHeader>
            <CardTitle>Gestion des achats</CardTitle>
            <CardDescription>Gérez vos fournisseurs et commandes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/achats/fournisseurs">Fournisseurs</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/achats/commandes">Commandes</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Rapports</CardTitle>
            <CardDescription>Analysez vos performances</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/clients/imprimer-rapport">Rapport clients</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/tresorie/rapport">Rapport trésorerie</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Paramètres</CardTitle>
            <CardDescription>Configurez votre application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/parametres/infoEntreprise">Info entreprise</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/parametres/categories">Catégories</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
