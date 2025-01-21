"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { SaveButton } from "./customUi/styledButton";

import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";

export function ModifyProductDialog({currProduct, getProducts }) {
  const {
    register,
    handleSubmit,
  } = useForm();
  const [categorie, setCategorie] = useState();
  const [statu, setStatu] = useState();

  const onSubmit = async (data) => {
    console.log(data);

    const Data = { ...data, statu, categorie, id: currProduct.id };

    toast.promise(
      (async () => {
        const response = await axios.put(`/api/produits`, Data);
        if (response.status === 409) {
          console.log("response.status === 409");
        }
        if (!response) {
          throw new Error("Failed to add produit");
        }
        console.log("Produits modifier avec succès");
        getProducts();
      })(),
      {
        loading: "Modification du produit...",
        success: "Produit modifier avec succès!",
        error: "Échec de la modification du produit",
      }
    );
  };

  const status = [
    { lable: "En stock", color: "emerald-500" },
    { lable: "En rupture", color: "red-500" },
    { lable: "Commander", color: "amber-500" },
  ];

  return (
    <>
    <Card className="w-full grid gap-2 h-full px-2">
      <CardHeader className="flex-col justify-start">
        <CardTitle className="my-3">Modifier un produit</CardTitle>
        <CardDescription className="my-5">
          Modifier les informations du produit. Cliquez sur
          enregistrer lorsque vous avez terminé.
        </CardDescription>
        <Separator className=" mb-5 w-[95%]" />
      </CardHeader>

      <CardContent className="w-full">
        <form  className="w-full h-[80%] grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="w-full grid gap-6 ">
        <div className="w-full grid grid-cols-1">
              <Label htmlFor="nom" className="text-left mb-2 mb-2">
                Désignation
              </Label>
              <Input
                id="designation"
                name="designation"
                {...register("designation")}
                defaultValue={currProduct?.designation}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500"
              />
            </div>
            <div className="w-full grid grid-cols-1">
              <Label htmlFor="categorie" className="text-left mb-2 mb-2">
                Catégorie
              </Label>
              <Select
                name="categorie"
                onValueChange={(value) => setCategorie(value)}
                value={currProduct?.categorie}
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
            <div className="relative w-full grid grid-cols-1">
              <Label htmlFor="prixAchat" className="text-left mb-2 mb-2">
                Prix d&apos;achat
              </Label>
              <div className="relative grid grid-cols-1 items-center gap-4">
              <Input
                id="prixAchat"
                name="prixAchat"
                {...register("prixAchat")}
                defaultValue={currProduct?.prixAchat}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500"
              />
              <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-center bg-slate-100 border rounded-r-md">
                <span className="text-sm text-gray-600">MAD</span>
              </div>

              </div>
            </div>
            <div className="relative w-full grid grid-cols-1">
              <Label htmlFor="prixVente" className="text-left mb-2 mb-2">
                Prix de vente
              </Label>
              <div className="relative grid grid-cols-1 items-center gap-4">

              <Input
                id="prixVente"
                name="prixVente"
                {...register("prixVente")}
                defaultValue={currProduct?.prixVente}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500"
              />
              <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-center bg-slate-100 border rounded-r-md">
                <span className="text-sm text-gray-600">MAD</span>
              </div>
              </div>
            </div>
            <div className="relative w-full grid grid-cols-1">
              <Label htmlFor="status" className="text-left mb-2 mb-2">
                Statut
              </Label>
              <Select
                value={currProduct?.statut}
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
            <div className="relative w-full grid grid-cols-1">
            <Label htmlFor="stock" className="text-left mb-2 mb-2">
                Stock
              </Label>
              <Input
                id="stock"
                name="stock"
                {...register("stock")}
                defaultValue={currProduct?.stock}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500"
              />
            </div>
            <div className="relative w-full grid grid-cols-1">
              <Label htmlFor="description" className="text-left mb-2 mb-2">
                Description
              </Label>
              <Textarea
                {...register("description")}
                defaultValue={currProduct?.description}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500"
              />
            </div>
          </div>
          <SaveButton type="submit" title="Enregistrer" />
        </form>
        </CardContent>
        </Card>
    </>
  );
}
