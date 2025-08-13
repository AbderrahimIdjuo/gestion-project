"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useRouter } from "next/navigation";

export function PrintButton({
  children,
  variant = "outline",
  size = "default",
  className = "",
  data,
  localStorageKey,
  targetRoute,
  onClick,
  ...props
}) {
  const router = useRouter();

  const handlePrintClick = () => {
    // Si des données sont fournies, les sauvegarder dans localStorage
    if (data && localStorageKey) {
      localStorage.setItem(localStorageKey, JSON.stringify(data));
    }

    // Si une route cible est spécifiée, rediriger vers cette page
    if (targetRoute) {
      router.push(targetRoute);
      return;
    }

    // Sinon, exécuter la fonction onClick personnalisée
    if (onClick) {
      onClick();
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`bg-purple-500 hover:bg-purple-600 !text-white rounded-full ${className}`}
      onClick={handlePrintClick}
      {...props}
    >
      <Printer className="mr-2 h-4 w-4" />
      {children || "Imprimer"}
    </Button>
  );
}

// Composant spécialisé pour les rapports avec redirection
export function PrintReportButton({
  data,
  localStorageKey,
  targetRoute,
  children = "Imprimer",
  ...props
}) {
  return (
    <PrintButton
      data={data}
      localStorageKey={localStorageKey}
      targetRoute={targetRoute}
      {...props}
    >
      {children}
    </PrintButton>
  );
}

// Composant pour impression directe (window.print)
export function DirectPrintButton({
  children = "Imprimer",
  className = "",
  ...props
}) {
  const handleDirectPrint = () => {
    window.print();
  };

  return (
    <PrintButton onClick={handleDirectPrint} className={className} {...props}>
      {children}
    </PrintButton>
  );
}
