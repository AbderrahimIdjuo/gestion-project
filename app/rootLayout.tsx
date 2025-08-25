"use client";

import ConnectionStatusBar from "@/components/ConnectionStatusBar";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const connectionStatus = useConnectionStatus();

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionStatusBar connectionStatus={connectionStatus} />
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </QueryClientProvider>
  );
}
