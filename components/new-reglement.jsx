"use client";
import ComboBoxFournisseur from "@/components/comboBox-fournisseurs";
import { CustomDatePicker } from "@/components/customUi/customDatePicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
export default function NewReglementDialog() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);
  const [date, setDate] = useState(null);
  const [datePrelevement, setDatePrelevement] = useState(null);

  const {
    register,
    reset,
    watch,
    handleSubmit,
    setValue,
    formState: { errors, isSubmiting },
  } = useForm();
  // Initialiser automatiquement le compte selon le type de paiement
  const handleTypePaiementChange = value => {
    setValue("typePaiement", value);

    // Initialiser le compte selon le type de paiement
    if (value === "espece") {
      setValue("compte", "caisse");
    } else if (
      value === "versement" ||
      value === "cheque" ||
      value === "traite"
    ) {
      // Pour les versements, chèques et traites, utiliser le premier compte bancaire disponible (pas caisse)
      const compteBancaire = comptes.data?.find(c => c.compte !== "caisse");
      if (compteBancaire) {
        setValue("compte", compteBancaire.compte);
      }
    }
  };
  const queryClient = useQueryClient();

  const createTransaction = useMutation({
    mutationFn: async data => {
      const {
        compte,
        montant,
        typePaiement,
        numero,
        motif,
        fournisseur,
        dateReglement,
        datePrelevement,
      } = data;
      console.log("selectedFournisseur in mutationFn:", fournisseur);
      console.log("dateReglement in mutationFn:", dateReglement);
      console.log("datePrelevement in mutationFn:", datePrelevement);
      const transData = {
        fournisseurId: fournisseur?.id,
        compte,
        description: "bénéficiaire :" + fournisseur?.nom,
        lable: "paiement fournisseur",
        montant,
        type: "depense",
        methodePaiement: typePaiement,
        numeroCheque: numero,
        dateReglement: dateReglement,
        datePrelevement: datePrelevement,
        motif: motif,
      };
      console.log("transData", transData);
      const loadingToast = toast.loading("Paiement en cours...");
      try {
        const result = await axios.post(
          "/api/fournisseurs/paiement",
          transData
        );
        toast.success("Paiement éffectué avec succès");
        return result.data;
      } catch (error) {
        toast.error("Échec de l'opération!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["reglements"]);
      // Invalider aussi les notifications de prélèvements
      queryClient.invalidateQueries(["today-prelevements"]);
    },
  });
  const onSubmit = async data => {
    console.log("selectedFournisseur in onSubmit:", selectedFournisseur);

    // Passer selectedFournisseur et les dates dans les données de la mutation
    createTransaction.mutate({
      ...data,
      fournisseur: selectedFournisseur,
      dateReglement: date,
      datePrelevement: datePrelevement,
    });
    console.log("data:", data);
    setOpen(false);
    reset();
    setCurrentStep(1);
    setSelectedFournisseur(null);
    setDate(null);
    setDatePrelevement(null);
  };

  const resetDialog = () => {
    setCurrentStep(1);
    setSelectedFournisseur(null);
    setDate(null);
    setDatePrelevement(null);
    reset();
  };

  const handleNext = () => {
    if (selectedFournisseur) {
      setCurrentStep(2);
    } else {
      toast.error("Veuillez sélectionner un fournisseur");
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };
  const comptes = useQuery({
    queryKey: ["comptes"],
    queryFn: async () => {
      const response = await axios.get("/api/comptesBancaires");
      const comptes = response.data.comptes;
      return comptes;
    },
    onSuccess: data => {
      // Initialiser le compte par défaut si aucun type de paiement n'est sélectionné
      if (!watch("typePaiement") && data && data.length > 0) {
        // Par défaut, initialiser avec "espece" et "caisse"
        setValue("typePaiement", "espece");
        setValue("compte", "caisse");
      }
    },
  });

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .payment-form-animate {
          animation: fadeInUp 0.4s ease-out;
        }
      `}</style>
      <Dialog
        open={open}
        onOpenChange={isOpen => {
          setOpen(isOpen);
          if (!isOpen) {
            resetDialog();
          }
        }}
      >
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau règlement
          </Button>
        </DialogTrigger>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>
                {currentStep === 1
                  ? "Sélectionner le fournisseur"
                  : `Paiement en faveur de ${selectedFournisseur?.nom || ""}`}
              </DialogTitle>
              <DialogDescription>
                {currentStep === 1
                  ? "Choisissez le fournisseur pour lequel vous souhaitez effectuer un paiement."
                  : "Sélectionnez le type de paiement et remplissez les détails nécessaires."}
              </DialogDescription>
            </DialogHeader>

            {/* Stepper Indicator */}
            <div className="flex items-center justify-center py-6">
              <div className="flex items-center space-x-4">
                {/* Step 1 */}
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                      currentStep >= 1
                        ? "bg-purple-500 border-purple-500 text-white"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    {currentStep > 1 ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="font-semibold">1</span>
                    )}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      currentStep >= 1 ? "text-purple-600" : "text-gray-400"
                    }`}
                  >
                    Fournisseur
                  </span>
                </div>

                {/* Connector Line */}
                <div
                  className={`w-16 h-0.5 transition-all ${
                    currentStep >= 2 ? "bg-purple-500" : "bg-gray-300"
                  }`}
                />

                {/* Step 2 */}
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                      currentStep >= 2
                        ? "bg-purple-500 border-purple-500 text-white"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    <span className="font-semibold">2</span>
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      currentStep >= 2 ? "text-purple-600" : "text-gray-400"
                    }`}
                  >
                    Réglement
                  </span>
                </div>
              </div>
            </div>

            <div className="py-4 space-y-4">
              {/* Step 1: Fournisseur Selection */}
              {currentStep === 1 && (
                <div className="w-full space-y-4">
                  <div className="w-full space-y-2">
                    <ComboBoxFournisseur
                      fournisseur={selectedFournisseur}
                      setFournisseur={setSelectedFournisseur}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Payment Method and Details */}
              {currentStep === 2 && (
                <>
                  <RadioGroup
                    value={watch("typePaiement")}
                    onValueChange={value => {
                      reset();
                      handleTypePaiementChange(value);
                      setDate(null);
                      setDatePrelevement(null);
                      // setFormattedDate(null);
                      // setFormattedDatePrelevement(null);
                    }}
                    className="flex flex-wrap gap-3 justify-between sm:justify-evenly"
                  >
                    <div className="flex items-center space-x-2 rounded-md p-2">
                      <RadioGroupItem
                        value="espece"
                        id="espece"
                        className="text-green-600 "
                      />
                      <Label
                        htmlFor="espece"
                        className="text-green-600 font-medium cursor-pointer"
                      >
                        Espèce
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="versement"
                        id="versement"
                        className="text-sky-600"
                      />
                      <Label
                        htmlFor="versement"
                        className="text-sky-600 font-medium cursor-pointer"
                      >
                        Versement
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md p-2">
                      <RadioGroupItem
                        value="cheque"
                        id="cheque"
                        className="text-violet-600 "
                      />
                      <Label
                        htmlFor="cheque"
                        className="text-violet-600 font-medium cursor-pointer"
                      >
                        Chèque
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md p-2">
                      <RadioGroupItem
                        value="traite"
                        id="traite"
                        className="text-amber-600 "
                      />
                      <Label
                        htmlFor="traite"
                        className="text-amber-600 font-medium cursor-pointer"
                      >
                        Traite
                      </Label>
                    </div>
                  </RadioGroup>

                  {watch("typePaiement") === "espece" && (
                    <div className="space-y-4 items-end grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 payment-form-animate">
                      <div className="w-full space-y-1.5">
                        <Label htmlFor="client">Date : </Label>
                        <CustomDatePicker date={date} onDateChange={setDate} />
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="montant">Montant</Label>
                        <Input
                          {...register("montant", { valueAsNumber: true })}
                          className="w-full focus-visible:ring-purple-500"
                          id="montant"
                        />
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="compte">Compte bancaire</Label>
                        <Select
                          value={watch("compte")}
                          name="compte"
                          onValueChange={value => setValue("compte", value)}
                        >
                          <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500 mt-2">
                            <SelectValue placeholder="Séléctionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {comptes.data?.map(element => (
                              <SelectItem
                                key={element.id}
                                value={element.compte}
                              >
                                <div className="flex items-center gap-2">
                                  {element.compte}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.compte && (
                          <p className="text-red-500 text-sm">
                            {errors.compte.message}
                          </p>
                        )}
                      </div>
                      <div className="grid w-full items-center gap-2 sm:col-span-2 lg:col-span-4">
                        <Label htmlFor="motif">Motif du paiement</Label>
                        <Input
                          {...register("motif")}
                          className="w-full focus-visible:ring-purple-500"
                          id="motif"
                        />
                      </div>
                    </div>
                  )}

                  {watch("typePaiement") === "versement" && (
                    <div className="space-y-4 items-end grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 payment-form-animate">
                      <div className="w-full space-y-1.5">
                        <Label htmlFor="dateCreation">
                          Date de création :{" "}
                        </Label>
                        <CustomDatePicker date={date} onDateChange={setDate} />
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="montant">Montant</Label>
                        <Input
                          {...register("montant", { valueAsNumber: true })}
                          className="w-full focus-visible:ring-purple-500"
                          id="montant"
                        />
                      </div>
                      <div className="grid w-full items-center gap-2">
                        <Label htmlFor="compte">Compte bancaire</Label>
                        <Select
                          value={watch("compte")}
                          name="compte"
                          onValueChange={value => setValue("compte", value)}
                        >
                          <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                            <SelectValue placeholder="Séléctionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {comptes.data
                              ?.filter(c => c.compte !== "caisse")
                              .map(element => (
                                <SelectItem
                                  key={element.id}
                                  value={element.compte}
                                >
                                  <div className="flex items-center gap-2">
                                    {element.compte}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid w-full items-center gap-2 sm:col-span-2 lg:col-span-3">
                        <Label htmlFor="numero">
                          Numéro de versement bancaire
                        </Label>
                        <Input
                          {...register("numero")}
                          className="w-full focus-visible:ring-purple-500"
                          id="numero"
                        />
                      </div>
                      <div className="grid w-full items-center gap-2 sm:col-span-2 lg:col-span-4">
                        <Label htmlFor="motif">Motif du paiement</Label>
                        <Input
                          {...register("motif")}
                          className="w-full focus-visible:ring-purple-500"
                          id="motif"
                        />
                      </div>
                    </div>
                  )}

                  {watch("typePaiement") === "cheque" && (
                    <div className="space-y-4 items-end grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 payment-form-animate">
                      <div className="w-full space-y-1.5">
                        <Label htmlFor="dateCreation">
                          Date de création :{" "}
                        </Label>
                        <CustomDatePicker date={date} onDateChange={setDate} />
                      </div>
                      <div className="w-full space-y-1.5">
                        <Label htmlFor="datePrelevement">
                          Date de prélèvement:{" "}
                        </Label>
                        <CustomDatePicker
                          date={datePrelevement}
                          onDateChange={setDatePrelevement}
                        />
                      </div>
                      <div className="grid w-full items-center gap-2">
                        <Label htmlFor="montant">Montant</Label>
                        <Input
                          {...register("montant", { valueAsNumber: true })}
                          className="w-full focus-visible:ring-purple-500"
                          id="montant"
                        />
                      </div>
                      <div className="grid w-full items-center gap-2">
                        <Label htmlFor="compte">Compte bancaire</Label>
                        <Select
                          value={watch("compte")}
                          name="compte"
                          onValueChange={value => setValue("compte", value)}
                        >
                          <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                            <SelectValue placeholder="Séléctionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {comptes.data
                              ?.filter(c => c.compte !== "caisse")
                              .map(element => (
                                <SelectItem
                                  key={element.id}
                                  value={element.compte}
                                >
                                  <div className="flex items-center gap-2">
                                    {element.compte}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid w-full items-center gap-2 sm:col-span-2 lg:col-span-4">
                        <Label htmlFor="numero">Numéro de chèque</Label>
                        <Input
                          {...register("numero")}
                          className="w-full focus-visible:ring-purple-500"
                          id="numero"
                        />
                      </div>
                      <div className="grid w-full items-center gap-2 sm:col-span-2 lg:col-span-4">
                        <Label htmlFor="motif">Motif du paiement</Label>
                        <Input
                          {...register("motif")}
                          className="w-full focus-visible:ring-purple-500"
                          id="motif"
                        />
                      </div>
                    </div>
                  )}
                  {watch("typePaiement") === "traite" && (
                    <div className="space-y-4 items-end grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 payment-form-animate">
                      <div className="w-full space-y-1.5">
                        <Label htmlFor="dateCreation">
                          Date de création :{" "}
                        </Label>
                        <CustomDatePicker date={date} onDateChange={setDate} />
                      </div>
                      <div className="w-full space-y-1.5">
                        <Label htmlFor="datePrelevement">
                          Date de prélèvement:{" "}
                        </Label>
                        <CustomDatePicker
                          date={datePrelevement}
                          onDateChange={setDatePrelevement}
                        />
                      </div>
                      <div className="grid w-full items-center gap-2">
                        <Label htmlFor="montant">Montant</Label>
                        <Input
                          {...register("montant", { valueAsNumber: true })}
                          className="w-full focus-visible:ring-purple-500"
                          id="montant"
                        />
                      </div>
                      <div className="grid w-full items-center gap-2">
                        <Label htmlFor="compte">Compte bancaire</Label>
                        <Select
                          value={watch("compte")}
                          name="compte"
                          onValueChange={value => setValue("compte", value)}
                        >
                          <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                            <SelectValue placeholder="Séléctionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {comptes.data
                              ?.filter(c => c.compte !== "caisse")
                              .map(element => (
                                <SelectItem
                                  key={element.id}
                                  value={element.compte}
                                >
                                  <div className="flex items-center gap-2">
                                    {element.compte}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid w-full items-center gap-2 sm:col-span-2 lg:col-span-4">
                        <Label htmlFor="numero">Numéro de chèque</Label>
                        <Input
                          {...register("numero")}
                          className="w-full focus-visible:ring-purple-500"
                          id="numero"
                        />
                      </div>
                      <div className="grid w-full items-center gap-2 sm:col-span-2 lg:col-span-4">
                        <Label htmlFor="motif">Motif du paiement</Label>
                        <Input
                          {...register("motif")}
                          className="w-full focus-visible:ring-purple-500"
                          id="motif"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <DialogFooter>
              {currentStep === 1 ? (
                <Button
                  className="bg-purple-500 hover:bg-purple-600 text-white rounded-full"
                  type="button"
                  onClick={handleNext}
                  disabled={!selectedFournisseur}
                >
                  Suivant
                </Button>
              ) : (
                <div className="flex gap-2 w-full justify-end">
                  <Button
                    className="rounded-full"
                    variant="outline"
                    type="button"
                    onClick={handleBack}
                  >
                    Retour
                  </Button>
                  <Button
                    className="bg-[#00e701] hover:bg-[#00e701] shadow-lg hover:scale-105 text-white text-md rounded-full font-bold transition-all duration-300 transform"
                    type="submit"
                    disabled={isSubmiting}
                  >
                    {isSubmiting ? "En cours..." : "Confirmer"}
                  </Button>
                </div>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
