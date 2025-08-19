import { auth, currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllUsersWithRoles, updateUserRole } from "@/lib/auth-utils";
import { UserRole } from "@/lib/auth-utils";
import { useState } from "react";

export default async function AdminUsersPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const userRole = user?.publicMetadata?.role as string;

  if (userRole !== "admin") {
    redirect("/dashboard");
  }

  const users = await getAllUsersWithRoles();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
        <p className="text-muted-foreground">
          Gérez les rôles et permissions des utilisateurs
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>
            {users.length} utilisateur(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Créé le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>
                    {user.role}
                  </Badge>
                  
                  {user.role !== "admin" && (
                    <RoleUpdateButton userId={user.id} currentRole={user.role} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Client component for role updates
function RoleUpdateButton({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleUpdate = async (newRole: UserRole) => {
    if (!confirm(`Êtes-vous sûr de vouloir promouvoir cet utilisateur au rôle ${newRole} ?`)) {
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert('Erreur lors de la mise à jour du rôle');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Erreur lors de la mise à jour du rôle');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button
      onClick={() => handleRoleUpdate("admin")}
      disabled={isUpdating}
      size="sm"
      variant="outline"
    >
      {isUpdating ? "Mise à jour..." : "Promouvoir Admin"}
    </Button>
  );
}
