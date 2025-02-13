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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";

export function UpdateEmployeForm({setIsUpdatingEmploye , currEmploye }) {
  const employeSchema = z.object({
    id: z.string(),
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
    rib: z.string().length(24, "Le RIB contient 24 chiffre").optional(),
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
      nom: currEmploye.nom,
      telephone: currEmploye.telephone,
      adresse: currEmploye.adresse,
      role: currEmploye.role,
      cin: currEmploye.cin,
      rib: currEmploye.rib,
      salaire: currEmploye.salaire,
    },
    resolver: zodResolver(employeSchema),
  });

  const queryClient = useQueryClient();
  const updateEmploye = useMutation({
    mutationFn: async (data) => {
      const loadingToast = toast.loading("Modification de l'employé...");
      try {
        const response = await axios.put("/api/employes", data);
        toast.success("Employé modifier avec succès");

        return response.data;
      } catch (error) {
        toast.error("Échec de la modification!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
        reset();
        setValue("role", null);
        setIsUpdatingEmploye(false)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employes"] });
    },
  });
  const onSubmit = async (data) => {
    updateEmploye.mutate(data);
  };

  const roles = [
    { value: "commercant", lable: "commerçant" },
    { value: "role 1", lable: "role 1" },
    { value: "role 2", lable: "role 2" },
    { value: "role 3", lable: "role 3" },
  ];

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
                  className={`w-full  focus-visible:ring-purple-500  ${
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
                  className={`w-full  focus-visible:ring-purple-500  ${
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
                className="col-span-3 focus-visible:ring-purple-500 "
                spellCheck={false}
              />
            </div>
            <div className="w-full grid grid-cols-1">
              <Label htmlFor="role" className="text-left mb-2 mb-2">
                Rôle
              </Label>
              <Select
                name="role"
                onValueChange={(value) => setValue("role", value)}
                value={watch("role")}
              >
                <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                  <SelectValue placeholder="Sélectionnez un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role, index) => (
                    <SelectItem key={index} value={role.value}>
                      {role.lable}
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
                  className={`col-span-3 focus-visible:ring-purple-500  ${
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
                className="col-span-3 focus-visible:ring-purple-500 "
                spellCheck={false}
              />
            </div>
            <SaveButton
              onClick={() => {
                setValue("id", currEmploye.id);
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
