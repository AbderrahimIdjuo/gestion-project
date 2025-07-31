"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, ChevronDown, Printer } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import ComboBoxFournisseur from "@/components/comboBox-fournisseurs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import axios from "axios";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
  startOfQuarter,
  endOfQuarter,
  subQuarters,
} from "date-fns";

function formatDate(dateString) {
  return dateString?.split("T")[0].split("-").reverse().join("-");
}
export default function RapportDialog() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [formData, setFormData] = useState({
    type: "tous",
    periode: "ce-mois",
    statutPaiement: ["impaye"],
  });
  function getDateRangeFromPeriode(periode) {
    const now = new Date();

    switch (periode) {
      case "ce-mois":
        return {
          from: startOfMonth(now),
          to: endOfMonth(now),
        };
      case "3-derniers-mois":
        return {
          from: subMonths(startOfMonth(now), 2),
          to: endOfMonth(now),
        };
      case "6-derniers-mois":
        return {
          from: subMonths(startOfMonth(now), 5),
          to: endOfMonth(now),
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
      default:
        return {
          from: new Date(startDate) ?? null,
          to: new Date(endDate) ?? null,
        };
    }
  }
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Rapport soumis:", { ...formData, date });
    // Ici vous pouvez ajouter la logique pour sauvegarder le rapport
    setOpen(false);
    // Reset form
    setFormData({ titre: "", type: "", description: "", priorite: "" });
    setDate(undefined);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      statutPaiement: ["impaye"],
    });
    setSelectedFournisseur(null);
    setStartDate(null);
    setEndDate(null);
    setCurrentStep(1);
  };
  const handleStatutPaiementChange = (statut, checked) => {
    setFormData((prev) => ({
      ...prev,
      statutPaiement: checked
        ? [...prev.statutPaiement, statut]
        : prev.statutPaiement.filter((s) => s !== statut),
    }));
  };

  const removeStatutPaiement = (statut) => {
    setFormData((prev) => ({
      ...prev,
      statutPaiement: prev.statutPaiement.filter((s) => s !== statut),
    }));
  };

  const { from, to } = getDateRangeFromPeriode(formData.periode);
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
  });
  function total() {
    return bonLivraisons?.data.reduce((acc, bon) => {
      if (bon.type === "achats") {
        return acc + bon.total;
      } else if (bon.type === "retour") {
        return acc - bon.total;
      }
      return acc; // autres types ignorés
    }, 0);
  }

  function totalPaye() {
    return bonLivraisons?.data.reduce((acc, bon) => acc + bon.totalPaye, 0);
  }

  function rest() {
    return total() - totalPaye();
  }
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open]);
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
            {currentStep === 1
              ? "Créer un nouveau rapport"
              : "Aperçu du rapport"}
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
                  onValueChange={(value) => handleInputChange("type", value)}
                  required
                >
                  <SelectTrigger className="focus:ring-2 focus:ring-purple-500">
                    <SelectValue placeholder="Sélectionnez le type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Types.map((type) => (
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
                          formData.statutPaiement?.map((statut) => (
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
                                onClick={(e) => {
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
                          onCheckedChange={(checked) =>
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
                          onCheckedChange={(checked) =>
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
                          onCheckedChange={(checked) =>
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
                  onValueChange={(value) => handleInputChange("periode", value)}
                >
                  <SelectTrigger className="focus:ring-2 focus:ring-purple-500">
                    <SelectValue placeholder="Sélectionnez la période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ce-mois">Ce mois</SelectItem>
                    <SelectItem value="3-derniers-mois">
                      Les 3 derniers mois
                    </SelectItem>
                    <SelectItem value="6-derniers-mois">
                      Les 6 derniers mois
                    </SelectItem>
                    <SelectItem value="cette-annee">Cette année</SelectItem>
                    <SelectItem value="annee-derniere">
                      L&apos;année dernière
                    </SelectItem>
                    <SelectItem value="trimestre-actuel">
                      Trimestre actuel
                    </SelectItem>
                    <SelectItem value="trimestre-precedent">
                      Trimestre précédent
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
          <>
            <div className="rounded-xl border shadow-sm overflow-x-auto">
              {bonLivraisons.data?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Montant Payé</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bonLivraisons.data?.map((bon) => (
                      <TableRow key={bon.id}>
                        <TableCell>{formatDate(bon.date)}</TableCell>
                        <TableCell>{bon.reference}</TableCell>
                        <TableCell>{bon.fournisseur?.nom ?? "-"}</TableCell>
                        <TableCell>{bon.type}</TableCell>
                        <TableCell>{bon.total?.toFixed(2)} DH</TableCell>
                        <TableCell>{bon.totalPaye?.toFixed(2)} DH</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter className="bg-white">
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-right text-lg font-semibold p-2"
                      >
                        Total :
                      </TableCell>
                      <TableCell
                        colSpan={2}
                        className="text-left text-lg font-semibold p-2"
                      >
                        {total()} DH
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-t border-gray-200">
                      <TableCell
                        colSpan={4}
                        className="text-right text-lg font-semibold p-2"
                      >
                        Total Payé :
                      </TableCell>
                      <TableCell
                        colSpan={2}
                        className="text-left text-lg font-semibold p-2"
                      >
                        {totalPaye()} DH
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-t border-gray-200">
                      <TableCell
                        colSpan={4}
                        className="text-right text-lg font-semibold p-2"
                      >
                        Dette :
                      </TableCell>
                      <TableCell
                        colSpan={2}
                        className="text-left text-lg font-semibold p-2"
                      >
                        {rest()} DH
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
                  <p>Aucun bon trouvé</p>
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
              {bonLivraisons.data?.length > 0 && (
                <Button
                  className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
                  variant="outline"
                  onClick={() => {
                    const data = {
                      from: from?.toISOString(),
                      to: to?.toISOString(),
                      bons: bonLivraisons.data,
                      total: total().toFixed(2),
                      totalPaye: totalPaye().toFixed(2),
                      rest: rest().toFixed(2),
                      fournisseurNom: selectedFournisseur?.nom,
                    };
                    window.open(
                      `/achats/bonLivraison/imprimer-rapport`,
                      "_blank"
                    );
                    localStorage.setItem(
                      "bonLivraison-rapport",
                      JSON.stringify(data)
                    );
                  }}
                >
                  <Printer className="mr-2 h-4 w-4" /> Imprimer
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
