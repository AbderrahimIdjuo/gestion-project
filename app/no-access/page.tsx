import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignOutButton } from "@clerk/nextjs";
import { AlertTriangle, Home, LogOut } from "lucide-react";
import Link from "next/link";

export default function NoAccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Accès Refusé
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            Votre compte n&apos;a pas de rôle attribué. Veuillez contacter un
            administrateur pour obtenir les permissions nécessaires.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Que faire maintenant ?</strong>
            </p>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1">
              <li>• Contactez votre administrateur système</li>
              <li>• Demandez l&apos;attribution d&apos;un rôle approprié</li>
              <li>• Vérifiez que votre compte est correctement configuré</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Retour à l&apos;accueil
              </Link>
            </Button>

            <SignOutButton>
              <Button variant="outline" className="flex-1">
                <LogOut className="w-4 h-4 mr-2" />
                Se déconnecter
              </Button>
            </SignOutButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
