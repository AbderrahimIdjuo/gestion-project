"use client";

import ComboBoxFournisseur from "@/components/comboBox-fournisseurs";
import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/functions";
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
import { ChevronDown, FileText, Printer, X } from "lucide-react";
import { useEffect, useState } from "react";

function formatDate(dateString) {
  return dateString?.split("T")[0].split("-").reverse().join("-");
}
export default function BonLivraisonRapportDialog() {
  const [comboKey, setComboKey] = useState(0); // aide a remount de comboboxFournisseur
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [formData, setFormData] = useState({
    type: "tous",
    periode: "ce-mois",
    statutPaiement: ["impaye", "enPartie"],
  });
  function getDateRangeFromPeriode(periode) {
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
          from: startDate ? new Date(startDate) : null,
          to: endDate ? new Date(endDate) : null,
        };
      default:
        return {
          from: null,
          to: null,
        };
    }
  }
  const handleSubmit = e => {
    e.preventDefault();
    console.log("Rapport soumis:", { ...formData, date });
    // Ici vous pouvez ajouter la logique pour sauvegarder le rapport
    setOpen(false);
    // Reset form
    setFormData({ titre: "", type: "", description: "", priorite: "" });
    setDate(undefined);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const Types = [
    { Label: "Tous", Value: "tous", Color: "bg-amber-500" },
    { Label: "Achats", Value: "achats", Color: "bg-green-500" },
    { Label: "Retour", Value: "retour", Color: "bg-red-500" },
  ];

  const reset = () => {
    setFormData({
      type: "tous",
      periode: "ce-mois",
      statutPaiement: ["impaye", "enPartie"],
    });
    setSelectedFournisseur(null);
    setComboKey(prev => prev + 1);
    setStartDate(null);
    setEndDate(null);
    setCurrentStep(1);
  };
  const handleStatutPaiementChange = (statut, checked) => {
    setFormData(prev => ({
      ...prev,
      statutPaiement: checked
        ? [...prev.statutPaiement, statut]
        : prev.statutPaiement.filter(s => s !== statut),
    }));
  };

  const removeStatutPaiement = statut => {
    setFormData(prev => ({
      ...prev,
      statutPaiement: prev.statutPaiement.filter(s => s !== statut),
    }));
  };

  const { from, to } = getDateRangeFromPeriode(formData.periode);
  
  // Query pour récupérer les BL et règlements
  const bonLivraisons = useQuery({
    queryKey: [
      "bonLivraisons-rapport",
      formData.type,
      formData.periode,
      formData.statutPaiement,
      startDate,
      endDate,
      selectedFournisseur,
    ],
    queryFn: async () => {
      const response = await axios.get("/api/bonLivraison/rapport", {
        params: {
          type: formData.type,
          periode: formData.periode,
          fournisseurId: selectedFournisseur?.id || null,
          statutPaiement: formData.statutPaiement.join("-"),
          from: from?.toISOString() ?? null,
          to: to?.toISOString() ?? null,
        },
      });
      console.log("bonLivraison rapport", response.data.bonLivraison);
      return response.data.bonLivraison;
    },
    enabled: currentStep === 2,
  });

  // Query pour récupérer les règlements dans la période
  const reglements = useQuery({
    queryKey: [
      "reglements-rapport",
      selectedFournisseur?.id,
      from?.toISOString(),
      to?.toISOString(),
    ],
    queryFn: async () => {
      const response = await axios.get("/api/reglement", {
        params: {
          fournisseurId: selectedFournisseur?.id || undefined,
          from: from?.toISOString() ?? null,
          to: to?.toISOString() ?? null,
          limit: 10000, // Récupérer tous les règlements
        },
      });
      return response.data.reglements || [];
    },
    enabled: currentStep === 2,
  });

  // Fonction pour calculer la dette initiale
  // Formule: dette initiale = dette finale + les règlements + les retours - les fournitures
  function calculerDetteInitiale() {
    const bls = bonLivraisons?.data || [];
    const regs = reglements?.data || [];
    
    // Calculer la dette finale (somme des montants restants des BL impayés et enPartie)
    const detteFinale = calculerDetteFinale();
    
    // Calculer la somme des règlements dans la période
    const totalReglements = regs.reduce((acc, reg) => acc + (reg.montant || 0), 0);
    
    // Calculer la somme des retours dans la période
    const totalRetours = bls
      .filter(bl => bl.type === "retour")
      .reduce((acc, bl) => acc + (bl.total || 0), 0);
    
    // Calculer la somme des fournitures (achats) dans la période
    const totalFournitures = bls
      .filter(bl => bl.type === "achats")
      .reduce((acc, bl) => acc + (bl.total || 0), 0);
    
    // Formule: dette initiale = dette finale + règlements + retours - fournitures
    const detteInit = detteFinale + totalReglements + totalRetours - totalFournitures;
    
    return detteInit;
  }
  function total() {
    return bonLivraisons?.data
      .reduce((acc, bon) => {
        if (bon.type === "achats") {
          return acc + bon.total;
        } else if (bon.type === "retour") {
          return acc - bon.total;
        }
        return acc; // autres types ignorés
      }, 0)
      .toFixed(2);
  }

  function totalPaye() {
    return bonLivraisons?.data
      .reduce((acc, bon) => acc + bon.totalPaye, 0)
      .toFixed(2);
  }

  function rest() {
    return (total() - totalPaye()).toFixed(2);
  }

  // Fonction pour calculer la dette finale : somme des montants restants des BL impayés et enPartie
  function calculerDetteFinale() {
    const bls = bonLivraisons?.data || [];
    let dette = 0;

    bls.forEach(bl => {
      // Vérifier si le BL est impayé ou enPartie
      const reste = bl.total - (bl.totalPaye || 0);
      
      // Si le BL est impayé (totalPaye = 0 ou null), prendre le montant total
      // Si le BL est enPartie (totalPaye > 0 mais < total), prendre le reste
      if (reste > 0) {
        dette += reste;
      }
    });

    return dette;
  }

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open]);

  // Fonction pour fusionner et trier les BL et règlements par date
  const mergeAndSortTransactions = () => {
    const bls = bonLivraisons?.data || [];
    const regs = reglements?.data || [];
    // Calculer la dette initiale (même sans fournisseur sélectionné)
    const detteInit = calculerDetteInitiale();

    // Transformer les BL en objets de transaction
    const blTransactions = bls.map(bl => ({
      id: bl.id,
      type: "bonLivraison",
      blType: bl.type, // "achats" ou "retour"
      date: new Date(bl.date),
      fournisseur: bl.fournisseur?.nom || "Inconnu",
      montant: bl.total, // Montant total (toujours positif)
      reference: bl.numero || bl.reference,
      total: bl.total,
      totalPaye: bl.totalPaye,
    }));

    // Transformer les règlements en objets de transaction
    const regTransactions = regs.map(reg => ({
      id: reg.id,
      type: "reglement",
      date: new Date(reg.dateReglement),
      fournisseur: reg.fournisseur?.nom || "Inconnu",
      montant: reg.montant,
      reference: reg.id.substring(0, 8),
    }));

    // Fusionner et trier par date
    const allTransactions = [...blTransactions, ...regTransactions].sort(
      (a, b) => a.date - b.date
    );

    // Calculer la dette au fur et à mesure (même sans fournisseur sélectionné)
    let runningDette = detteInit;
    return allTransactions.map(transaction => {
      // Calculer la dette pour toutes les transactions
      if (transaction.type === "bonLivraison") {
        // Pour un BL de type "achats", on augmente la dette
        // Pour un BL de type "retour", on diminue la dette
        if (transaction.blType === "achats") {
          runningDette += transaction.montant;
        } else if (transaction.blType === "retour") {
          runningDette -= transaction.montant;
        }
      } else if (transaction.type === "reglement") {
        // Pour un règlement, on diminue la dette
        runningDette -= transaction.montant;
      }
      return {
        ...transaction,
        runningDette: runningDette,
      };
    });
  };

  function regrouperBLParFournisseur(bonLivraisons) {
    // if (!Array.isArray(bonLivraisons)) {
    //   throw new TypeError("bonLivraisons doit être un tableau.");
    // }
  if (!Array.isArray(bonLivraisons)) {
    return []; // Pas de données -> tableau vide
  }
    const map = new Map();

    for (const bl of bonLivraisons) {
      const nom = bl.fournisseur?.nom ?? "Inconnu";
      const total = bl.total || 0;
      const totalPaye = bl.totalPaye || 0;
      const isAchat = bl.type === "achats";
      const isRetour = bl.type === "retour";

      if (!map.has(nom)) {
        map.set(nom, {
          fournisseur: nom,
          NbrBL: 1,
          NbrBLAchats: isAchat ? 1 : 0,
          NbrBLRetour: isRetour ? 1 : 0,
          total: isAchat ? total : -total,
          montantAchats: isAchat ? total : 0,
          montantRetour: isRetour ? total : 0,
          montantPaye: totalPaye,
        });
      } else {
        const existing = map.get(nom);
        existing.NbrBL += 1;
        existing.total += isAchat ? total : -total;
        existing.montantPaye += totalPaye;

        if (isAchat) {
          existing.montantAchats += total;
          existing.NbrBLAchats += 1;
        }
        if (isRetour) {
          existing.montantRetour += total;
          existing.NbrBLRetour += 1;
        }
      }
    }

    return Array.from(map.values());
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 rounded-full">
          <FileText className="mr-2 h-4 w-4" />
          Rapport
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-fuchsia-600 to-violet-600 bg-clip-text text-transparent">
            <FileText className="h-5 w-5 text-purple-600" />
            Rapport des achats
          </DialogTitle>
          <DialogDescription>
            {currentStep === 1
              ? " Remplissez les informations ci-dessous pour créer votre rapport."
              : ""}
          </DialogDescription>
        </DialogHeader>
        {currentStep === 1 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="w-full space-y-2">
                <ComboBoxFournisseur
                  key={comboKey}
                  fournisseur={selectedFournisseur}
                  setFournisseur={setSelectedFournisseur}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">
                  Type
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={value => handleInputChange("type", value)}
                  required
                >
                  <SelectTrigger className="focus:ring-2 focus:ring-purple-500">
                    <SelectValue placeholder="Sélectionnez le type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Types.map(type => (
                      <SelectItem key={type.Value} value={type.Value}>
                        <span className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${type.Color}`}
                          ></div>
                          {type.Label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Statut de paiement
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-left font-normal focus:ring-2 focus:ring-purple-500 bg-transparent"
                    >
                      <div className="flex flex-wrap gap-1">
                        {formData?.statutPaiement?.length === 0 ? (
                          <span className="text-muted-foreground">
                            Sélectionner les statuts
                          </span>
                        ) : (
                          formData.statutPaiement?.map(statut => (
                            <Badge
                              key={statut}
                              variant="secondary"
                              className={`text-xs  ${
                                statut === "paye"
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : statut === "impaye"
                                  ? "bg-red-100 text-red-800 hover:bg-red-200"
                                  : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                              }`}
                            >
                              {statut === "paye"
                                ? "Payé"
                                : statut === "impaye"
                                ? "Impayé"
                                : "En partie"}
                              <X
                                className="ml-1 h-3 w-3 cursor-pointer hover:text-purple-600"
                                onClick={e => {
                                  e.stopPropagation();
                                  removeStatutPaiement(statut);
                                }}
                              />
                            </Badge>
                          ))
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-3" align="start">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="paye"
                          checked={formData.statutPaiement?.includes("paye")}
                          onCheckedChange={checked =>
                            handleStatutPaiementChange("paye", checked)
                          }
                        />
                        <Label
                          htmlFor="paye"
                          className="text-sm font-medium cursor-pointer flex items-center gap-2"
                        >
                          {/* <div className="w-2 h-2 rounded-full bg-green-500"></div> */}
                          Payé
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="impaye"
                          checked={formData.statutPaiement?.includes("impaye")}
                          onCheckedChange={checked =>
                            handleStatutPaiementChange("impaye", checked)
                          }
                        />
                        <Label
                          htmlFor="impaye"
                          className="text-sm font-medium cursor-pointer flex items-center gap-2"
                        >
                          {/* <div className="w-2 h-2 rounded-full bg-red-500"></div> */}
                          Impayé
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="enPartie"
                          checked={formData.statutPaiement?.includes(
                            "enPartie"
                          )}
                          onCheckedChange={checked =>
                            handleStatutPaiementChange("enPartie", checked)
                          }
                        />
                        <Label
                          htmlFor="enPartie"
                          className="text-sm font-medium cursor-pointer flex items-center gap-2"
                        >
                          {/* <div className="w-2 h-2 rounded-full bg-orange-500"></div> */}
                          En partie
                        </Label>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periode" className="text-sm font-medium">
                  Période
                </Label>
                <Select
                  value={formData.periode}
                  onValueChange={value => handleInputChange("periode", value)}
                >
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
              {formData.periode === "personnalisee" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="statut"
                    className="col-span-1 text-left text-black"
                  >
                    Date :
                  </Label>

                  <CustomDateRangePicker
                    startDate={startDate}
                    setStartDate={setStartDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6 print:hidden">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className="rounded-full"
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                }}
                className="rounded-full"
              >
                Reset
              </Button>
              <Button
                className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
                variant="outline"
                onClick={() => {
                  console.log("Form Data:", {
                    formData,
                    selectedFournisseur,
                    startDate,
                    endDate,
                  });
                  setCurrentStep(2);
                }}
                type="submit"
              >
                Créer
              </Button>
            </div>
          </form>
        )}

        {currentStep === 2 && (
            // Rapport (avec ou sans fournisseur spécifique)
            <div>
              <div className="rounded-xl border shadow-sm overflow-x-auto">
                {bonLivraisons.isLoading || reglements.isLoading ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>Chargement des données...</p>
                  </div>
                ) : mergeAndSortTransactions().length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Fournisseur</TableHead>
                        <TableHead className="text-right">Fourniture</TableHead>
                        <TableHead className="text-right">Retour</TableHead>
                        <TableHead className="text-right">Règlement</TableHead>
                        <TableHead className="text-right">Dette</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Ligne de dette initiale */}
                      <TableRow className="bg-gray-700 text-white hover:!bg-gray-700 hover:!text-white border-b">
                        <TableCell className="px-1 py-2 font-semibold">
                          DETTE INITIALE
                        </TableCell>
                        <TableCell className="px-1 py-2"></TableCell>
                        <TableCell className="px-1 py-2 text-right"></TableCell>
                        <TableCell className="px-1 py-2 text-right"></TableCell>
                        <TableCell className="px-1 py-2 text-right"></TableCell>
                        <TableCell className="px-1 py-2 text-right pr-4 font-semibold">
                          {formatCurrency(calculerDetteInitiale())}
                        </TableCell>
                      </TableRow>
                      {/* Transactions */}
                      {mergeAndSortTransactions().map((transaction, index) => (
                        <TableRow key={`${transaction.type}-${transaction.id}-${index}`} className="border-b">
                          <TableCell className="px-1 py-2">
                            {formatDate(transaction.date.toISOString())}
                          </TableCell>
                          <TableCell className="px-1 py-2">
                            {transaction.fournisseur}
                          </TableCell>
                          <TableCell className="px-1 py-2 text-right pr-4">
                            {transaction.type === "bonLivraison" && transaction.blType === "achats" ? (
                              <span className="text-green-600">
                                {formatCurrency(transaction.montant)}
                              </span>
                            ) : (
                              ""
                            )}
                          </TableCell>
                          <TableCell className="px-1 py-2 text-right pr-4">
                            {transaction.type === "bonLivraison" && transaction.blType === "retour" ? (
                              <span className="text-red-600">
                                {formatCurrency(transaction.montant)}
                              </span>
                            ) : (
                              ""
                            )}
                          </TableCell>
                          <TableCell className="px-1 py-2 text-right pr-4">
                            {transaction.type === "reglement" ? (
                              <span className="text-blue-600">
                                {formatCurrency(transaction.montant)}
                              </span>
                            ) : (
                              ""
                            )}
                          </TableCell>
                          <TableCell
                            className={`px-1 py-2 text-right pr-4 font-semibold ${
                              transaction.runningDette >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(transaction.runningDette)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter className="bg-gray-50">
                      <TableRow className="border-b">
                        <TableCell
                          colSpan={5}
                          className="text-right text-lg font-semibold p-2"
                        >
                          Dette finale :
                        </TableCell>
                        <TableCell
                          className={`text-right text-lg font-semibold p-2 ${
                            calculerDetteFinale() >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(calculerDetteFinale())}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-14 mx-auto mb-4 opacity-50"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                      />
                    </svg>
                    <p>Aucune transaction trouvée</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6 print:hidden">
                <Button
                  className="rounded-full"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                >
                  Retour
                </Button>
                {mergeAndSortTransactions().length > 0 && (
                  <Button
                    className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
                    variant="outline"
                    onClick={() => {
                      // Sérialiser les transactions en convertissant les dates en chaînes
                      const transactions = mergeAndSortTransactions().map(transaction => ({
                        ...transaction,
                        date: transaction.date instanceof Date 
                          ? transaction.date.toISOString() 
                          : transaction.date,
                      }));

                      const data = {
                        from: from?.toISOString(),
                        to: to?.toISOString(),
                        transactions: transactions,
                        detteInitiale: calculerDetteInitiale(),
                        detteFinale: calculerDetteFinale(),
                        fournisseurNom: selectedFournisseur?.nom || null,
                      };

                      // Stocker les données AVANT d'ouvrir la fenêtre
                      localStorage.setItem(
                        "bonLivraison-rapport",
                        JSON.stringify(data)
                      );

                      // Ouvrir la fenêtre après avoir stocké les données
                      window.open(
                        `/achats/bonLivraison/imprimer-rapport`,
                        "_blank"
                      );
                    }}
                  >
                    <Printer className="mr-2 h-4 w-4" /> Imprimer
                  </Button>
                )}
              </div>
            </div>
          )}
      </DialogContent>
    </Dialog>
  );
}
