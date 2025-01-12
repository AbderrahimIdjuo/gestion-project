"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { useForm } from "react-hook-form";

export function ProductFormDialog({ children, getProducts }) {
  const { register, reset, handleSubmit } = useForm();
  const [open, setOpen] = useState(false);
  const [categorie, setCategorie] = useState();
  const [statu, setStatu] = useState();

  const onSubmit = async (data) => {
  
  const Data = { ...data, statu, categorie };
console.log('produit data : ', Data);

    toast.promise(
      (async () => {
        const response = await axios.post("/api/produits", Data);
        if (response.status === 409) {
          console.log("response.status === 409");
        }
        if (!response) {
          throw new Error("Failed to add produit");
        }
        console.log("Produits ajouté avec succès");
        // clear the form
        reset();
        setStatu("");
        setCategorie("");
        getProducts();
      })(),
      {
        loading: "Ajout de produit...",
        success: "Produit ajouté avec succès!",
        error: "Échec de l'ajout du produit",
      }
    );
  };

  const status = [
    { lable: "En stock", color: "emerald-500" },
    { lable: "En rupture", color: "red-500" },
    { lable: "Commander", color: "amber-500" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau produit</DialogTitle>
          <DialogDescription>
            Remplissez les informations du nouveau produit ici. Cliquez sur
            enregistrer lorsque vous avez terminé.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right">
                Désignation
              </Label>
              <Input
                id="designation"
                name="designation"
                {...register("designation")}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categorie" className="text-right">
                Catégorie
              </Label>
              <Select
                name="categorie"
                onValueChange={(value) => setCategorie(value)}
                value={categorie}
              >
                <SelectTrigger className="col-span-3 border-purple-200 bg-white focus:ring-purple-500">
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Électronique">Électronique</SelectItem>
                  <SelectItem value="Vêtements">Vêtements</SelectItem>
                  <SelectItem value="Alimentation">Alimentation</SelectItem>
                  <SelectItem value="Bureautique">Bureautique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative grid grid-cols-4 items-center gap-4">
              <Label htmlFor="prixAchat" className="text-right">
                Prix d&apos;achat
              </Label>
              <Input
                id="prixAchat"
                name="prixAchat"
                {...register("prixAchat")}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500"
              />
              <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-center bg-slate-100 border rounded-r-md">
                <span className="text-sm text-gray-600">MAD</span>
              </div>
            </div>
            <div className="relative grid grid-cols-4 items-center gap-4">
              <Label htmlFor="prixVente" className="text-right">
                Prix de vente
              </Label>
              <Input
                id="prixVente"
                name="prixVente"
                {...register("prixVente")}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500"
              />
              <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-center bg-slate-100 border rounded-r-md">
                <span className="text-sm text-gray-600">MAD</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Statut
              </Label>
              <Select
                value={statu}
                name="status"
                onValueChange={(value) => setStatu(value)}
              >
                <SelectTrigger className="col-span-3 border-purple-200 bg-white focus:ring-purple-500">
                  <SelectValue placeholder="Sélectionnez un statut" />
                </SelectTrigger>
                <SelectContent>
                  {status.map((statu, index) => (
                    <SelectItem key={index} value={statu.lable}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full bg-${statu.color}`}
                        />
                        {statu.lable}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock" className="text-right">
                Stock
              </Label>
              <Input
                id="stock"
                name="stock"
                {...register("stock")}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                {...register("description")}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500"
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
