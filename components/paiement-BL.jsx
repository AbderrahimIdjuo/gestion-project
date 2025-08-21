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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";

export default function PaiementBLDialog({ bonLivraison, isOpen, onClose }) {
  const [date, setDate] = useState(null);

  const {
    register,
    reset,
    watch,
    handleSubmit,
    setValue,
    formState: { errors, isSubmiting },
  } = useForm();
  const queryClient = useQueryClient();

  const statutPaiement = montant => {
    const montantPaye = bonLivraison.totalPaye + montant;
    if (
      bonLivraison.total === montantPaye ||
      bonLivraison.total < montantPaye
    ) {
      return "paye";
    } else if (bonLivraison.total > montantPaye) {
      return "enPartie";
    }
  };

  const onSubmit = async data => {
    const { compte, montant, methodePaiement, numero } = data;
    const transData = {
      bonLivraisonId: bonLivraison.id,
      fournisseurId: bonLivraison.fournisseurId,
      compte,
      description: "bénéficiaire :" + bonLivraison.fournisseur,
      lable: "paiement de :" + bonLivraison.numero,
      montant,
      type: "depense",
      methodePaiement: methodePaiement,
      numeroCheque: numero,
      date,
      statutPaiement: statutPaiement(montant),
      reference: bonLivraison.numero,
    };
    console.log("Data", transData);

    toast.promise(
      (async () => {
        const response = await axios.post(
          "/api/bonLivraison/paiementBlUnique",
          transData
        );
        if (response.status === 409) {
          console.log("response.status === 409");
        }
        if (!response) {
          throw new Error("Failed to add paiement");
        }
        console.log("Opération effectuée avec succès");
        reset();
        onClose();
        queryClient.invalidateQueries(["transactions"]);
        queryClient.invalidateQueries({ queryKey: ["bonLivraison"] });
        queryClient.invalidateQueries({ queryKey: ["fournisseurs"] });
        queryClient.invalidateQueries({ queryKey: ["statistiques"] });
      })(),
      {
        loading: "Opération en cours...",
        success: "Opération effectuée avec succès",
        error: "Échec de l'opération!",
      }
    );
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
      if (!watch("methodePaiement") && data && data.length > 0) {
        // Par défaut, initialiser avec "espece" et "caisse"
        setValue("methodePaiement", "espece");
        setValue("compte", "caisse");
      }
    },
  });
  // Initialiser automatiquement le compte selon le type de paiement
  const handlemethodePaiementChange = value => {
    setValue("methodePaiement", value);

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Paiement du {bonLivraison?.numero}</DialogTitle>
            <DialogDescription>
              Sélectionnez le type de paiement et remplissez les détails
              nécessaires.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <RadioGroup
              value={watch("methodePaiement")}
              onValueChange={value => {
                reset();
                handlemethodePaiementChange(value);
                setDate(null);
              }}
              className="flex flex-row flex-wrap gap-4 justify-evenly"
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
            </RadioGroup>

            {watch("methodePaiement") === "espece" && (
              <div className="space-y-4 items-end grid grid-cols-3 gap-4">
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

            {watch("methodePaiement") === "versement" && (
              <div className="space-y-4 items-end grid grid-cols-3 gap-4">
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
              </div>
            )}
            
            {watch("methodePaiement") === "cheque" && (
              <div className="space-y-4 items-end grid grid-cols-3 grid-rows-2 gap-4">
                <div className="w-full space-y-1.5">
                  <Label htmlFor="client">Date : </Label>
                  <CustomDatePicker date={date} onDateChange={setDate} />
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
                <div className="grid w-full items-center gap-2 col-span-3">
                  <Label htmlFor="numero">Numéro de chèque</Label>
                  <Input
                    {...register("numero")}
                    className="w-full focus-visible:ring-purple-500"
                    id="numero"
                  />
                </div>
              </div>
            )}
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
