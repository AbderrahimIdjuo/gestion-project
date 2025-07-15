"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, CalendarIcon, FileText, Send, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import ComboBoxFournisseur from "@/components/comboBox-fournisseurs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  const statutPaiements = [
    { Label: "En partie", Value: "enPartie", Color: "bg-amber-500" },
    { Label: "Payé", Value: "paye", Color: "bg-green-500" },
    { Label: "Impayé", Value: "impaye", Color: "bg-red-500" },
  ];

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
            Créer un nouveau rapport
          </DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous pour créer votre rapport.
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
                      <SelectItem value={type.Value}>
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
                              className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-200"
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
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
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
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          Impayé
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="en-partie"
                          checked={formData.statutPaiement?.includes(
                            "en-partie"
                          )}
                          onCheckedChange={(checked) =>
                            handleStatutPaiementChange("en-partie", checked)
                          }
                        />
                        <Label
                          htmlFor="en-partie"
                          className="text-sm font-medium cursor-pointer flex items-center gap-2"
                        >
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
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
                      L'année dernière
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

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="order-2 sm:order-1 rounded-full"
              >
                Annuler
              </Button>
              <Button
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
                className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:from-fuchsia-600 hover:via-purple-600 hover:to-violet-600 text-white font-semibold transition-all duration-300 order-1 sm:order-2 rounded-full"
              >
                <Send className="mr-2 h-4 w-4 " />
                Créer
              </Button>
            </DialogFooter>
          </form>
        )}

        {currentStep === 2 && <div>Step 2 Content</div>}
      </DialogContent>
    </Dialog>
  );
}
