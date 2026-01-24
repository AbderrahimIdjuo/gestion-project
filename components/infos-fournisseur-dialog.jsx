"use client";

import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";
import Spinner from "@/components/customUi/Spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subQuarters,
  subYears,
} from "date-fns";
import {
  Building2,
  Calendar,
  CreditCard,
  LandmarkIcon,
  Package,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function InfosFournisseurDialog({
  fournisseur,
  isOpen,
  onClose,
}) {
  const [bonLivraisons, setBonLivraisons] = useState([]);
  const [reglements, setReglements] = useState([]);
  const [sortKey, setSortKey] = useState("montant");
  const [chequeDialogOpen, setChequeDialogOpen] = useState(false);
  const [selectedReglementForCheque, setSelectedReglementForCheque] = useState(null);
  // États pour le filtre de période des produits
  const [startDateProduits, setStartDateProduits] = useState();
  const [endDateProduits, setEndDateProduits] = useState();
  const [periodeProduits, setPeriodeProduits] = useState("ce-mois");

  // États pour le filtre de période des règlements
  const [startDateReglements, setStartDateReglements] = useState();
  const [endDateReglements, setEndDateReglements] = useState();
  const [periodeReglements, setPeriodeReglements] = useState("ce-mois");

  function getDateRangeFromPeriode(periode, customStartDate, customEndDate) {
    const now = new Date();

    switch (periode) {
      case "aujourd'hui":
        return {
          from: startOfDay(now),
          to: endOfDay(now),
        };
      case "ce-mois":
        return {
          from: startOfMonth(now),
          to: endOfMonth(now),
        };
      case "mois-dernier":
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return {
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        };
      case "trimestre-actuel":
        return {
          from: startOfQuarter(now),
          to: endOfQuarter(now),
        };
      case "trimestre-precedent":
        const prevQuarter = subQuarters(now, 1);
        return {
          from: startOfQuarter(prevQuarter),
          to: endOfQuarter(prevQuarter),
        };
      case "cette-annee":
        return {
          from: startOfYear(now),
          to: endOfYear(now),
        };
      case "annee-derniere":
        const lastYear = subYears(now, 1);
        return {
          from: startOfYear(lastYear),
          to: endOfYear(lastYear),
        };
      case "personnalisee":
        return {
          from: customStartDate ? new Date(customStartDate) : null,
          to: customEndDate ? new Date(customEndDate) : null,
        };
      default:
        return {
          from: null,
          to: null,
        };
    }
  }

  // Mettre à jour les dates quand la période des produits change
  useEffect(() => {
    if (periodeProduits !== "personnalisee") {
      const { from, to } = getDateRangeFromPeriode(periodeProduits);
      setStartDateProduits(from ? from.toISOString() : undefined);
      setEndDateProduits(to ? to.toISOString() : undefined);
    }
  }, [periodeProduits]);

  // Mettre à jour les dates quand la période des règlements change
  useEffect(() => {
    if (periodeReglements !== "personnalisee") {
      const { from, to } = getDateRangeFromPeriode(periodeReglements);
      setStartDateReglements(from ? from.toISOString() : undefined);
      setEndDateReglements(to ? to.toISOString() : undefined);
    }
  }, [periodeReglements]);

  const formatCurrency = amount => {
    return new Intl.NumberFormat("fr-MA", {
      style: "currency",
      currency: "MAD",
    }).format(amount);
  };

  const formatDate = dateString => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Fonction pour convertir un nombre en lettres (pour le montant du chèque)
  const nombreEnLettres = n => {
    const unites = [
      "",
      "un",
      "deux",
      "trois",
      "quatre",
      "cinq",
      "six",
      "sept",
      "huit",
      "neuf",
    ];
    const dizaines = [
      "",
      "dix",
      "vingt",
      "trente",
      "quarante",
      "cinquante",
      "soixante",
    ];
    const dizainesSpeciales = [
      "dix",
      "onze",
      "douze",
      "treize",
      "quatorze",
      "quinze",
      "seize",
    ];

    function convertMoinsDeCent(n) {
      if (n < 10) return unites[n];
      if (n < 17) return dizainesSpeciales[n - 10];
      if (n < 20) return "dix-" + unites[n - 10];
      if (n < 70) {
        const dizaine = Math.floor(n / 10);
        const unite = n % 10;
        return (
          dizaines[dizaine] +
          (unite === 1 ? "-et-un" : unite > 0 ? "-" + unites[unite] : "")
        );
      }
      if (n < 80) return "soixante-" + convertMoinsDeCent(n - 60);
      if (n < 100)
        return (
          "quatre-vingt" + (n === 80 ? "s" : "-" + convertMoinsDeCent(n - 80))
        );
      return "";
    }

    function convertMoinsDeMille(n) {
      if (n < 100) return convertMoinsDeCent(n);
      const centaine = Math.floor(n / 100);
      const reste = n % 100;
      return (
        (centaine === 1
          ? "cent"
          : unites[centaine] + " cent" + (reste === 0 ? "s" : "")) +
        (reste > 0 ? " " + convertMoinsDeCent(reste) : "")
      );
    }

    function convertir(n) {
      if (n === 0) return "zéro";
      if (n < 1000) return convertMoinsDeMille(n);
      const mille = Math.floor(n / 1000);
      const reste = n % 1000;
      return (
        (mille === 1 ? "mille" : convertMoinsDeMille(mille) + " mille") +
        (reste > 0 ? " " + convertMoinsDeMille(reste) : "")
      );
    }

    return convertir(Math.floor(n)).trim();
  };

  const data = useQuery({
    queryKey: ["fournisseursStatistiques", fournisseur],
    queryFn: async () => {
      const response = await axios.get("/api/fournisseurs/statistiques", {
        params: {
          fournisseurId: fournisseur.id,
        },
      });
      setBonLivraisons(response.data.bonLivraisons);
      setReglements(response.data.reglements);
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

  function getTopProduits(bonLivraisons, sortKey = "montant", startDate, endDate) {
    const stats = {};

    bonLivraisons.forEach(bl => {
      // Filtrer par période si les dates sont fournies
      if (startDate || endDate) {
        const blDate = bl.date ? new Date(bl.date) : null;
        if (blDate) {
          if (startDate && blDate < new Date(startDate)) return;
          if (endDate) {
            const endDateObj = new Date(endDate);
            endDateObj.setHours(23, 59, 59, 999);
            if (blDate > endDateObj) return;
          }
        }
      }

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
      });
  }
  const topProduits = useMemo(() => {
    const produits = getTopProduits(bonLivraisons, sortKey, startDateProduits, endDateProduits);
    console.log("topProduits", produits);
    return produits;
  }, [bonLivraisons, sortKey, startDateProduits, endDateProduits]);

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

  // Filtrer les règlements par période
  const reglementsFiltres = useMemo(() => {
    if (!startDateReglements && !endDateReglements) return reglements;
    
    return reglements.filter(reglement => {
      const reglementDate = reglement.dateReglement ? new Date(reglement.dateReglement) : null;
      if (!reglementDate) return false;
      
      if (startDateReglements) {
        const start = new Date(startDateReglements);
        start.setHours(0, 0, 0, 0);
        if (reglementDate < start) return false;
      }
      
      if (endDateReglements) {
        const end = new Date(endDateReglements);
        end.setHours(23, 59, 59, 999);
        if (reglementDate > end) return false;
      }
      
      return true;
    });
  }, [reglements, startDateReglements, endDateReglements]);

  const getStatusPrelevementLabel = statusPrelevement => {
    if (!statusPrelevement) return "—";
    switch (statusPrelevement) {
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

  const getStatusPrelevementColor = statusPrelevement => {
    if (!statusPrelevement) return "bg-gray-100 text-gray-700";
    switch (statusPrelevement) {
      case "en_attente":
        return "bg-amber-100 text-amber-700";
      case "confirme":
        return "bg-green-100 text-green-700";
      case "echoue":
        return "bg-red-100 text-red-700";
      case "reporte":
        return "bg-amber-100 text-amber-700";
      case "refuse":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
                        <Package className="h-4 w-4 text-white" />
                      </div>
                      Produits achetés ({topProduits.length})
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Select value={sortKey} onValueChange={setSortKey}>
                        <SelectTrigger className="max-w-[120px] focus:ring-2 focus:ring-purple-500">
                          <SelectValue placeholder="Trier par" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="montant">Montant</SelectItem>
                          <SelectItem value="quantite">Quantité</SelectItem>
                        </SelectContent>
                      </Select>
                      <PrintReportButton
                        variant="outline"
                        size="sm"
                        data={{
                          fournisseur,
                          produits: topProduits,
                          periode: periodeProduits,
                          startDate: startDateProduits,
                          endDate: endDateProduits,
                          sortKey,
                        }}
                        localStorageKey="fournisseur-produits-rapport"
                        targetRoute="/fournisseurs/imprimer-produits"
                        openInNewTab={true}
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 !text-white rounded-full"
                      >
                        Imprimer
                      </PrintReportButton>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="periode-produits" className="text-sm font-medium">
                      Période
                    </Label>
                    <Select value={periodeProduits} onValueChange={setPeriodeProduits}>
                      <SelectTrigger className="focus:ring-2 focus:ring-purple-500">
                        <SelectValue placeholder="Sélectionnez la période" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aujourd'hui">
                          Aujourd&apos;hui
                        </SelectItem>
                        <SelectItem value="ce-mois">Ce mois</SelectItem>
                        <SelectItem value="mois-dernier">
                          Le mois dernier
                        </SelectItem>
                        <SelectItem value="trimestre-actuel">
                          Trimestre actuel
                        </SelectItem>
                        <SelectItem value="trimestre-precedent">
                          Trimestre précédent
                        </SelectItem>
                        <SelectItem value="cette-annee">Cette année</SelectItem>
                        <SelectItem value="annee-derniere">
                          L&apos;année dernière
                        </SelectItem>
                        <SelectItem value="personnalisee">
                          Période personnalisée
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {periodeProduits === "personnalisee" && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="date-produits"
                        className="text-sm font-medium"
                      >
                        Date :
                      </Label>
                      <CustomDateRangePicker
                        startDate={startDateProduits}
                        setStartDate={setStartDateProduits}
                        endDate={endDateProduits}
                        setEndDate={setEndDateProduits}
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {data.isLoading ? (
                  <div className="flex justify-center w-full py-12">
                    <Spinner />
                  </div>
                ) : topProduits.length > 0 ? (
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-gradient-to-r from-zinc-50 to-zinc-100 border-b z-10">
                        <TableRow>
                          <TableHead className="font-semibold">#</TableHead>
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
                            key={produit.produitId || index}
                            className="hover:bg-purple-50 transition-colors"
                          >
                            <TableCell className="font-medium text-sm text-muted-foreground">
                              {index + 1}
                            </TableCell>
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
                    {startDateProduits || endDateProduits ? (
                      <p className="text-sm mt-2">
                        Aucun produit trouvé pour la période sélectionnée
                      </p>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Règlements */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-zinc-50 to-zinc-100 border-b">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-purple-500 flex items-center justify-center">
                        <Receipt className="h-4 w-4 text-white" />
                      </div>
                      Règlements ({reglementsFiltres.length})
                    </CardTitle>
                    <PrintReportButton
                      variant="outline"
                      size="sm"
                      data={{
                        fournisseur,
                        reglements: reglementsFiltres,
                        bonLivraisons,
                        periode: periodeReglements,
                        startDate: startDateReglements,
                        endDate: endDateReglements,
                      }}
                      localStorageKey="fournisseur-reglements-rapport"
                      targetRoute="/fournisseurs/imprimer-reglements"
                      openInNewTab={true}
                      className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
                    >
                      Imprimer
                    </PrintReportButton>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="periode-reglements" className="text-sm font-medium">
                      Période
                    </Label>
                    <Select value={periodeReglements} onValueChange={setPeriodeReglements}>
                      <SelectTrigger className="focus:ring-2 focus:ring-purple-500">
                        <SelectValue placeholder="Sélectionnez la période" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aujourd'hui">
                          Aujourd&apos;hui
                        </SelectItem>
                        <SelectItem value="ce-mois">Ce mois</SelectItem>
                        <SelectItem value="mois-dernier">
                          Le mois dernier
                        </SelectItem>
                        <SelectItem value="trimestre-actuel">
                          Trimestre actuel
                        </SelectItem>
                        <SelectItem value="trimestre-precedent">
                          Trimestre précédent
                        </SelectItem>
                        <SelectItem value="cette-annee">Cette année</SelectItem>
                        <SelectItem value="annee-derniere">
                          L&apos;année dernière
                        </SelectItem>
                        <SelectItem value="personnalisee">
                          Période personnalisée
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {periodeReglements === "personnalisee" && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="date-reglements"
                        className="text-sm font-medium"
                      >
                        Date :
                      </Label>
                      <CustomDateRangePicker
                        startDate={startDateReglements}
                        setStartDate={setStartDateReglements}
                        endDate={endDateReglements}
                        setEndDate={setEndDateReglements}
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  {data.isLoading ? (
                    <div className="flex justify-center w-full py-12">
                      <Spinner />
                    </div>
                  ) : reglementsFiltres.length > 0 ? (
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
                          <TableHead className="font-semibold text-center">
                            Statut
                          </TableHead>
                          <TableHead className="font-semibold text-right">
                            Montant
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reglementsFiltres?.map((reglement, index) => (
                          <TableRow
                            key={reglement.id || index}
                            className="hover:bg-purple-50 transition-colors"
                          >
                            <TableCell className="text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {formatDate(reglement.dateReglement)}
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
                              {(reglement.methodePaiement === "cheque" ||
                                reglement.methodePaiement === "traite") ? (
                                <Badge
                                  variant="secondary"
                                  className={`text-xs cursor-pointer ${
                                    reglement.methodePaiement === "cheque"
                                      ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                                      : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                  }`}
                                  onClick={() => {
                                    setSelectedReglementForCheque(reglement);
                                    setChequeDialogOpen(true);
                                  }}
                                >
                                  {reglement.methodePaiement === "cheque"
                                    ? "Chèque"
                                    : "Traite"}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-gray-100 text-gray-800"
                                >
                                  {reglement.methodePaiement === "espece"
                                    ? "Espèce"
                                    : reglement.methodePaiement === "versement"
                                    ? "Versement"
                                    : reglement.methodePaiement}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="secondary"
                                className={`text-xs ${getStatusPrelevementColor(
                                  reglement.statusPrelevement
                                )}`}
                              >
                                {getStatusPrelevementLabel(
                                  reglement.statusPrelevement
                                )}
                              </Badge>
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
                      {startDateReglements || endDateReglements ? (
                        <p className="text-sm mt-2">
                          Aucun règlement trouvé pour la période sélectionnée
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>

      {/* Dialog pour afficher les détails du chèque/traite */}
      <Dialog open={chequeDialogOpen} onOpenChange={setChequeDialogOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-y-auto p-0">
          {selectedReglementForCheque && (
            <div className="space-y-4 p-6">
              <DialogHeader className="text-center pb-4">
                <DialogTitle className="text-2xl font-bold">
                  {selectedReglementForCheque.methodePaiement === "cheque"
                    ? "CHÈQUE BANCAIRE"
                    : "TRAITE"}
                </DialogTitle>
              </DialogHeader>

              {/* Simulation d'un vrai chèque en format horizontal inspiré du design européen */}
              <div className="border-2 border-gray-800 bg-white p-8 shadow-2xl relative overflow-hidden min-h-[280px]">
                {/* Bordures décoratives avec points */}
                <div className="absolute top-0 left-0 right-0 h-1 border-b border-dotted border-gray-400"></div>
                <div className="absolute bottom-0 left-0 right-0 h-1 border-t border-dotted border-gray-400"></div>
                <div className="absolute left-0 top-0 bottom-0 w-1 border-r border-dotted border-gray-400"></div>
                <div className="absolute right-0 top-0 bottom-0 w-1 border-l border-dotted border-gray-400"></div>

                {/* Lignes de sécurité en arrière-plan */}
                <div
                  className="absolute inset-0 opacity-[0.02] pointer-events-none"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 11px)",
                  }}
                ></div>

                <div className="relative z-10 h-full flex flex-col">
                  {/* En-tête - Top section */}
                  <div className="flex justify-between items-start mb-6">
                    {/* Top Left - Compte bancaire */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-400">
                        <LandmarkIcon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="text-xs text-gray-700">
                        <div className="text-[10px] text-gray-600">
                          Compte bancaire
                        </div>
                        <div className="font-bold text-sm mb-0.5 text-gray-900 uppercase">
                          {selectedReglementForCheque.compte}
                        </div>
                      </div>
                    </div>

                    {/* Top Right - Numéro et Date */}
                    <div className="text-left flex gap-4">
                      <div className="text-[10px] text-gray-600 mb-1 font-medium uppercase">
                        Date de création: <br />
                        <span className="font-bold text-sm text-gray-900">
                          {formatDate(selectedReglementForCheque.dateReglement)}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-600 mb-1 font-medium uppercase">
                        Date de prélèvement: <br />
                        <span className="font-bold text-sm text-gray-900">
                          {formatDate(
                            selectedReglementForCheque.datePrelevement
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle section - Bénéficiaire et Montant */}
                  <div className="flex justify-between items-start mb-6 gap-8">
                    {/* Left - Pay to the order of */}
                    <div className="flex-1">
                      <div className="text-[10px] text-gray-600 mb-1 font-medium uppercase tracking-wide">
                        PAYEZ À L&apos;ORDRE DE
                      </div>
                      <div className="text-xl font-extrabold border-b-2 border-gray-900 pb-2 uppercase tracking-wide min-h-[2.5rem] flex items-end">
                        {selectedReglementForCheque.fournisseur?.nom ||
                          fournisseur?.nom}
                      </div>
                    </div>

                    {/* Right - Montant numérique */}
                    <div className="flex items-center gap-2">
                      <div className="border-2 border-gray-900 px-4 py-2 min-w-[150px]">
                        <div className="text-2xl font-extrabold text-gray-900 text-right">
                          {selectedReglementForCheque.montant.toFixed(2)} DH
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Montant en lettres */}
                  <div className="mb-6">
                    <div className="text-base font-bold border-b-2 border-gray-900 pb-2 min-h-[2rem] flex items-end tracking-wide">
                      {nombreEnLettres(selectedReglementForCheque.montant)}{" "}
                      <span className="ml-2">dirhams</span>
                    </div>
                  </div>

                  {/* Bottom section */}
                  <div className="flex justify-between items-end mt-auto pt-4">
                    {/* Bottom Left - FOR/Motif */}
                    <div className="flex-1">
                      <div className="text-[10px] text-gray-600 mb-1 font-medium uppercase">
                        Motif :
                      </div>
                      <div className="text-sm font-semibold pb-1 text-gray-800 min-h-[1.5rem]">
                        {selectedReglementForCheque.motif || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Ligne MICR en bas */}
                  <div className="mt-4 pt-3 border-t border-dashed border-gray-400">
                    <div className="text-[30px] text-gray-600 font-mono tracking-widest text-center">
                      ⑆ {selectedReglementForCheque.cheque?.numero || "—"} ⑆
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  className="rounded-full"
                  variant="outline"
                  onClick={() => {
                    setChequeDialogOpen(false);
                    setSelectedReglementForCheque(null);
                  }}
                >
                  Fermer
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
