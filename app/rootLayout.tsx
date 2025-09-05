"use client";

import { ClerkProviderWrapper } from "@/components/clerk-provider";
import { useUser } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// Composant séparé qui utilise useUser
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();

  // Afficher la navigation seulement si l'utilisateur est connecté
  const showNavigation = isLoaded && isSignedIn;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Contenu principal */}
      <main
        className={`min-h-screen overflow-y-auto ${
          showNavigation ? "flex-1" : "w-full"
        }`}
      >
        {children}
      </main>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const connectionStatus = useConnectionStatus();

  return (
    <ClerkProviderWrapper>
      <QueryClientProvider client={queryClient}>
        <LayoutContent>{children}</LayoutContent>
      </QueryClientProvider>
    </ClerkProviderWrapper>
  );
}
