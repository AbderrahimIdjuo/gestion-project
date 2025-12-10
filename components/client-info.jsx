"use client";

import Spinner from "@/components/customUi/Spinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChequeDetailsDialog } from "@/components/ui/cheque-details-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/functions";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Calendar,
  CreditCard,
  FileText,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

export function ClientInfoDialog({ client, isOpen, onClose }) {
  const [devis, setDevis] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const data = useQuery({
    queryKey: ["clientStatistiques", client],
    queryFn: async () => {
      const response = await axios.get("/api/clients/statistiques", {
        params: { clientId: client?.id },
      });
      setDevis(response.data.devis);
      setTransactions(response.data.transactions);
      console.log("response.data", response.data);
      return response.data;
    },
    enabled: !!client?.id,
  });
  const getStatusColor = status => {
    switch (status) {
      case "En attente":
        return "bg-amber-500";
      case "Accepté":
        return "bg-emerald-500";
      case "Annulé":
        return "bg-red-500";
      case "Terminer":
        return "bg-purple-500";
      case "Expiré":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getCompteColor = compte => {
    if (!compte) return "bg-gray-50 text-gray-700 border-gray-200";

    const compteLower = compte.toLowerCase();

    // Couleurs différentes selon le type de compte
    if (compteLower.includes("caisse")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    } else if (compteLower.includes("personnel")) {
      return "bg-purple-50 text-purple-700 border-purple-200";
    } else if (
      compteLower.includes("professionel") ||
      compteLower.includes("professionnel")
    ) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (compteLower.includes("banque")) {
      return "bg-orange-50 text-orange-700 border-orange-200";
    } else {
      // Couleur par défaut basée sur le hash du nom pour d'autres comptes
      const colors = [
        "bg-rose-50 text-rose-700 border-rose-200",
        "bg-cyan-50 text-cyan-700 border-cyan-200",
        "bg-indigo-50 text-indigo-700 border-indigo-200",
        "bg-pink-50 text-pink-700 border-pink-200",
        "bg-teal-50 text-teal-700 border-teal-200",
        "bg-amber-50 text-amber-700 border-amber-200",
      ];
      // Utiliser le hash du nom pour une couleur cohérente
      let hash = 0;
      for (let i = 0; i < compte.length; i++) {
        hash = compte.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    }
  };

  const chiffreAffaires = devis.reduce(
    (sum, devis) => sum + devis.totalPaye,
    0
  );
  const montantRestantDevis = devis.reduce((sum, devis) => {
    if (
      devis.statut === "Accepté" &&
      (devis.statutPaiement === "enPartie" || devis.statutPaiement === "impaye")
    ) {
      return sum + (devis.total - devis.totalPaye);
    }
    return sum;
  }, 0);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[95vw] max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 bg-gradient-to-r from-purple-600 via-purple-500 to-violet-500 text-white rounded-t-lg">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Avatar/Icon */}
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm flex-shrink-0 border-2 sm:border-4 border-white/30 mx-auto sm:mx-0">
              <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>

            {/* Informations principales */}
            <div className="flex-1 w-full">
              {/* Nom */}
              <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-2 text-white text-center sm:text-left">
                {client?.titre && client?.titre + ". "}
                {client?.nom?.toUpperCase()}
              </DialogTitle>

              {/* Informations organisées en colonnes */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 lg:gap-8">
                {/* Colonne gauche - Informations principales */}
                <div className="space-y-3 sm:space-y-4 w-full sm:min-w-[200px] sm:w-auto">
                  {client?.ice && (
                    <div>
                      <p className="text-xs text-purple-200 mb-1">ICE:</p>
                      <p className="text-sm sm:text-base font-semibold text-white">
                        {client?.ice}
                      </p>
                    </div>
                  )}
                  {client?.mobile && (
                    <div>
                      <p className="text-xs text-purple-200 mb-1">Mobile:</p>
                      <p className="text-sm sm:text-base font-semibold text-white">
                        {client?.mobile}
                      </p>
                    </div>
                  )}
                  {client?.telephone && (
                    <div>
                      <p className="text-xs text-purple-200 mb-1">Téléphone:</p>
                      <p className="text-sm sm:text-base font-semibold text-white">
                        {client?.telephone}
                      </p>
                    </div>
                  )}
                </div>

                {/* Séparateur vertical - caché sur mobile */}
                {(client?.email || client?.adresse || client?.note) && (
                  <div className="hidden sm:block w-px bg-white/30"></div>
                )}

                {/* Colonne droite - Contact et autres */}
                <div className="space-y-3 sm:space-y-4 w-full sm:min-w-[200px] sm:flex-1">
                  {client?.email && (
                    <div>
                      <p className="text-xs text-purple-200 mb-1">Email:</p>
                      <p className="text-sm sm:text-base font-semibold text-white break-all">
                        {client?.email}
                      </p>
                    </div>
                  )}
                  {client?.adresse && (
                    <div>
                      <p className="text-xs text-purple-200 mb-1">Adresse:</p>
                      <p className="text-sm sm:text-base font-semibold text-white">
                        {client?.adresse}
                      </p>
                    </div>
                  )}
                  {client?.note && (
                    <div>
                      <p className="text-xs text-purple-200 mb-1">Note:</p>
                      <p className="text-sm sm:text-base font-semibold text-white">
                        {client?.note}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Statistiques en haut */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 p-4 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-red-200 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16 opacity-20"></div>
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-red-500 flex items-center justify-center shadow-md flex-shrink-0">
                    <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-red-700">
                      Dette en cours
                    </p>
                    <p className="text-xs text-red-600 mt-0.5 hidden sm:block">
                      Montant restant à payer
                    </p>
                  </div>
                </div>
                <Badge
                  variant="destructive"
                  className="text-base sm:text-lg px-3 sm:px-4 py-1.5 sm:py-2 font-bold shadow-md w-full sm:w-auto text-center"
                >
                  {formatCurrency(montantRestantDevis)}
                </Badge>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 p-4 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-emerald-200 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16 opacity-20"></div>
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-md flex-shrink-0">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-emerald-700">
                      Chiffre d&apos;Affaires
                    </p>
                    <p className="text-xs text-emerald-600 mt-0.5 hidden sm:block">
                      Total des paiements reçus
                    </p>
                  </div>
                </div>
                <Badge className="text-base sm:text-lg px-3 sm:px-4 py-1.5 sm:py-2 font-bold bg-emerald-600 text-white border-0 shadow-md hover:bg-emerald-700 w-full sm:w-auto text-center">
                  {formatCurrency(chiffreAffaires)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Liste de devis et paiements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Liste de devis */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-zinc-50 to-zinc-100 border-b">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  Devis ({devis.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {data.isLoading ? (
                  <div className="flex justify-center w-full py-12">
                    <Spinner />
                  </div>
                ) : devis.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-zinc-50 to-zinc-100 border-b">
                          <TableHead className="font-semibold">Date</TableHead>
                          <TableHead className="font-semibold">
                            Numéro
                          </TableHead>
                          <TableHead className="font-semibold">Total</TableHead>
                          <TableHead className="font-semibold">Payé</TableHead>
                          <TableHead className="font-semibold">Reste</TableHead>
                          <TableHead className="font-semibold">
                            Statut
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {devis?.map((articl, index) => (
                          <TableRow
                            key={index}
                            className="hover:bg-purple-50 transition-colors cursor-pointer"
                          >
                            <TableCell className="font-medium text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {formatDate(articl.createdAt)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {articl.numero}
                            </TableCell>
                            <TableCell className="font-medium  text-blue-600">
                              {formatCurrency(articl.total)}
                            </TableCell>
                            <TableCell className="text-emerald-600 font-medium">
                              {formatCurrency(articl.totalPaye)}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(articl.total - articl.totalPaye)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-2.5 w-2.5 rounded-full ${getStatusColor(
                                    articl.statut
                                  )} shadow-sm`}
                                />
                                <span className="text-sm font-medium">
                                  {articl.statut}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="font-medium">Aucun devis trouvé</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Paiements */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-zinc-50 to-zinc-100 border-b">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-purple-500 flex items-center justify-center">
                    <Receipt className="h-4 w-4 text-white" />
                  </div>
                  Paiements ({transactions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  {data.isLoading ? (
                    <div className="flex justify-center w-full py-12">
                      <Spinner />
                    </div>
                  ) : transactions.length > 0 ? (
                    <Table>
                      <TableHeader className="sticky top-0 bg-gradient-to-r from-zinc-50 to-zinc-100 border-b z-10">
                        <TableRow>
                          <TableHead className="font-semibold">Date</TableHead>
                          <TableHead className="font-semibold">
                            Compte
                          </TableHead>
                          <TableHead className="font-semibold text-center">
                            M.Paiement
                          </TableHead>
                          <TableHead className="font-semibold text-right">
                            Montant
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions?.map((reglement, index) => (
                          <TableRow
                            key={index}
                            className="hover:bg-purple-50 transition-colors"
                          >
                            <TableCell className="text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {formatDate(reglement.date)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-sm">
                              <Badge
                                variant="outline"
                                className={getCompteColor(reglement.compte)}
                              >
                                {reglement.compte?.replace("compte ", "")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <ChequeDetailsDialog
                                methodePaiement={reglement.methodePaiement}
                                cheque={reglement.cheque}
                                montant={reglement.montant}
                                compte={reglement.compte}
                                date={reglement.date}
                                formatCurrency={formatCurrency}
                                formatDate={formatDate}
                                type="RECU"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-bold text-emerald-600 text-sm">
                                {formatCurrency(reglement.montant)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Receipt className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="font-medium">Aucune transaction trouvée</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
