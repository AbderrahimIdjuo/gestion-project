"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { updatePayerStatus } from "@/app/api/factures/facturesService";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());
  useEffect(() => {
    updatePayerStatus();
    console.log("updatePayerStatus is triggered");
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-h-screen overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </QueryClientProvider>
  );
}
