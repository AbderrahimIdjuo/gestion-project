"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/functions";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Bell, CalendarClock, CheckCircle2, AlertTriangle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type ReglementNotification = {
  id: string;
  montant: number;
  datePrelevement: string;
  notificationType?: "today" | "overdue";
  fournisseur: {
    nom: string;
  };
};

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch today's prélèvements
  // This query will automatically refetch when invalidated from other components
  const { data, isLoading } = useQuery({
    queryKey: ["today-prelevements"],
    queryFn: async () => {
      const response = await axios.get("/api/reglements/today-prelevements");
      return response.data as {
        reglements: ReglementNotification[];
        count: number;
        todayCount?: number;
        overdueCount?: number;
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds to keep notifications up to date
  });

  const reglements = data?.reglements || [];
  const count = data?.count || 0;

  const handleReglementClick = (reglementId: string) => {
    setOpen(false);
    router.push(`/reglement?prelevement=${reglementId}`);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full hover:bg-gray-100"
        >
          <Bell className="h-5 w-5 text-gray-700" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {count > 9 ? "9+" : count}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-md">
        <div className="px-3 py-2 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {count > 0 && (
              <Badge variant="secondary" className="text-xs">
                {count} nouveau{count > 1 ? "x" : ""}
              </Badge>
            )}
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : reglements.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aucune notification</p>
              <p className="text-xs text-gray-400 mt-1">Vous êtes à jour !</p>
            </div>
          ) : (
            <div className="py-2">
              {reglements.map((reglement, index) => {
                const isOverdue = reglement.notificationType === "overdue";
                return (
                  <div key={reglement.id}>
                    <DropdownMenuItem
                      onClick={() => handleReglementClick(reglement.id)}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer group ${
                        isOverdue
                          ? "hover:!bg-red-50 focus:bg-red-50"
                          : "hover:!bg-amber-50 focus:bg-amber-50"
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            isOverdue
                              ? "bg-red-100"
                              : "bg-amber-100"
                          }`}
                        >
                          {isOverdue ? (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          ) : (
                            <CalendarClock className="h-5 w-5 text-amber-600" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            isOverdue
                              ? "text-gray-900 group-hover:text-red-900"
                              : "text-gray-900 group-hover:text-amber-900"
                          }`}
                        >
                          {isOverdue
                            ? "Prélèvement en retard"
                            : "Prélèvement prévu aujourd'hui"}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {reglement.fournisseur.nom}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs font-semibold ${
                              isOverdue
                                ? "text-red-600"
                                : "text-amber-600"
                            }`}
                          >
                            {formatCurrency(reglement.montant)}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {formatDate(reglement.datePrelevement)}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuItem>
                    {index < reglements.length - 1 && (
                      <DropdownMenuSeparator />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {reglements.length > 0 && !pathname?.startsWith("/reglement") && (
          <>
            <DropdownMenuSeparator />
            <div className="px-3 py-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setOpen(false);
                  router.push("/reglement");
                }}
              >
                Voir tous les règlements
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
