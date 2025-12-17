"use client";

import { PrelevementConfirmationDialog } from "@/components/prelevement-confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertCircle,
  Bell,
  Calendar,
  CalendarClock,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Reglement {
  id: string;
  montant: number;
  datePrelevement: Date | null;
  fournisseur: {
    id: string;
    nom: string;
  };
}

interface PrelevementsData {
  todayReglements: Reglement[];
  overdueReglements: Reglement[];
  count: number;
}

export function NavbarNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReglement, setSelectedReglement] = useState<Reglement | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Utiliser React Query pour gérer les données et l'invalidation automatique
  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery<PrelevementsData>({
    queryKey: ["today-prelevements"],
    queryFn: async () => {
      const response = await fetch("/api/reglements/today-prelevements");

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des prélèvements");
      }

      return response.json();
    },
    refetchInterval: 60000, // Rafraîchir toutes les 60 secondes
    refetchOnWindowFocus: true, // Rafraîchir quand la fenêtre reprend le focus
    refetchOnMount: true, // Rafraîchir à chaque montage
  });

  useEffect(() => {
    // Marquer le composant comme monté (côté client uniquement)
    setMounted(true);
  }, []);

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "Erreur inconnue"
    : null;

  const handleNotificationClick = (reglement: Reglement) => {
    setSelectedReglement(reglement);
    setIsDialogOpen(true);
    setIsOpen(false); // Fermer le popover
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedReglement(null);
  };

  const handleDialogConfirm = () => {
    // Rafraîchir les données après confirmation
    refetch();
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "N/A";
    return format(new Date(date), "dd/MM/yyyy", { locale: fr });
  };

  const formatMontant = (montant: number): string => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "MAD",
    }).format(montant);
  };

  const formatTimeAgo = (date: Date | null): string => {
    if (!date) return "N/A";
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: fr,
    });
  };

  const count = data?.count ?? 0;
  const showBadge = count > 0;

  // Préparer les données pour le dialog
  const dialogReglement = selectedReglement
    ? {
        id: selectedReglement.id,
        montant: selectedReglement.montant,
        fournisseur: {
          nom: selectedReglement.fournisseur.nom,
        },
        datePrelevement: selectedReglement.datePrelevement
          ? new Date(selectedReglement.datePrelevement).toISOString()
          : null,
      }
    : null;

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="relative inline-flex items-center justify-center rounded-full p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            aria-label={`Notifications de prélèvements${
              showBadge ? ` (${count} en attente)` : ""
            }`}
            aria-expanded={isOpen}
          >
            <Bell className="h-5 w-5" />
            {showBadge && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                aria-label={`${count} prélèvements en attente`}
              >
                {count > 99 ? "99+" : count}
              </Badge>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[420px] p-0"
          align="end"
          sideOffset={8}
          aria-label="Liste des prélèvements"
        >
          <div className="max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-600">
                  Chargement...
                </span>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="mt-2"
                >
                  Réessayer
                </Button>
              </div>
            ) : count === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Aucun prélèvement en attente
                </p>
              </div>
            ) : (
              <div className="p-2">
                {/* Combiner tous les règlements et les trier par date */}
                {[
                  ...(data?.overdueReglements || []).map(r => ({
                    ...r,
                    type: "overdue" as const,
                  })),
                  ...(data?.todayReglements || []).map(r => ({
                    ...r,
                    type: "today" as const,
                  })),
                ]
                  .sort((a, b) => {
                    const dateA = a.datePrelevement
                      ? new Date(a.datePrelevement).getTime()
                      : 0;
                    const dateB = b.datePrelevement
                      ? new Date(b.datePrelevement).getTime()
                      : 0;
                    return dateB - dateA; // Plus récent en premier
                  })
                  .map(reglement => (
                    <div
                      key={reglement.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-white hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => handleNotificationClick(reglement)}
                    >
                      {/* Icône CalendarClock */}
                      <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-purple-100 text-purple-600">
                        <CalendarClock className="h-5 w-5" />
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">
                              {reglement.fournisseur.nom}
                            </p>
                            <p className="text-sm text-gray-600 mt-0.5">
                              Prélèvement de {formatMontant(reglement.montant)}
                            </p>
                          </div>
                        </div>

                        {/* Tag avec icône */}
                        <div className="mt-2 flex items-center gap-2">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                              reglement.type === "overdue"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {reglement.type === "overdue" ? (
                              <AlertCircle className="h-3 w-3" />
                            ) : (
                              <Calendar className="h-3 w-3" />
                            )}
                            <span>
                              {reglement.type === "overdue"
                                ? "En retard"
                                : "Aujourd'hui"}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(reglement.datePrelevement)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Dialog de confirmation */}
      <PrelevementConfirmationDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        reglement={dialogReglement}
        onConfirm={handleDialogConfirm}
      />
    </>
  );
}
