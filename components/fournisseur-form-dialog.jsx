"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";

export function FournisseurFormDialog({ children, getFournisseurs }) {
  const [open, setOpen] = useState(false);
  const { register, reset, handleSubmit } = useForm();

  const onSubmit = async (data) => {
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
        getFournisseurs();
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
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau fournisseur</DialogTitle>
          <DialogDescription>
            Remplissez les informations du nouveau fournisseur ici. Cliquez sur
            enregistrer lorsque vous avez terminé.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right">
                Nom
              </Label>
              <Input
                id="nom"
                name="nom"
                {...register("nom")}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                {...register("email")}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telephone" className="text-right">
                Téléphone
              </Label>
              <Input
                id="telephone"
                name="telephone"
                type="tel"
                {...register("telephone")}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="adresse" className="text-right">
                Adresse
              </Label>
              <Input
                id="adresse"
                name="adresse"
                {...register("adresse")}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="bg-[#4ade80] hover:bg-[#22c55e] text-white"
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
