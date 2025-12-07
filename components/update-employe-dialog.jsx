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
import { CircleX } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

export function UpdateEmployeDialog({ employe, open, onOpenChange }) {
  const employeSchema = z.object({
    id: z.string(),
    nom: z.string().min(1, "Veuillez insérer le nom de l'employé"),
    telephone: z.preprocess(telephone => {
      // If telephone is empty or undefined, return null
      return telephone === "" ? null : telephone;
    }, z.string().length(10, "Téléphone doit contenir 10 chiffres").regex(/^\d+$/, "Téléphone doit contenir des chiffres").nullable()),
    cin: z.string().optional(),
    salaire: z.preprocess(
      value =>
        value === "" || value === undefined ? undefined : Number(value),
      z
        .number({ invalid_type_error: "Le salaire doit être un nombre" })
        .optional()
    ),
    role: z.string().optional(),
    adresse: z.string().optional(),
    rib: z.preprocess(rib => {
      // If rib is empty or undefined, return null
      return rib === "" || rib === undefined ? null : rib;
    }, z.union([z.string().length(24, "Le RIB doit contenir 24 chiffres").regex(/^\d+$/, "Le RIB doit contenir uniquement des chiffres"), z.null()]).optional()),
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

  // Reset form when employe changes or dialog opens
  useEffect(() => {
    if (employe && open) {
      reset({
        nom: employe.nom || "",
        telephone: employe.telephone || "",
        adresse: employe.adresse || "",
        role: employe.role || "",
        cin: employe.cin || "",
        rib: employe.rib || "",
        salaire: employe.salaire || "",
      });
      setValue("id", employe.id);
    }
  }, [employe, open, reset, setValue]);

  const getTachesEmploye = async () => {
    const response = await axios.get("/api/typeTaches");
    const taches = response.data.taches;
    return taches;
  };

  const query = useQuery({
    queryKey: ["taches"],
    queryFn: getTachesEmploye,
  });

  const queryClient = useQueryClient();

  const updateEmploye = useMutation({
    mutationFn: async data => {
      const loadingToast = toast.loading("Modification de l'employé...");
      try {
        const response = await axios.put("/api/employes", data);
        toast.success("Employé modifié avec succès");
        return response.data;
      } catch (error) {
        toast.error("Échec de la modification!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employes"] });
      reset();
      setValue("role", null);
      onOpenChange(false);
    },
  });

  const onSubmit = async data => {
    setValue("id", employe.id);
    updateEmploye.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;employé</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l&apos;employé ici. Cliquez sur
              enregistrer lorsque vous avez terminé.
            </DialogDescription>
          </DialogHeader>
          <div className="w-full grid gap-6 my-4">
            <div className="w-full grid grid-cols-1">
              <Label htmlFor="nom" className="text-left mb-2">
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

            <div className="w-full grid grid-cols-1">
              <Label htmlFor="cin" className="text-left mb-2">
                CIN
              </Label>
              <div className="col-span-1">
                <Input
                  id="cin"
                  {...register("cin")}
                  className={`w-full focus-visible:ring-purple-500 ${
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

            <div className="w-full grid grid-cols-1">
              <Label htmlFor="telephone" className="text-left mb-2">
                Téléphone
              </Label>
              <div>
                <Input
                  id="telephone"
                  type="tel"
                  {...register("telephone")}
                  className={`w-full focus-visible:ring-purple-500 ${
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

            <div className="w-full grid grid-cols-1">
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
              <Label htmlFor="role" className="text-left mb-2">
                Tâche
              </Label>
              <Select
                name="role"
                onValueChange={value => setValue("role", value)}
                value={watch("role")}
              >
                <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                  <SelectValue placeholder="Sélectionner ..." />
                </SelectTrigger>
                <SelectContent>
                  {query.data?.map(element => (
                    <SelectItem key={element.id} value={element.tache}>
                      {element.tache}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative w-full grid grid-cols-1">
              <Label htmlFor="salaire" className="text-left mb-2">
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

            <div className="w-full grid grid-cols-1">
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
          </div>
          <DialogFooter>
            <Button
              className="bg-[#00e701] hover:bg-[#00e701] shadow-lg hover:scale-105 text-white text-md rounded-full font-bold transition-all duration-300 transform"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "En cours..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
