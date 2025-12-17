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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";

import z from "zod";

export default function UpdateReglementDialog({
  reglement,
  isOpen,
  onClose,
}) {
  const [dateReglement, setDateReglement] = useState(null);
  const [datePrelevement, setDatePrelevement] = useState(null);

  const reglementSchema = z
    .object({
      montant: z
        .number({ invalid_type_error: "Le montant est requis" })
        .min(0.01, "Le montant doit être supérieur à 0"),
      compte: z.string().min(1, "Le compte bancaire est requis"),
      methodePaiement: z.string().min(1, "La méthode de paiement est requise"),
      motif: z.string().optional(),
      numeroCheque: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.methodePaiement === "cheque" || data.methodePaiement === "traite") {
        if (!data.numeroCheque || data.numeroCheque.trim() === "") {
          ctx.addIssue({
            path: ["numeroCheque"],
            code: z.ZodIssueCode.custom,
            message: "Le numéro de chèque est requis pour un paiement par chèque.",
          });
        }
      }
    });

  const {
    register,
    reset,
    watch,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(reglementSchema),
  });

  const queryClient = useQueryClient();

  // Mettre à jour les valeurs du formulaire quand le règlement change
  useEffect(() => {
    if (reglement) {
      reset({
        montant: reglement.montant || 0,
        compte: reglement.compte || "",
        methodePaiement: reglement.methodePaiement || "",
        motif: reglement.motif || "",
        numeroCheque: reglement.cheque?.numero || "",
      });
      // Utiliser dateReglement du reglement
      if (reglement.dateReglement) {
        setDateReglement(new Date(reglement.dateReglement));
      } else if (reglement.date) {
        setDateReglement(new Date(reglement.date));
      }
      // Utiliser datePrelevement si disponible
      if (reglement.datePrelevement) {
        setDatePrelevement(new Date(reglement.datePrelevement));
      } else if (reglement.cheque?.datePrelevement) {
        setDatePrelevement(new Date(reglement.cheque.datePrelevement));
      }
    }
  }, [reglement, reset]);

  const handleUpdateReglement = useMutation({
    mutationFn: async (data) => {
      const loadingToast = toast.loading("Opération en cours ...");
      try {
        await axios.put("/api/reglement", data);
        toast.success("Règlement mis à jour avec succès");
      } catch (error) {
        toast.error(
          error?.response?.data?.error || "Échec de la mise à jour du règlement"
        );
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      onClose();
      queryClient.invalidateQueries({ queryKey: ["reglements"] });
      queryClient.invalidateQueries({ queryKey: ["bonLivraison"] });
      // Invalider aussi les notifications de prélèvements
      queryClient.invalidateQueries({ queryKey: ["today-prelevements"] });
    },
  });

  const onSubmit = async (data) => {
    const submitData = {
      ...data,
      id: reglement.id,
      dateReglement: dateReglement,
      datePrelevement: datePrelevement,
      numeroCheque:
        data.methodePaiement !== "cheque" &&
        data.methodePaiement !== "traite"
          ? null
          : data.numeroCheque,
    };
    handleUpdateReglement.mutate(submitData);
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
            <DialogTitle>Modifier le Règlement</DialogTitle>
            <DialogDescription>
              Modifiez les détails du règlement.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="lable">Fournisseur</Label>
              <div className="w-full h-10 px-3 py-2 bg-purple-50 rounded-md flex items-center text-sm">
                {reglement?.lable?.replace("Règlement ", "") || "Aucun fournisseur"}
              </div>
            </div>

            <div className="w-full">
              <Label htmlFor="dateReglement">Date de règlement : </Label>
              <CustomDatePicker
                date={dateReglement}
                onDateChange={setDateReglement}
              />
            </div>

            <div className="w-full">
              <Label htmlFor="datePrelevement">Date de prélèvement (optionnel) : </Label>
              <CustomDatePicker
                date={datePrelevement}
                onDateChange={setDatePrelevement}
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="montant">Montant</Label>
              <Input
                {...register("montant", { valueAsNumber: true })}
                className="w-full focus-visible:ring-purple-500"
                id="montant"
                placeholder="Entrez le montant"
                type="number"
                step="0.01"
              />
              {errors.montant && (
                <p className="text-red-500 text-sm">{errors.montant.message}</p>
              )}
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="compte">Compte bancaire</Label>
              <Select
                value={watch("compte")}
                name="compte"
                onValueChange={(value) => setValue("compte", value)}
              >
                <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {comptes.data?.map((element) => (
                    <SelectItem key={element.id} value={element.compte}>
                      <div className="flex items-center gap-2">{element.compte}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.compte && (
                <p className="text-red-500 text-sm">{errors.compte.message}</p>
              )}
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="methodePaiement">Méthode de paiement</Label>
              <Select
                value={watch("methodePaiement")}
                name="methodePaiement"
                onValueChange={(value) => setValue("methodePaiement", value)}
              >
                <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="espece">Espèce</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="versement">Versement</SelectItem>
                  <SelectItem value="traite">Traite</SelectItem>
                </SelectContent>
              </Select>
              {errors.methodePaiement && (
                <p className="text-red-500 text-sm">
                  {errors.methodePaiement.message}
                </p>
              )}
            </div>

            {(watch("methodePaiement") === "cheque" ||
              watch("methodePaiement") === "traite") && (
              <div className="grid w-full items-center gap-2 col-span-3">
                <Label htmlFor="numeroCheque">Numéro de chèque</Label>
                <Input
                  {...register("numeroCheque")}
                  className="w-full focus-visible:ring-purple-500"
                  id="numeroCheque"
                  placeholder="Numéro de chèque"
                />
                {errors.numeroCheque && (
                  <p className="text-red-500 text-sm">
                    {errors.numeroCheque.message}
                  </p>
                )}
              </div>
            )}

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="motif">Motif (optionnel)</Label>
              <Textarea
                {...register("motif")}
                id="motif"
                className="col-span-3 focus-visible:ring-purple-500"
                placeholder="Motif du règlement"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              className="rounded-full"
              variant="outline"
              onClick={onClose}
              type="button"
            >
              Annuler
            </Button>
            <Button
              className="bg-[#00e701] hover:bg-[#00e701] shadow-lg hover:scale-105 text-white text-md rounded-full font-bold transition-all duration-300 transform"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "En cours..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

