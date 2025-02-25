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
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";

export function AddEmployeForm() {
  const employeSchema = z.object({
    nom: z.string().min(1, "Veuillez insérer le nom de l'employé"),
    telephone: z.preprocess((telephone) => {
      // If telephone is empty or undefined, return null
      return telephone === "" ? null : telephone;
    }, z.string().length(10, "Téléphone doit contenir 10 chiffres").regex(/^\d+$/, "Téléphone doit contenir des chiffres").nullable()),
    cin: z.string().optional(),
    salaire: z.preprocess(
      (value) =>
        value === "" || value === undefined ? undefined : Number(value),
      z
        .number({ invalid_type_error: "Le salaire doit être un nombre" })
        .optional()
    ),
    role: z.string().optional(),
    adresse: z.string().optional(),
    rib: z
      .string()
      .length(24, "Le RIB contient 24 chiffres")
      .nullable()
      .or(z.literal("")),
  });

  const {
    register,
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(employeSchema),
  });
  const getTachesEmploye = async () => {
    const response = await axios.get("/api/typeTaches");
    const taches = response.data.taches;
    console.log("taches : ", taches);
    return taches;
  };
  const query = useQuery({
    queryKey: ["taches"],
    queryFn: getTachesEmploye,
  });
  const queryClient = useQueryClient();
  const createNewEmploye = useMutation({
    mutationFn: async (data) => {
      const loadingToast = toast.loading("Ajout de l'employé...");
      try {
        const response = await axios.post("/api/employes", data);
        toast.success("Employé ajouté avec succès");

        return response.data;
      } catch (error) {
        toast.error("Échec de l'ajout de l'employé");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employes"] });
      reset();
      setValue("role", null);
    },
  });
  const onSubmit = async (data) => {
    createNewEmploye.mutate(data);
  };



  return (
    <Card className="w-full grid gap-2 h-full px-2">
      <CardHeader className="flex-col justify-start">
        <CardTitle className="my-3">Ajouter un nouveau employé</CardTitle>
        <CardDescription className="my-5">
          Remplissez les informations du nouveau employé ici. Cliquez sur
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
              <Label htmlFor="nom" className="text-left mb-2 mb-2">
                Nom
              </Label>
              <div className="w-full">
                <Input
                  id="nom"
                  name="nom"
                  {...register("nom")}
                  className={`w-full focus-visible:ring-purple-500 ${
                    errors.nom && "border-red-500 border-2"
                  }`}
                  spellCheck={false}
                />
                {errors.nom && (
                  <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                    <CircleX className="h-4 w-4" />
                    {errors.nom.message}
                  </p>
                )}
              </div>
            </div>

            <div className="w- full grid grid-cols-1">
              <Label htmlFor="email" className="text-left mb-2">
                CIN
              </Label>
              <div className="col-span-1">
                <Input
                  id="email"
                  {...register("cin")}
                  className={`w-full  focus-visible:ring-purple-500 ${
                    errors.cin && "border-red-500 border-2"
                  }`}
                  spellCheck={false}
                />
                {errors.cin && (
                  <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                    <CircleX className="h-4 w-4" />
                    {errors.cin.message}
                  </p>
                )}
              </div>
            </div>
            <div className="w- full grid grid-cols-1">
              <Label htmlFor="telephone" className="text-left mb-2">
                Téléphone
              </Label>
              <div>
                <Input
                  id="telephone"
                  type="tel"
                  {...register("telephone")}
                  className={`w-full  focus-visible:ring-purple-500 ${
                    errors.telephone && "border-red-500 border-2"
                  }`}
                />
                {errors.telephone && (
                  <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                    <CircleX className="h-4 w-4" />
                    {errors.telephone.message}
                  </p>
                )}
              </div>
            </div>
            <div className="w- full grid grid-cols-1">
              <Label htmlFor="adresse" className="text-left mb-2">
                Adresse
              </Label>

              <Input
                id="adresse"
                {...register("adresse")}
                className="col-span-3 focus-visible:ring-purple-500"
                spellCheck={false}
              />
            </div>
            <div className="w-full grid grid-cols-1">
              <Label htmlFor="role" className="text-left mb-2 mb-2">
                Tâche
              </Label>
              <Select
                name="role"
                onValueChange={(value) => setValue("role", value)}
                value={watch("role")}
              >
                <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                  <SelectValue placeholder="Sélectionner ..." />
                </SelectTrigger>
                <SelectContent>
                  {query.data?.map((element) => (
                    <SelectItem key={element.id} value={element.tache}>
                      {element.tache}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-full grid grid-cols-1">
              <Label htmlFor="salaire" className="text-left mb-2 mb-2">
                Salaire
              </Label>
              <div className="relative grid grid-cols-1 items-center gap-4">
                <Input
                  id="salaire"
                  name="salaire"
                  {...register("salaire")}
                  className={`col-span-3 focus-visible:ring-purple-500 ${
                    errors.salaire && "border-red-500 border-2"
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
            <div className="w- full grid grid-cols-1">
              <Label htmlFor="rib" className="text-left mb-2">
                RIB
              </Label>
              <Input
                id="rib"
                {...register("rib")}
                className={`w-full focus-visible:ring-purple-500 ${
                  errors.rib && "border-red-500 border-2"
                }`}
                spellCheck={false}
              />
              {errors.rib && (
                <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                  <CircleX className="h-4 w-4" />
                  {errors.rib.message}
                </p>
              )}
            </div>
            <SaveButton
              onClick={() => {
                console.log(watch());
                console.log(employeSchema.parse(watch()));
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
