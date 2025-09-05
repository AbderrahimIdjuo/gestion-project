"use client";

import { LoadingDots } from "@/components/loading-dots";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SSOCallbackPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      if (user) {
        // Vérifier si l'utilisateur a un rôle
        const role = user.publicMetadata?.role;

        if (!role) {
          // Pas de rôle → rediriger vers no-access
          router.push("/no-access");
        } else {
          // A un rôle → rediriger vers dashboard
          router.push("/dashboard");
        }
      } else {
        // Pas connecté → rediriger vers sign-in
        router.push("/sign-in");
      }
    }
  }, [isLoaded, user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <LoadingDots />
        <p className="mt-4 text-slate-600">Finalisation de la connexion...</p>
      </div>
    </div>
  );
}
