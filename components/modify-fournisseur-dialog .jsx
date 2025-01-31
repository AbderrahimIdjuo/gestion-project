"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { SaveButton } from "./customUi/styledButton";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleX } from "lucide-react";

export function ModifyFournisseurDialog({
  currFournisseur,
  getFournisseurs,
  fournisseurList,
}) {
  const fournisseurSchema = z.object({
    nom: z
      .string()
      .min(1, "Veuillez insérer le nom du fournisseur"),
    email: z
      .preprocess((email) => {
        // If email is empty or undefined, return null
        return email === "" ? null : email;
      }, z.string().email("Email invalide").nullable())
      .refine(
        (email) => {
          // If email is null, skip the uniqueness check
          if (email === null) return true;
          // Check if the email already exists in the fournisseur list
          return !fournisseurList
            ?.map((fournisseur) => fournisseur.email?.toLowerCase())
            .includes(email?.toLowerCase());
        },
        {
          // Message when the email is not unique
          message: "Cet email existe déjà",
        }
      ),
    telephone: z
      .preprocess((telephone) => {
        // If telephone is empty or undefined, return null
        return telephone === "" ? null : telephone;
      }, z.string().length(10, "Téléphone doit contenir 10 chiffres").regex(/^\d+$/, "Téléphone doit contenir des chiffres").nullable())
      .refine(
        (newTelephone) => {
          // If telephone is null, skip the uniqueness check
          if (newTelephone === null) return true;
          // Check if the telephone already exists in the phone list
          return !fournisseurList
            ?.map((fournisseur) => fournisseur.telephone)
            .includes(newTelephone);
        },
        {
          // Message when the telephone is not unique
          message: "Ce téléphone existe déjà",
        }
      ),
    telephoneSecondaire: z
      .preprocess((telephone) => {
        // If telephone is empty or undefined, return null
        return telephone === "" ? null : telephone;
      }, z.string().length(10, "Téléphone doit contenir 10 chiffres").regex(/^\d+$/, "Téléphone doit contenir des chiffres").nullable())
      .refine(
        (newTelephone) => {
          // If telephone is null, skip the uniqueness check
          if (newTelephone === null) return true;
          // Check if the telephone already exists in the phone list
          return !fournisseurList
            ?.map((fournisseur) => fournisseur.telephone)
            .includes(newTelephone);
        },
        {
          // Message when the telephone is not unique
          message: "Ce téléphone existe déjà",
        }
      ),
    ice: z.string().optional(),
    adresse: z.string().optional(),
  });
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors , isSubmitting},
  } = useForm({
    resolver: zodResolver(fournisseurSchema),
    defaultValues:{
      nom: currFournisseur?.nom.toUpperCase(),
      email:currFournisseur?.email,
      telephone:currFournisseur?.telephone,
      telephoneSecondaire:currFournisseur?.telephoneSecondaire,
      adresse:currFournisseur?.adresse,
      ice:currFournisseur?.ice,
    }
  });

  const onSubmit = async (data) => {
    const Data = { ...data, id: currFournisseur.id };
    toast.promise(
      (async () => {
        const response = await axios.put("/api/fournisseurs", Data);
        if (response.status === 409) {
          console.log("response.status === 409");
        }
        if (!response) {
          throw new Error("Failed to add client");
        }
        console.log("Client ajouté avec succès");
        reset();
        getFournisseurs();
        setOpen(false);
      })(),
      {
        loading: "Modification en cours...",
        success: "Fournisseur modifier avec succès!",
        error: "Échec de la modification!",
      }
    );
  };

  return (
    <>
      <Card className="w-full grid gap-2 h-full px-2">
        <CardHeader className="flex-col justify-start">
          <CardTitle className="my-3">Modifier un fournisseur</CardTitle>
          <CardDescription className="my-5">
            Modifier les informations du fournisseur ici. Cliquez sur modifer
            lorsque vous avez terminé.
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
                Nom*
              </Label>
              <div className="w-full">
                <Input
                  id="nom"
                  name="nom"
                  {...register("nom")}
                  className={`col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0 ${
                    errors.nom && "border-red-500 border-2"
                  }`}                  spellCheck={false}
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
                Téléphone secondaire
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
            <SaveButton disabled={isSubmitting} type="submit" title="Enregistrer" />
          </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
