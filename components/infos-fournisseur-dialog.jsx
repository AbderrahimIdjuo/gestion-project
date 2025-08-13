"use client";

import Spinner from "@/components/customUi/Spinner";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  MapPin,
  Package,
  Phone,
  Receipt,
  Smartphone,
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

  return (
    <div className="p-8">
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[90vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Détails du Fournisseur
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 lg:grid-cols-2 gap-6 h-full">
            {/* Left Column - Informations Générales */}
            <div className="space-y-4 grid grid-cols-1 justify-items-stretch">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{fournisseur?.nom}</CardTitle>
                  <CardDescription></CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">ICE:</span>
                        <span>{fournisseur?.ice}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Téléphone:</span>
                        <span>{fournisseur?.telephone}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Mobile:</span>
                        <span>{fournisseur?.telephoneSecondaire}</span>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <span className="font-medium">Adresse:</span>
                          <p className="text-sm text-muted-foreground mt-1">
                            {fournisseur?.adresse}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top 5 Products */}
              <Card className="flex-1">
                <CardHeader className="grid grid-cols-5 items-center">
                  <CardTitle className="flex items-center gap-2 col-span-3">
                    <Package className="h-5 w-5" />
                    Top 5 des Produits Achetés
                  </CardTitle>
                  <div className="flex items-center justify-end gap-3 col-span-2 w-full">
                    <span className="font-medium">Trier par</span>

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
                <CardContent>
                  {data.isLoading ? (
                    <div className="flex justify-center w-full">
                      <Spinner />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produit</TableHead>
                          <TableHead className="text-center">Qté</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topProduits.map((produit, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium text-sm">
                              {produit.designation}
                            </TableCell>
                            <TableCell className="text-center">
                              {produit.quantite}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(produit.montant)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Statistiques */}
            <div className="space-y-4 grid grid-cols-1 justify-items-stretch">
              {/* Statistics Cards */}

              <div className="space-y-4 my-auto">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">
                      Dette en cours :
                    </span>
                  </div>
                  <Badge variant="destructive" className="text-lg px-3 py-1">
                    {formatCurrency(fournisseur?.dette)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      Chiffre d&apos;Affaires :
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-lg text-white bg-green-600 px-3 py-1"
                  >
                    {formatCurrency(chiffreAffaires)}
                  </Badge>
                </div>
              </div>

              {/* Recent Payments */}
              <Card className="flex-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Derniers Règlements
                    </CardTitle>
                    <div className="flex items-end gap-2">
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
                        className="flex items-center gap-2"
                      >
                        Imprimer
                      </PrintReportButton>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[500px] overflow-y-auto">
                    {data.isLoading ? (
                      <div className="flex justify-center w-full">
                        <Spinner />
                      </div>
                    ) : (
                      <Table id="reglements-table">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-left">Compte</TableHead>
                            <TableHead className="text-center">
                              M.Paiement
                            </TableHead>
                            <TableHead className="text-right">
                              Montant
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions?.map((reglement, index) => (
                            <TableRow key={index}>
                              <TableCell className="text-sm">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  {formatDate(reglement.date)}
                                </div>
                              </TableCell>
                              <TableCell className="text-left font-medium text-sm">
                                {reglement.compte?.replace("compte ", "")}
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
                              <TableCell className="text-right font-medium text-sm">
                                {formatCurrency(reglement.montant)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
