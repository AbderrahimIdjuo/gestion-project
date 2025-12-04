"use client";
import { CustomDatePicker } from "@/components/customUi/customDatePicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";

export default function PaiementFournisseurDialog({
  fournisseur,
  isOpen,
  onClose,
}) {
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
    } else if (value === "versement" || value === "cheque") {
      // Pour les versements, utiliser le premier compte bancaire disponible (pas caisse)
      const compteBancaire = comptes.data?.find(c => c.compte !== "caisse");
      if (compteBancaire) {
        setValue("compte", compteBancaire.compte);
      }
    }
  };
  const queryClient = useQueryClient();

  const createTransaction = useMutation({
    mutationFn: async data => {
      const { compte, montant, typePaiement, numero, motif } = data;
      const transData = {
        fournisseurId: fournisseur.id,
        compte,
        description: "bénéficiaire :" + fournisseur.nom,
        lable: "paiement fournisseur",
        montant,
        type: "depense",
        methodePaiement: typePaiement,
        numeroCheque: numero,
        dateReglement: date,
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
      queryClient.invalidateQueries(["transactions"]);
      queryClient.invalidateQueries({ queryKey: ["bonLivraison"] });
      queryClient.invalidateQueries({ queryKey: ["statistiques"] });
    },
  });
  const onSubmit = async data => {
    createTransaction.mutate(data);
    console.log("data:", data);
    onClose();
    reset();
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Paiement en faveur de {fournisseur?.nom}</DialogTitle>
            <DialogDescription>
              Sélectionnez le type de paiement et remplissez les détails
              nécessaires.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <RadioGroup
              value={watch("typePaiement")}
              onValueChange={value => {
                reset();
                handleTypePaiementChange(value);
                setDate(null);
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
              <div className="space-y-4 items-end grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <SelectItem key={element.id} value={element.compte}>
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
              </div>
            )}

            {watch("typePaiement") === "versement" && (
              <div className="space-y-4 items-end grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="w-full space-y-1.5">
                  <Label htmlFor="dateCreation">Date de création : </Label>
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
                          <SelectItem key={element.id} value={element.compte}>
                            <div className="flex items-center gap-2">
                              {element.compte}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid w-full items-center gap-2 sm:col-span-2 lg:col-span-3">
                  <Label htmlFor="numero">Numéro de versement bancaire</Label>
                  <Input
                    {...register("numero")}
                    className="w-full focus-visible:ring-purple-500"
                    id="numero"
                  />
                </div>
              </div>
            )}

            {watch("typePaiement") === "cheque" && (
              <div className="space-y-4 items-end grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="w-full space-y-1.5">
                  <Label htmlFor="dateCreation">Date de création : </Label>
                  <CustomDatePicker date={date} onDateChange={setDate} />
                </div>
                <div className="w-full space-y-1.5">
                  <Label htmlFor="datePrelevement">Date de prélèvement: </Label>
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
                          <SelectItem key={element.id} value={element.compte}>
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
              </div>
            )}
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="motif">Motif du paiement</Label>
              <Input
                {...register("motif")}
                className="w-full focus-visible:ring-purple-500"
                id="motif"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="bg-[#00e701] hover:bg-[#00e701] shadow-lg hover:scale-105 text-white text-md rounded-full font-bold transition-all duration-300 transform"
              type="submit"
              disabled={isSubmiting}
            >
              {isSubmiting ? "En cours..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
