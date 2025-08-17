"use client";
import { addtransaction } from "@/app/api/actions";
import { CustomDatePicker } from "@/components/customUi/customDatePicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { CreditCard } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export function PaiementDialog({ isOpen, onClose, devis }) {
  const [date, setDate] = useState(null);

  const queryClient = useQueryClient();
  const {
    register,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

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
  const createTransaction = useMutation({
    mutationFn: async () => {
      const data = {
        ...watch(),
        numero: devis.numero,
        type: "recette",
        lable: "paiement devis",
        description: devis.numero + ", client :  " + devis.client.nom,
        date: date || new Date(),
        clientId: devis.client.id,
      };

      console.log("transData : ", data);
      const loadingToast = toast.loading("Paiement en cours...");
      try {
        await addtransaction(data);
        toast.success("Paiement éffectué avec succès");
      } catch (error) {
        toast.error("Échec de l'opération!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["transactions"]);
      queryClient.invalidateQueries(["devis"]);
    },
  });
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Paiement du devis {devis.numero}</DialogTitle>
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
                handleTypePaiementChange(value);
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

            {watch("typePaiement") === "espece" && (
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

            {watch("typePaiement") === "versement" && (
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

            {watch("typePaiement") === "cheque" && (
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

          <div className="mt-4 mb-2 flex justify-end">
            <Button
              className="bg-[#00e701] hover:bg-[#00e701] shadow-lg hover:scale-105 text-white text-md rounded-full font-bold transition-all duration-300 transform"
              onClick={() => {
                onClose();
                createTransaction.mutate();
              }}
              disabled={!watch("montant") || !watch("compte")}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Confirmer le paiement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
