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
import { customAlphabet } from "nanoid";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";

export function AddFactureVarianteForm() {
  const factureSchema = z.object({
    numero: z.string(),
    compte: z.string(),
    label: z.string().min(1, "Veuillez insérer un label"),
    montant: z.preprocess(
      (value) =>
        value === "" || value === undefined ? undefined : Number(value),
      z
        .number({ invalid_type_error: "Le salaire doit être un nombre" })
        .optional()
    ),
    description: z.string().optional(),
  });

  const {
    register,
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(factureSchema),
  });
  const generateNumero = () => {
    const digits = "1234567890";
    const nanoidCustom = customAlphabet(digits, 8);
    const customId = nanoidCustom();
    return `FV-${customId}`;
  };
  const queryClient = useQueryClient();
  const comptes = useQuery({
    queryKey: ["comptes"],
    queryFn: async () => {
      const response = await axios.get("/api/comptesBancaires");
      const comptes = response.data.comptes;
      console.log("comptes : ", comptes);
      return comptes;
    },
  });
  const createNewFacture = useMutation({
    mutationFn: async (data) => {
      const loadingToast = toast.loading("Ajout de la facture...");
      try {
        const response = await axios.post("/api/depensesVariantes", data);
        toast.success("facture ajouté avec succès");

        return response.data;
      } catch (error) {
        toast.error("Échec de l'ajout de la facture");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["depensesVariantes"] });
      reset();
      setValue("compte", null);
    },
  });
  const onSubmit = async (data) => {
    createNewFacture.mutate(data);
  };

  return (
    <Card className="w-full grid gap-2 h-full px-2">
      <CardHeader className="flex-col justify-start">
        <CardTitle className="my-3">Ajouter une nouvelle facture</CardTitle>
        <CardDescription className="my-5">
          Remplissez les informations de la nouvelle facture ici. Cliquez sur
          enregistrer lorsque vous avez terminé.
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
                setValue("numero", generateNumero());
                console.log(watch());
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
