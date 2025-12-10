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
import { PrintReportButton } from "@/components/ui/print-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Building2,
  Calendar,
  CreditCard,
  Package,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

export default function InfosFournisseurDialog({
  fournisseur,
  isOpen,
  onClose,
}) {
  const [bonLivraisons, setBonLivraisons] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [sortKey, setSortKey] = useState("montant");

  const formatCurrency = amount => {
    return new Intl.NumberFormat("fr-MA", {
      style: "currency",
      currency: "MAD",
    }).format(amount);
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const data = useQuery({
    queryKey: ["fournisseursStatistiques", fournisseur],
    queryFn: async () => {
      const response = await axios.get("/api/fournisseurs/statistiques", {
        params: { fournisseurId: fournisseur.id },
      });
      setBonLivraisons(response.data.bonLivraisons);
      setTransactions(response.data.transactions);
      console.log("response.data", response.data);
      return response.data;
    },
    enabled: !!fournisseur?.id,
  });
  const chiffreAffaires =
    bonLivraisons?.reduce((acc, bon) => {
      if (bon.type === "achats") {
        return acc + bon.total;
      } else if (bon.type === "retour") {
        return acc - bon.total;
      }
    }, 0) || 0;

  function getTopProduits(bonLivraisons, sortKey = "montant") {
    const stats = {};

    bonLivraisons.forEach(bl => {
      bl.groups?.forEach(group => {
        group.produits?.forEach(p => {
          const produitId = p.produitId;
          if (!produitId) return;

          const montant = p.quantite * p.prixUnite;

          if (!stats[produitId]) {
            stats[produitId] = {
              produitId,
              quantite: 0,
              montant: 0,
              designation:
                p.produit?.designation || `Produit ${produitId.slice(0, 5)}...`,
            };
          }

          stats[produitId].quantite += p.quantite;
          stats[produitId].montant += montant;
        });
      });
    });

    return Object.values(stats)
      .sort((a, b) => {
        if (sortKey === "quantite") return b.quantite - a.quantite;
        return b.montant - a.montant; // défaut : montant
      })
      .slice(0, 5);
  }
  const topProduits = useMemo(() => {
    console.log("topProduits", getTopProduits(bonLivraisons, sortKey));
    return getTopProduits(bonLivraisons, sortKey);
  }, [bonLivraisons, sortKey]);

  const montantRestantBL = useMemo(() => {
    return (
      bonLivraisons?.reduce((acc, bl) => {
        if (
          bl.statutPaiement === "enPartie" ||
          bl.statutPaiement === "impaye"
        ) {
          return acc + (bl.total - (bl.totalPaye || 0));
        }
        return acc;
      }, 0) || 0
    );
  }, [bonLivraisons]);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[95vw] max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 bg-gradient-to-r from-purple-600 via-purple-500 to-violet-500 text-white rounded-t-lg">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Avatar/Icon */}
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm flex-shrink-0 border-2 sm:border-4 border-white/30 mx-auto sm:mx-0">
              <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>

            {/* Informations principales */}
            <div className="flex-1 w-full">
              {/* Nom */}
              <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-2 text-white text-center sm:text-left">
                {fournisseur?.nom?.toUpperCase()}
              </DialogTitle>

              {/* Informations organisées en colonnes */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 lg:gap-8">
                {/* Colonne gauche - Informations principales */}
                <div className="space-y-3 sm:space-y-4 w-full sm:min-w-[200px] sm:w-auto">
                  {fournisseur?.ice && (
                    <div>
                      <p className="text-xs text-purple-200 mb-1">ICE:</p>
                      <p className="text-sm sm:text-base font-semibold text-white">
                        {fournisseur?.ice}
                      </p>
                    </div>
                  )}
                  {fournisseur?.telephone && (
                    <div>
                      <p className="text-xs text-purple-200 mb-1">Téléphone:</p>
                      <p className="text-sm sm:text-base font-semibold text-white">
                        {fournisseur?.telephone}
                      </p>
                    </div>
                  )}
                  {fournisseur?.telephoneSecondaire && (
                    <div>
                      <p className="text-xs text-purple-200 mb-1">Mobile:</p>
                      <p className="text-sm sm:text-base font-semibold text-white">
                        {fournisseur?.telephoneSecondaire}
                      </p>
                    </div>
                  )}
                </div>

                {/* Séparateur vertical - caché sur mobile */}
                {fournisseur?.adresse && (
                  <div className="hidden sm:block w-px bg-white/30"></div>
                )}

                {/* Colonne droite - Contact et autres */}
                <div className="space-y-3 sm:space-y-4 w-full sm:min-w-[200px] sm:flex-1">
                  {fournisseur?.adresse && (
                    <div>
                      <p className="text-xs text-purple-200 mb-1">Adresse:</p>
                      <p className="text-sm sm:text-base font-semibold text-white">
                        {fournisseur?.adresse}
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
                  {formatCurrency(montantRestantBL)}
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
                      Total des achats
                    </p>
                  </div>
                </div>
                <Badge className="text-base sm:text-lg px-3 sm:px-4 py-1.5 sm:py-2 font-bold bg-emerald-600 text-white border-0 shadow-md hover:bg-emerald-700 w-full sm:w-auto text-center">
                  {formatCurrency(chiffreAffaires)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Liste de produits et règlements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Top 5 Products */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-zinc-50 to-zinc-100 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
                      <Package className="h-4 w-4 text-white" />
                    </div>
                    Top 5 Produits ({topProduits.length})
                  </CardTitle>
                  <Select value={sortKey} onValueChange={setSortKey}>
                    <SelectTrigger className="max-w-[120px] focus:ring-2 focus:ring-purple-500">
                      <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="montant">Montant</SelectItem>
                      <SelectItem value="quantite">Quantité</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {data.isLoading ? (
                  <div className="flex justify-center w-full py-12">
                    <Spinner />
                  </div>
                ) : topProduits.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-zinc-50 to-zinc-100 border-b">
                          <TableHead className="font-semibold">
                            Produit
                          </TableHead>
                          <TableHead className="font-semibold text-center">
                            Qté
                          </TableHead>
                          <TableHead className="font-semibold text-right">
                            Montant
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topProduits.map((produit, index) => (
                          <TableRow
                            key={index}
                            className="hover:bg-purple-50 transition-colors"
                          >
                            <TableCell className="font-medium text-sm">
                              {produit.designation}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {produit.quantite}
                            </TableCell>
                            <TableCell className="text-right font-medium text-blue-600">
                              {formatCurrency(produit.montant)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="font-medium">Aucun produit trouvé</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Règlements */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-zinc-50 to-zinc-100 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-500 flex items-center justify-center">
                      <Receipt className="h-4 w-4 text-white" />
                    </div>
                    Règlements ({transactions.length})
                  </CardTitle>
                  <PrintReportButton
                    variant="outline"
                    size="sm"
                    data={{
                      fournisseur,
                      transactions,
                      bonLivraisons,
                    }}
                    localStorageKey="fournisseur-reglements-rapport"
                    targetRoute="/fournisseurs/imprimer-reglements"
                    className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
                  >
                    Imprimer
                  </PrintReportButton>
                </div>
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
                      <p className="font-medium">Aucun règlement trouvé</p>
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
