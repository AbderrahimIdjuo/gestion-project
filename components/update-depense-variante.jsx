"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { SaveButton } from "./customUi/styledButton";
import { Separator } from "@/components/ui/separator";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleX } from "lucide-react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";

export function UpdateDepenseVariante({ currFacture, setIsUpdatingfacture }) {
  const factureSchema = z.object({
    id: z.string(),
    compte: z.string(),
    label: z.string().min(1, "Champ oligatoire"),
    montant: z.preprocess(
      (value) =>
        value === "" || value === undefined ? undefined : Number(value),
      z
        .number({ invalid_type_error: "Le salaire doit être un nombre" })
        .optional()
    ),
    description: z.string().optional(),
  });
  console.log("currFacture", currFacture);

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      id: currFacture.id,
      label: currFacture.label,
      compte: currFacture.compte,
      description: currFacture.description,
      montant: currFacture.montant,
    },
    resolver: zodResolver(factureSchema),
  });

  const queryClient = useQueryClient();
  const updateFacture = useMutation({
    mutationFn: async (data) => {
      const loadingToast = toast.loading("Modification de la facture...");
      try {
        const response = await axios.put("/api/depensesVariantes", data , {
          params: { id: currFacture?.id, numero: currFacture?.numero },
        });
        toast.success("facture modifier avec succès");

        return response.data;
      } catch (error) {
        toast.error("Échec de la modification de la facture");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["depensesVariantes"] });
      setIsUpdatingfacture(false);
    },
  });
  const onSubmit = async (data) => {
    console.log("Data : ", data);

    updateFacture.mutate(data);
  };
  const comptes = useQuery({
    queryKey: ["comptes"],
    queryFn: async () => {
      const response = await axios.get("/api/comptesBancaires");
      const comptes = response.data.comptes;
      console.log("comptes : ", comptes);
      return comptes;
    },
  });

  return (
    <Card className="w-full grid gap-2 h-full px-2">
      <CardHeader className="flex-col justify-start">
        <CardTitle className="my-3">Modifier une facture</CardTitle>
        <CardDescription className="my-5">
          Modifier les informations de la facture ici. Cliquez sur enregistrer
          lorsque vous avez terminé.
        </CardDescription>
        <Separator className=" mb-5 w-[95%]" />
      </CardHeader>

      <CardContent className="w-full">
        <form
          className="w-full h-[80%] grid gap-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="w-full grid gap-6 ">
            <div className="w-full grid grid-cols-1">
              <Label htmlFor="label" className="text-left mb-2 mb-2">
                Label
              </Label>
              <div className="w-full">
                <Input
                  id="label"
                  name="label"
                  {...register("label")}
                  className={`w-full focus-visible:ring-purple-500 ${
                    errors.label && "border-red-500 border-2"
                  }`}
                  spellCheck={false}
                />
                {errors.label && (
                  <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                    <CircleX className="h-4 w-4" />
                    {errors.label.message}
                  </p>
                )}
              </div>
            </div>
            <div className="relative w-full grid grid-cols-1">
              <Label htmlFor="montant" className="text-left mb-2 mb-2">
                Montant
              </Label>
              <div className="relative grid grid-cols-1 items-center gap-4">
                <Input
                  id="montant"
                  name="montant"
                  {...register("montant")}
                  className={`col-span-3 focus-visible:ring-purple-500 ${
                    errors.montant && "border-red-500 border-2"
                  }`}
                />
                <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-center bg-slate-100 border rounded-r-md">
                  <span className="text-sm text-gray-600">MAD</span>
                </div>
              </div>
              {errors.salaire && (
                <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                  <CircleX className="h-4 w-4" />
                  {errors.salaire.message}
                </p>
              )}
            </div>
            <div className="w-full grid grid-cols-1">
              <Label htmlFor="compte" className="text-left mb-2 mb-2">
                Compte bancaire
              </Label>
              <Select
                name="compte"
                onValueChange={(value) => setValue("compte", value)}
                value={watch("compte")}
              >
                <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                  <SelectValue placeholder="Sélectionnez ..." />
                </SelectTrigger>
                <SelectContent>
                  {comptes.data?.map((compte) => (
                    <SelectItem key={compte.id} value={compte.compte}>
                      {compte.compte}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-full grid grid-cols-1">
              <Label htmlFor="description" className="text-left mb-2 mb-2">
                Description
              </Label>
              <Textarea
                {...register("description")}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500"
              />
            </div>
            <SaveButton
              onClick={() => {
                console.log(factureSchema.parse(watch()));
              }}
              disabled={isSubmitting}
              type="submit"
              title="Enregistrer"
            />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
