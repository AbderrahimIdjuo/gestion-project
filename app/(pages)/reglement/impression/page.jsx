"use client";
import { EnteteDevis } from "@/components/Entete-devis";
import { DirectPrintButton } from "@/components/ui/print-button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCurrency,
  formatDate,
  methodePaiementLabel,
} from "@/lib/functions";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import "./page.css";

export default function ImpressionReglements() {
  const [params, setParams] = useState(null);

  useEffect(() => {
    const storedData = localStorage.getItem("params");
    if (storedData) {
      setParams(JSON.parse(storedData));
      console.log("params", JSON.parse(storedData));
    }
  }, []);

  const reglements = useQuery({
    queryKey: ["reglements-impression", params],
    queryFn: async () => {
      if (!params) return { reglements: [], totalPages: 0 };
      
      // Récupérer tous les règlements sans pagination
      const response = await axios.get("/api/reglement", {
        params: {
          ...params,
          limit: 10000, // Récupérer tous les résultats
          page: 1,
        },
      });
      return response.data;
    },
    enabled: !!params,
  });

  const getStatutLabel = (statut) => {
    switch (statut) {
      case "en_attente":
        return "En attente";
      case "paye":
        return "Payé";
      case "en_retard":
        return "En retard";
      case "annule":
        return "Annulé";
      default:
        return statut || "—";
    }
  };

  const getStatusPrelevementLabel = (status) => {
    switch (status) {
      case "en_attente":
        return "En attente";
      case "confirme":
        return "Confirmé";
      case "echoue":
        return "Échoué";
      case "reporte":
        return "Reporté";
      case "refuse":
        return "Refusé";
      default:
        return "—";
    }
  };

  const formatDateRange = (from, to) => {
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      return `${formatDate(from)} - ${formatDate(to)}`;
    }
    return "Toutes les dates";
  };

  // Calcul du total
  const totalMontant =
    reglements.data?.reglements?.reduce(
      (sum, r) => sum + (r.montant || 0),
      0
    ) || 0;

  if (reglements.isLoading) {
    return (
      <div className="container mx-auto p-8 w-[90vw] bg-white min-h-screen">
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto p-8 w-[90vw] bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        {/* Document Content */}
        <div id="print-area" className="space-y-4">
          {/* Header */}
          <EnteteDevis />

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-gray-900 mb-3">
                Liste des Règlements
              </h3>

              {/* Informations des filtres */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                {params?.query && (
                  <div>
                    <span className="font-semibold">Recherche: </span>
                    <span>{params.query}</span>
                  </div>
                )}
                {params?.statut && params.statut !== "all" && (
                  <div>
                    <span className="font-semibold">Statut: </span>
                    <span>{getStatutLabel(params.statut)}</span>
                  </div>
                )}
                {params?.methodePaiement &&
                  params.methodePaiement !== "all" && (
                    <div>
                      <span className="font-semibold">Méthode: </span>
                      <span>
                        {params.methodePaiement === "espece"
                          ? "Espèce"
                          : params.methodePaiement === "cheque"
                          ? "Chèque"
                          : params.methodePaiement === "versement"
                          ? "Versement"
                          : params.methodePaiement === "traite"
                          ? "Traite"
                          : params.methodePaiement}
                      </span>
                    </div>
                  )}
                {params?.compte && params.compte !== "all" && (
                  <div>
                    <span className="font-semibold">Compte: </span>
                    <span>{params.compte}</span>
                  </div>
                )}
                {params?.statusPrelevement &&
                  params.statusPrelevement !== "all" && (
                    <div>
                      <span className="font-semibold">Statut prélèvement: </span>
                      <span>
                        {getStatusPrelevementLabel(params.statusPrelevement)}
                      </span>
                    </div>
                  )}
                {params?.from && params?.to && (
                  <div>
                    <span className="font-semibold">Date règlement: </span>
                    <span>{formatDateRange(params.from, params.to)}</span>
                  </div>
                )}
                {params?.fromPrelevement && params?.toPrelevement && (
                  <div>
                    <span className="font-semibold">Date prélèvement: </span>
                    <span>
                      {formatDateRange(
                        params.fromPrelevement,
                        params.toPrelevement
                      )}
                    </span>
                  </div>
                )}
                {(params?.minMontant || params?.maxMontant) && (
                  <div>
                    <span className="font-semibold">Montant: </span>
                    <span>
                      {params.minMontant || 0} - {params.maxMontant || "∞"} DH
                    </span>
                  </div>
                )}
              </div>

              {/* Tableau des règlements */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date création</TableHead>
                      <TableHead>Date règlement</TableHead>
                      <TableHead>Date prélèvement</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead>Compte</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Statut prélèvement</TableHead>
                      <TableHead>Numéro chèque</TableHead>
                      <TableHead>Facture</TableHead>
                      <TableHead>Motif</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reglements.data?.reglements?.length > 0 ? (
                      reglements.data.reglements.map((reglement) => (
                        <TableRow key={reglement.id}>
                          <TableCell>
                            {formatDate(reglement.dateReglement) || "—"}
                          </TableCell>
                          <TableCell>
                            {formatDate(reglement.dateReglement) || "—"}
                          </TableCell>
                          <TableCell>
                            {reglement.datePrelevement
                              ? formatDate(reglement.datePrelevement)
                              : "—"}
                          </TableCell>
                          <TableCell>{reglement.fournisseur.nom || "—"}</TableCell>
                          <TableCell>
                            {formatCurrency(reglement.montant)}
                          </TableCell>
                          <TableCell>
                            {methodePaiementLabel({
                              methodePaiement: reglement.methodePaiement,
                            })}
                          </TableCell>
                          <TableCell>{reglement.compte || "—"}</TableCell>
                          <TableCell>
                            {getStatutLabel(reglement.statut)}
                          </TableCell>
                          <TableCell>
                            {getStatusPrelevementLabel(
                              reglement.statusPrelevement
                            )}
                          </TableCell>
                          <TableCell>
                            {reglement.cheque?.numero || "—"}
                          </TableCell>
                          <TableCell>
                            {reglement.factureAchats?.numero || "—"}
                          </TableCell>
                          <TableCell>{reglement.motif || "—"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center">
                          Aucun règlement trouvé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4} className="font-bold text-right">
                        Total:
                      </TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(totalMontant)}
                      </TableCell>
                      <TableCell colSpan={7}></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </div>
          </div>
        </div>

        {/* Print Button */}
        <div className="mt-8 print:hidden">
          <DirectPrintButton />
        </div>
      </div>
    </>
  );
}

