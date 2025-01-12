"use client";

import toast from "react-hot-toast";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SaveButton } from "./customUi/styledButton";



export function ModifyClientDialog({ currClient, getClients}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    const Data = { ...data, id: currClient.id };
    toast.promise(
      (async () => {
        const response = await axios.put("/api/clients", Data);
        if (response.status === 409) {
          console.log("response.status === 409");
        }
        if (!response) {
          throw new Error("Failed to add client");
        }
        console.log("Client ajouté avec succès");
        getClients();
      })(),
      {
        loading: "Modification en cours...",
        success: "Client modifier avec succès!",
        error: "Échec de la modification!",
      }
    );
  };

  return (
    <Card className="w-full grid gap-2 h-full px-2">
      <CardHeader className="flex-col justify-start">
        <CardTitle className="my-3">Modifier un client</CardTitle>
        <CardDescription className="my-5">
          Modifier les informations du client ici. Cliquez sur enregistrer
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
              <Label htmlFor="nom" className="text-left mb-2">
                Nom
              </Label>
              <div className="w-full">
                <Input
                  id="nom"
                  {...register("nom")}
                  defaultValue={currClient?.nom?.toUpperCase()}
                  className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
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
                  defaultValue={currClient?.email}
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
                  defaultValue={currClient?.telephone}
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
                defaultValue={currClient?.adresse}
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
