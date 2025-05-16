"use client";

//import type React from "react"

import { useState } from "react";
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
import { addtransaction } from "@/app/api/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast, { Toaster } from "react-hot-toast";

import z from "zod";
export default function TransactionDialog() {
  const [open, setOpen] = useState(false);
  const newTransactionSchema = z
    .object({
      type: z.enum(["recette", "depense", "vider"]),
      lable: z.string().optional(),
      numero: z.string().optional(),
      montant: z
        .number({ invalid_type_error: "Le montant est requis" })
        .optional(),
      compte: z.string().optional(),
      description: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (["recette", "depense"].includes(data.type)) {
        if (!data.lable || data.lable.trim() === "") {
          ctx.addIssue({
            path: ["lable"],
            code: z.ZodIssueCode.custom,
            message: "Le label est requis pour une recette ou une dépense.",
          });
        }
        if (!data.numero || data.numero.trim() === "") {
          ctx.addIssue({
            path: ["numero"],
            code: z.ZodIssueCode.custom,
            message:
              "La référence est requise pour une recette ou une dépense.",
          });
        }
        if (typeof data.montant !== "number" || data.montant <= 0) {
          ctx.addIssue({
            path: ["montant"],
            code: z.ZodIssueCode.custom,
            message: "Le montant doit être supérieur à 0.",
          });
        }
        if (!data.compte || data.compte.trim() === "") {
          ctx.addIssue({
            path: ["compte"],
            code: z.ZodIssueCode.custom,
            message: "Le compte bancaire est requis.",
          });
        }
      }

      if (data.type === "vider") {
        if (typeof data.montant !== "number" || data.montant <= 0) {
          ctx.addIssue({
            path: ["montant"],
            code: z.ZodIssueCode.custom,
            message: "Le montant à vider doit être supérieur à 0.",
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
    formState: { errors, isSubmiting },
  } = useForm({
    defaultValues: {
      type: "recette",
      reference : "",
      description: "",
      compte: "",
    },
    resolver: zodResolver(newTransactionSchema),
  });
  const queryClient = useQueryClient();
  const createTransaction = useMutation({
    mutationFn: async (data) => {
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
      queryClient.invalidateQueries({ queryKey: ["commandes"] });
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      queryClient.invalidateQueries({ queryKey: ["statistiques"] });
      
    },
  });
  const onSubmit = async (data) => {
    createTransaction.mutate(data);
    console.log("Transaction soumise:", data);
    setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 rounded-full">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Nouvelle Transaction</DialogTitle>
            <DialogDescription>
              Sélectionnez le type de transaction et remplissez les détails
              nécessaires.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <RadioGroup
              value={watch("type")}
              onValueChange={(value) => {
                reset();
                setValue("type", value);
              }}
              className="flex flex-row flex-wrap gap-4 justify-between"
            >
              <div className="flex items-center space-x-2 rounded-md p-2">
                <RadioGroupItem
                  value="recette"
                  id="recette"
                  className="text-green-600 "
                />
                <Label
                  htmlFor="recette"
                  className="text-green-600 font-medium cursor-pointer"
                >
                  Recette
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md p-2">
                <RadioGroupItem
                  value="depense"
                  id="depense"
                  className="text-red-600 "
                />
                <Label
                  htmlFor="depense"
                  className="text-red-600 font-medium cursor-pointer"
                >
                  Dépense
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md p-2">
                <RadioGroupItem
                  value="vider"
                  id="vider"
                  className="text-blue-600 "
                />
                <Label
                  htmlFor="vider"
                  className="text-blue-600 font-medium cursor-pointer"
                >
                  Vider la caisse
                </Label>
              </div>
            </RadioGroup>

            {(watch("type") === "recette" || watch("type") === "depense") && (
              <div className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="label">Label</Label>
                  <Input
                    {...register("lable")}
                    className="w-full focus-visible:ring-purple-500"
                    id="lable"
                    placeholder="Entrez un label"
                  />
                  {errors.label && (
                    <p className="text-red-500 text-sm">
                      {errors.label.message}
                    </p>
                  )}
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="numero">Référence</Label>
                  <Input
                    {...register("numero")}
                    className="w-full focus-visible:ring-purple-500"
                    id="numero"
                    placeholder="Entrez une référence"
                  />
                  {errors.numero && (
                    <p className="text-red-500 text-sm">
                      {errors.numero.message}
                    </p>
                  )}
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="montant">Montant</Label>
                  <Input
                    {...register("montant", { valueAsNumber: true })}
                    className="w-full focus-visible:ring-purple-500"
                    id="montant"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                  />
                  {errors.montant && (
                    <p className="text-red-500 text-sm">
                      {errors.montant.message}
                    </p>
                  )}
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
                        <SelectItem key={element.id} value={JSON.stringify({ id: element.id, compte: element.compte })}>
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
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    {...register("description")}
                    id="description"
                    className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500 mt-2"
                  />
                </div>
              </div>
            )}

            {watch("type") === "vider" && (
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="montant-vider">Montant</Label>
                <Input
                  {...register("montant", { valueAsNumber: true })}
                  className="w-full focus-visible:ring-purple-500"
                  id="montant-vider"
                  type="number"
                  placeholder="0.00 DH"
                  step="1"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              className="bg-[#00e701] hover:bg-[#00e701] shadow-lg hover:scale-105 text-white text-md rounded-full font-bold transition-all duration-300 transform"
              type="submit"
              isSubmiting={isSubmiting}
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
