"use client";

import { ClerkProviderWrapper } from "@/components/clerk-provider";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { useUser } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// Composant séparé qui utilise useUser
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();

  // Afficher la Sidebar et Navbar seulement si l'utilisateur est connecté
  const showNavigation = isLoaded && isSignedIn;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Navbar - visible sur toutes les pages si connecté */}
      {showNavigation && <Navbar />}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - visible seulement si connecté */}
        {showNavigation && <Sidebar />}

        {/* Contenu principal */}
        <main
          className={`min-h-screen overflow-y-auto ${
            showNavigation ? "flex-1" : "w-full"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ClerkProviderWrapper>
      <QueryClientProvider client={queryClient}>
        <LayoutContent>{children}</LayoutContent>
      </QueryClientProvider>
    </ClerkProviderWrapper>
  );
}
