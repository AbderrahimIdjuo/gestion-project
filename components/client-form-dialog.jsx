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


export function ClientFormDialog({ getClients }) {
  const {
    register,
    reset,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm();

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
          if (error.response && error.response.status === 409) {
            // Handle specific error (phone already registered)
            setError("telephone", {
              message: "Ce numéro de téléphone est déjà enregistré",
            });
          } else {
            throw new Error("Failed to add client");
          }
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
        <form className="w-full h-[80%] grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="w-full grid gap-6 ">
            <div className="w-full grid grid-cols-1">
              <Label htmlFor="nom" className="text-left mb-2 mb-2">
                Nom
              </Label>
              <div className="w-full">
                <Input
                  id="nom"
                  name="nom"
                  {...register("nom", { required: "Nom obligatoir" })}
                  className="w-full  focus-visible:ring-purple-300 focus-visible:ring-offset-0"
                />
                {errors.nom && (
                  <p className="text-red-500 text-sm mt-1">
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
                  type="email"
                  {...register("email")}
                  className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
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
                  {...register("telephone", {
                    required: "Numéro de télé obligatoire",
                    minLength: {
                      value: 10,
                      message: "Le numéro de télé doit contenir 10 chiffres",
                    },
                    maxLength: {
                      value: 10,
                      message: "Le numéro de télé doit contenir 10 chiffres",
                    },
                  })}
                  className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
                />
                {errors.telephone && (
                  <p className="text-red-500 text-sm mt-1">
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
              />
            </div>
            <SaveButton type="submit" title="Enregistrer" />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
