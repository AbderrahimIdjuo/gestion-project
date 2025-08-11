"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleX } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
export function FournisseurFormDialog() {
  const [open, setOpen] = useState(false);
  const fournisseurSchema = z.object({
    nom: z.string().min(1, "Veuillez insérer le nom du fournisseur"),
    email: z.string().optional(),
    telephone: z.string().optional(),
    telephoneSecondaire: z.string().optional(),
    ice: z.string().optional(),
//    dette: z.string().optional(),
    adresse: z.string().optional(),
  });
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(fournisseurSchema),
  });
  const queryClient = useQueryClient();
  const onSubmit = async (data) => {
    console.log(data);

    toast.promise(
      (async () => {
        const response = await fetch("/api/fournisseurs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          throw new Error("Failed to add commande");
        }
        console.log("Fournisseur ajouté avec succès");
        queryClient.invalidateQueries(["fournisseurs"]);
        reset();
      })(),
      {
        loading: "Ajout de fournisseur...",
        success: "Fournisseur ajouté avec succès!",
        error: "Échec de l'ajout du fournisseur",
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 rounded-full">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un Fournisseur
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader className="mb-5">
            <DialogTitle>Nouveau fournisseur</DialogTitle>
            <DialogDescription>
              Remplissez les informations du nouveau fournisseur ici. Cliquez
              sur enregistrer lorsque vous avez terminé.
            </DialogDescription>
          </DialogHeader>

          <div className="w-full grid gap-6 ">
            <div className="w-full grid grid-cols-1">
              <Label htmlFor="nom" className="text-left mb-2 mb-2">
                Nom*
              </Label>
              <div className="w-full">
                <Input
                  id="nom"
                  name="nom"
                  {...register("nom")}
                  className={`col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0 ${
                    errors.nom && "border-red-500 border-2"
                  }`}
                  spellCheck={false}
                />
                {errors.nom && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.nom.message}
                  </p>
                )}
              </div>
            </div>
            <div className="w- full grid grid-cols-1">
              <Label htmlFor="adresse" className="text-left mb-2 mb-2">
                ICE
              </Label>
              <Input
                id="ice"
                name="ice"
                {...register("ice")}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
              />
            </div>
            <div className="w- full grid grid-cols-1">
              <Label htmlFor="telephone" className="text-left mb-2 mb-2">
                Téléphone
              </Label>
              <Input
                id="telephone"
                name="telephone"
                type="tel"
                {...register("telephone")}
                className={`col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0 ${
                  errors.telephone && "border-red-500 border-2"
                }`}
                spellCheck={false}
              />
              {errors.telephone && (
                <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                  <CircleX className="h-4 w-4" />
                  {errors.telephone.message}
                </p>
              )}
            </div>
            <div className="w- full grid grid-cols-1">
              <Label htmlFor="adresse" className="text-left mb-2 mb-2">
                Mobile
              </Label>
              <Input
                id="telephoneSecondaire"
                name="telephoneSecondaire"
                {...register("telephoneSecondaire")}
                className={`col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0 ${
                  errors.telephoneSecondaire && "border-red-500 border-2"
                }`}
              />
              {errors.telephoneSecondaire && (
                <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                  <CircleX className="h-4 w-4" />
                  {errors.telephoneSecondaire.message}
                </p>
              )}
            </div>
            <div className="w- full grid grid-cols-1">
              <Label htmlFor="email" className="text-left mb-2 mb-2">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                {...register("email")}
                className={`col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0 ${
                  errors.email && "border-red-500 border-2"
                }`}
                spellCheck={false}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                  <CircleX className="h-4 w-4" />
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="w- full grid grid-cols-1">
              <Label htmlFor="adresse" className="text-left mb-2 mb-2">
                Adresse
              </Label>
              <Input
                id="adresse"
                name="adresse"
                {...register("adresse")}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
              />
            </div>
            {/* <div className="w- full grid grid-cols-1">
              <Label htmlFor="dette" className="text-left mb-2 mb-2">
                Dettte
              </Label>
              <Input
                id="dette"
                name="dette"
                {...register("dette")}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
              />
            </div> */}
          </div>
          <DialogFooter className="mt-5">
            <Button
              className="bg-[#00e701] hover:bg-[#00e701] shadow-lg hover:scale-105 text-white text-md rounded-full font-bold transition-all duration-300 transform"
              type="submit"
              // isSubmiting={isSubmiting}
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
