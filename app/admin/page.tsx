import { auth, currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const userRole = user?.publicMetadata?.role as string;

  if (userRole !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        <p className="text-muted-foreground">
          Gestion administrative et configuration système
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle>Gestion des utilisateurs</CardTitle>
            <CardDescription>Gérez les comptes et rôles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/admin/users">Gérer les utilisateurs</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/users?action=invite">Inviter un utilisateur</Link>
            </Button>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Paramètres système</CardTitle>
            <CardDescription>Configuration globale de l'application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/settings/general">Paramètres généraux</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/settings/security">Sécurité</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Database Management */}
        <Card>
          <CardHeader>
            <CardTitle>Base de données</CardTitle>
            <CardDescription>Gestion et maintenance des données</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/database/backup">Sauvegarde</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/database/restore">Restauration</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Audit Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Journaux d'audit</CardTitle>
            <CardDescription>Suivi des activités et modifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/audit/logs">Voir les journaux</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/audit/export">Exporter les données</Link>
            </Button>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>État du système</CardTitle>
            <CardDescription>Surveillance et performances</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/system/health">État général</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/system/performance">Performances</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Access Control */}
        <Card>
          <CardHeader>
            <CardTitle>Contrôle d'accès</CardTitle>
            <CardDescription>Gestion des permissions et rôles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/access/roles">Gérer les rôles</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/access/permissions">Permissions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques système</CardTitle>
          <CardDescription>Aperçu de l'utilisation et des performances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">24</div>
              <div className="text-sm text-muted-foreground">Utilisateurs actifs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">98.5%</div>
              <div className="text-sm text-muted-foreground">Disponibilité</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">2.3s</div>
              <div className="text-sm text-muted-foreground">Temps de réponse</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">1.2GB</div>
              <div className="text-sm text-muted-foreground">Espace disque</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
