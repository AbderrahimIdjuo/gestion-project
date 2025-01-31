"use fournisseur";

import { useState, useEffect } from "react";
import { SaveButton } from "./customUi/styledButton";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

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
import { useForm } from "react-hook-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown } from "lucide-react";
import {Switch} from "@/components/ui/switch"
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
import axios from "axios";

export function AchatCommandeForm({ currProduct }) {
  const [open, setOpen] = useState(false);
  const [fournisseurList, setFournisseurList] = useState([]);
  const [switchValue, setSwitchValue] = useState();
  
  const { register, reset, watch, getValues, handleSubmit, setValue , formState:{isSubmitting} } = useForm(
    {
      defaultValues: {
        prixUnite: currProduct?.prixAchat,
        produit: currProduct,
        description: currProduct?.description,
        payer : false,
      },
    }
  );

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
    console.log("commandes data : ", data);
    const Data = {
      ...data,
      produitId: data.produit.id,
      fournisseurId: data.fournisseur.id,
    };
    toast.promise(
      (async () => {
        const response = await fetch("/api/achats-commandes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(Data),
        });
        if (!response.ok) {
          throw new Error("Failed to add commande");
        }
        console.log("Produits ajouté avec succès");
      })(),
      {
        loading: "Ajout de la commande...",
        success: "commande ajouté avec succès!",
        error: "Échec de l'ajout de la commande",
      }
    );
  };

  return (
    <Card className="w-full grid gap-2 h-full px-2">
      <CardHeader className="flex-col justify-start">
        <CardTitle className="my-3">Commander des produits</CardTitle>
        <CardDescription className="my-5">
          Remplissez les informations de la commande ici. Cliquez sur
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
                Produit
              </Label>
              <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-slate-100 h-[2.5rem]">
                {watch("produit").designation}
              </span>
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
            <div className="relative w-full grid grid-cols-1">
              <Label htmlFor="quantite" className="text-left mb-2 mb-2">
                Quantité
              </Label>
              <Input
                id="quantite"
                name="quantite"
                {...register("quantite")}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500"
              />
            </div>
            <div className="relative w-full grid grid-cols-1">
              <Label htmlFor="prixUnite" className="text-left mb-2 mb-2">
                Prix unitaire
              </Label>
              <div className="relative grid grid-cols-1 items-center gap-4">
                <Input
                  id="prixUnite"
                  name="prixUnite"
                  {...register("prixUnite")}
                  className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500"
                />
                <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-center bg-slate-100 border rounded-r-md">
                  <span className="text-sm text-gray-600">MAD</span>
                </div>
              </div>
            </div>
            {watch("prixUnite") * watch("quantite") > 0 && (
              <div className="relative w-full grid grid-cols-1">
                <Label htmlFor="montant" className="text-left mb-2 mb-2">
                  Montant
                </Label>
                <span className="text-md text-left text-gray-900 rounded-lg p-2 pl-4 bg-slate-100 h-[2.5rem]">
                  {watch("prixUnite") * watch("quantite")} MAD
                </span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Switch
                checked={watch("payer")}
                onCheckedChange={() => {
                  setValue("payer", !watch("payer"))                  
                  console.log(watch("payer"));
                }}
                id="airplane-mode"
              />
              <Label htmlFor="airplane-mode">
                {watch("payer") ? "Payer" :"Non payer" }
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
          </div>
          <SaveButton disabled={isSubmitting} type="submit" title="Enregistrer" />
        </form>
      </CardContent>
    </Card>
  );
}
