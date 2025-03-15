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
import { customAlphabet } from "nanoid";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";

const generateDeviNumber = () => {
  const digits = "1234567890";
  const nanoidCustom = customAlphabet(digits, 8);
  const customId = nanoidCustom();
  return `FACT-${customId}`;
};

export function AddFactureForm() {
  const factureSchema = z.object({
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
    date: z.preprocess(
      (value) => Number(value),
      z.number().int().min(1).max(28)
    ),
  });

  const {
    register,
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      numero: generateDeviNumber(),
      payer: false,
    },
    resolver: zodResolver(factureSchema),
  });

  const queryClient = useQueryClient();
  const createNewFacture = useMutation({
    mutationFn: async (data) => {
      const loadingToast = toast.loading("Ajout de la facture...");
      try {
        const response = await axios.post("/api/factures", data);
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
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      reset();
      setValue("type", null);
      setValue("date", null);
    },
  });
  const onSubmit = async (data) => {
    console.log("data :", data);

    createNewFacture.mutate(data);
  };

  const types = [
    { value: "récurrente", lable: "récurrente" },
    { value: "variante", lable: "variante" },
  ];
  const dayList = Array.from({ length: 28 }, (_, i) => i + 1);
  console.log("dayList", dayList);

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
            <div className="w-full grid grid-cols-1">
              <Label htmlFor="type" className="text-left mb-2 mb-2">
                Type
              </Label>
              <Select
                name="type"
                onValueChange={(value) => setValue("type", value)}
                value={watch("type")}
              >
                <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type, index) => (
                    <SelectItem key={index} value={type.value}>
                      {type.lable}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="date" className="text-left mb-2 mb-2">
                Date d&apos;émission
              </Label>
              <Select
                name="date"
                onValueChange={(value) => setValue("date", value)}
                value={watch("date")}
              >
                <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                  <SelectValue placeholder="Sélectionnez une date" />
                </SelectTrigger>
                <SelectContent>
                  {dayList.map((day, index) => (
                    <SelectItem key={index} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
