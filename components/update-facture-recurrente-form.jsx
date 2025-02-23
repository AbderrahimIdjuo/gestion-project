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
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";

export function UpdateFactureRecurrenteForm({ currFacture, setIsUpdatingfacture }) {
  const factureSchema = z.object({
    id: z.string(),
    numero: z.string(),
    lable: z.string().min(1, "Veuillez insérer un label de l'employé"),
    montant: z.preprocess(
      (value) =>
        value === "" || value === undefined ? undefined : Number(value),
      z
        .number({ invalid_type_error: "Le salaire doit être un nombre" })
        .optional()
    ),
    type: z.string(),
    payer: z.boolean(),
    description: z.string().optional(),
  });
  console.log("currFacture", currFacture);

  const {
    register,
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      id: currFacture.id,
      numero: currFacture.numero,
      lable: currFacture.lable,
      type: currFacture.type,
      payer: currFacture.payer,
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
        const response = await axios.put("/api/factures", data);
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
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      setIsUpdatingfacture(false);
    },
  });
  const onSubmit = async (data) => {
    console.log("Data : ", data);

    updateFacture.mutate(data);
  };

  const comptes = [
    { lable: "CIH Bank", value: "cih" },
    { lable: "Caisse", value: "caisse" },
  ];

  return (
    <Card className="w-full grid gap-2 h-full px-2">
      <CardHeader className="flex-col justify-start">
        <CardTitle className="my-3">Modifier la facture</CardTitle>
        <CardDescription className="my-5">
          Modifier les informations de la facture ici. Cliquez sur
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
              <Label htmlFor="lable" className="text-left mb-2 mb-2">
                Label
              </Label>
              <div className="w-full">
                <Input
                  id="lable"
                  name="lable"
                  {...register("lable")}
                  className={`w-full focus-visible:ring-purple-500 ${
                    errors.lable && "border-red-500 border-2"
                  }`}
                  spellCheck={false}
                />
                {errors.lable && (
                  <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                    <CircleX className="h-4 w-4" />
                    {errors.lable.message}
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
              {errors.montant && (
                <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                  <CircleX className="h-4 w-4" />
                  {errors.montant.message}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={watch("payer")}
                onCheckedChange={() => {
                  setValue("payer", !watch("payer"));
                  console.log(watch("payer"));
                }}
                id="airplane-mode"
              />
              <Label htmlFor="airplane-mode">
                {watch("payer") ? "Payer" : "Non payer"}
              </Label>
            </div>
            {watch("payer") && (
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
                    {comptes.map((compte, index) => (
                      <SelectItem key={index} value={compte.value}>
                        {compte.lable}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
