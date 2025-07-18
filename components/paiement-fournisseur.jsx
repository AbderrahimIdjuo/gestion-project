"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addtransaction } from "@/app/api/actions";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export default function PaiementFournisseurDialog({
  fournisseur,
  isOpen,
  onClose,
}) {
  const {
    register,
    reset,
    watch,
    handleSubmit,
    setValue,
    formState: { errors, isSubmiting },
  } = useForm();
  const queryClient = useQueryClient();

  const createTransaction = useMutation({
    mutationFn: async (data) => {
      const {
        compte,
        description,
        lable,
        montant,
        numero,
        type,
        typePaiement,
      } = data;
      const transData = {
        fournisseurId: fournisseur.id,
        compte,
        description: "paiement du fournisseur " + fournisseur.nom,
        lable: "paiement fournisseur",
        montant,
        type: "depense",
        methodePaiement: typePaiement,
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
      queryClient.invalidateQueries({ queryKey: ["fournisseurs"] });
      queryClient.invalidateQueries({ queryKey: ["statistiques"] });
    },
  });
  const onSubmit = async (data) => {
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
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Paiement de {fournisseur?.nom}</DialogTitle>
            <DialogDescription>
              Sélectionnez le type de paiement et remplissez les détails
              nécessaires.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <RadioGroup
              value={watch("typePaiement")}
              onValueChange={(value) => {
                reset();
                setValue("typePaiement", value);
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
              <div className="space-y-4">
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
                    onValueChange={(value) => setValue("compte", value)}
                  >
                    <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500 mt-2">
                      <SelectValue placeholder="Séléctionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {comptes.data?.map((element) => (
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
            {watch("typePaiement") === "cheque" && (
              <div className="space-y-4">
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
                    onValueChange={(value) => setValue("compte", value)}
                  >
                    <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500 mt-2">
                      <SelectValue placeholder="Séléctionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {comptes.data
                        ?.filter((c) => c.compte !== "caisse")
                        .map((element) => (
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
