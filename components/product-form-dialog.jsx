"use client";

import { useState, useEffect } from "react";
import { SaveButton } from "./customUi/styledButton";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import toast from "react-hot-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import axios from "axios";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleX } from "lucide-react";

export function ProductFormDialog({ getProducts }) {
  const productSchema = z.object({
    designation: z.string().min(1, "Champ obligatoire"),
    categorie: z.string().optional(),
    fournisseur: z
      .object({
        id: z.string().uuid(),
        nom: z.string(),
        email: z.string().email(),
        telephone: z.string(),
        adresse: z.string(),
      })
      .optional(),

    prixAchat: z.preprocess((value) => {
      if (value === "" || value === undefined) return undefined; // Handle empty input
      return typeof value === "string" ? parseFloat(value) : value;
    }, z.number({ invalid_type_error: "Le prix d'achat doit être un nombre" }).optional().default(0)),
    prixVente: z.preprocess((value) => {
      if (value === "" || value === undefined) return undefined; // Handle empty input
      return typeof value === "string" ? parseFloat(value) : value;
    }, z.number({ invalid_type_error: "Le prix de vente doit être un nombre" }).optional().default(0)),
    stock: z.preprocess(
      (value) => {
        if (value === "" || value === undefined) return undefined; // Handle empty input
        if (typeof value === "string") {
          return parseFloat(value.replace(",", ".")); // Replace comma with dot
        }
        return value;
      },
      z
        .number()
        .refine(
          (value) => Number.isInteger(value), // Ensure the value is an integer
          { message: "Le stock doit être un entier" } // Custom error message
        )
        .optional()
        .default(0)
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
    resolver: zodResolver(productSchema),
  });
  const [open, setOpen] = useState(false);
  const [fournisseurList, setFournisseurList] = useState([]);

  const getFournisseurs = async () => {
    const result = await axios.get("/api/fournisseurs");
    const { Fournisseurs } = result.data;
    console.log(Fournisseurs);
    setFournisseurList(Fournisseurs);
  };
  useEffect(() => {
    getFournisseurs();
  }, []);
  const onSubmit = async (data) => {
    console.log("produit data : ", data);

    toast.promise(
      (async () => {
        const response = await fetch("/api/produits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          throw new Error("Failed to add commande");
        }
        console.log("Produits ajouté avec succès");
        // reset the form
        reset();
        getProducts();
      })(),
      {
        loading: "Ajout de produit...",
        success: "Produit ajouté avec succès!",
        error: "Échec de l'ajout du produit",
      }
    );
  };
  const stockStatuts = (stock) => {
    if (stock > 0) {
      setValue("statut", "En stock");
    } else {
      setValue("statut", "En rupture");
    }
  };

  const categories = [
    { value: "Électronique", lable: "Électronique" },
    { value: "Vêtements", lable: "Vêtements" },
    { value: "Alimentation", lable: "Alimentation" },
    { value: "Bureautique", lable: "Bureautique" },
  ];

  return (
    <Card className="w-full grid gap-2 h-full px-2">
      <CardHeader className="flex-col justify-start">
        <CardTitle className="my-3">Ajouter un nouveau produit</CardTitle>
        <CardDescription className="my-5">
          Remplissez les informations du nouveau produit ici. Cliquez sur
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
                Désignation*
              </Label>
              <Input
                id="designation"
                name="designation"
                {...register("designation")}
                className={`col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500 ${
                  errors.designation && "border-red-500 border-2"
                }`}
                spellCheck={false}
              />
              {errors.designation && (
                <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                  <CircleX className="h-4 w-4" />
                  {errors.designation.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerName">Fournisseur</Label>
              <br />
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between mt-2"
                  >
                    {watch("fournisseur")
                      ? watch("fournisseur").nom.toUpperCase()
                      : "Sélectioner un fournisseur..."}
                    <ChevronDown className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto min-w-[25vw] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search fournisseur..."
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>Aucun fournisseur trouvé.</CommandEmpty>
                      <ScrollArea className="h-72 w-full">
                        <CommandGroup>
                          {fournisseurList?.map((fournisseur) => (
                            <CommandItem
                              name="fournisseur"
                              key={fournisseur.id}
                              value={fournisseur.nom}
                              onSelect={() => {
                                setOpen(false);
                                setValue("fournisseur", fournisseur);
                              }}
                            >
                              {fournisseur.nom.toUpperCase()}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </ScrollArea>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="w-full grid grid-cols-1">
              <Label htmlFor="categorie" className="text-left mb-2 mb-2">
                Catégorie
              </Label>
              <Select
                name="categorie"
                onValueChange={(value) => setValue("categorie", value)}
                value={watch("categorie")}
              >
                <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((categorie, index) => (
                    <SelectItem key={index} value={categorie.value}>
                      {categorie.lable}
                    </SelectItem>
                  ))}
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
                  className={`col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500 ${
                    errors.prixAchat && "border-red-500 border-2"
                  }`}
                />
                <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-center bg-slate-100 border rounded-r-md">
                  <span className="text-sm text-gray-600">MAD</span>
                </div>
              </div>
              {errors.prixAchat && (
                <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                  <CircleX className="h-4 w-4" />
                  {errors.prixAchat.message}
                </p>
              )}
            </div>
            <div className="relative w-full grid grid-cols-1">
              <Label htmlFor="prixVente" className="text-left mb-2 mb-2">
                Prix de vente
              </Label>
              <div className="relative z-10 grid grid-cols-1 items-center gap-4">
                <Input
                  id="prixVente"
                  name="prixVente"
                  {...register("prixVente")}
                  className={`col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500 ${
                    errors.prixVente && "border-red-500 border-2"
                  }`}
                />
                <div className="absolute z-0 inset-y-0 right-0 w-12 flex items-center justify-center bg-slate-100 border rounded-r-md">
                  <span className="text-sm text-gray-600">MAD</span>
                </div>
              </div>
              {errors.prixVente && (
                <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                  <CircleX className="h-4 w-4" />
                  {errors.prixVente.message}
                </p>
              )}
            </div>
            <div className="relative w-full grid grid-cols-1">
              <Label htmlFor="stock" className="text-left mb-2 mb-2">
                Stock
              </Label>
              <Input
                id="stock"
                name="stock"
                {...register("stock")}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500"
              />
              {errors.stock && (
                <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                  <CircleX className="h-4 w-4" />
                  {errors.stock.message}
                </p>
              )}
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
          </div>
          <SaveButton
            disabled={isSubmitting}
            onClick={() => stockStatuts(watch("stock"))}
            type="submit"
            title="Enregistrer"
          />
        </form>
      </CardContent>
    </Card>
  );
}
