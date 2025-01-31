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


export function ClientFormDialog({ getClients, clientList }) {
  const clientSchema = z.object({
    nom: z.string().min(1, "Veuillez insérer le nom du client"),
    email: z
      .preprocess((email) => {
        // If email is empty or undefined, return null
        return email === "" ? null : email;
      }, z.string().email("Email invalide").nullable())
      .refine(
        (email) => {
          // If email is null, skip the uniqueness check
          if (email === null) return true;
          // Check if the email already exists in the client list
          return !clientList?.map((client) => client.email?.toLowerCase()).includes(email?.toLowerCase());
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
          return !clientList
            ?.map((client) => client.telephone)
            .includes(newTelephone);
        },
        {
          // Message when the telephone is not unique
          message: "Ce téléphone existe déjà",
        }
      ),
      adresse: z.string().optional(),
  });

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors , isSubmitting},
  } = useForm({
    resolver: zodResolver(clientSchema),
  });

  const onSubmit = async (data) => {
    toast.promise(
      (async () => {
        try {
          const response = await fetch("/api/clients", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          if (!response.ok) {
            throw new Error("Failed to add commande");
          }
          getClients();
          reset();
          if (response.status === 200) {
            // Assuming 201 is the success status code
            console.log("Client ajouté avec succès");
            getClients();
            reset();
          } else {
            throw new Error("Unexpected response status");
          }
        } catch (error) {
          console.log(error);
        }
      })(),
      {
        loading: "Ajout de client...",
        success: "Client ajouté avec succès!",
        error: "Échec de l'ajout du client",
      }
    );
  };

  return (
    <Card className="w-full grid gap-2 h-full px-2">
      <CardHeader className="flex-col justify-start">
        <CardTitle className="my-3">Ajouter un nouveau client</CardTitle>
        <CardDescription className="my-5">
          Remplissez les informations du nouveau client ici. Cliquez sur
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
                  className={`w-full  focus-visible:ring-purple-300 focus-visible:ring-offset-0 ${
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
                Email
              </Label>
              <div className="col-span-1">
                <Input
                  id="email"
                  {...register("email")}
                  className={`w-full  focus-visible:ring-purple-300 focus-visible:ring-offset-0 ${
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
                  className={`w-full  focus-visible:ring-purple-300 focus-visible:ring-offset-0 ${
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
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
                spellCheck={false}
              />
            </div>
            <SaveButton disabled={isSubmitting} type="submit" title="Enregistrer" />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
