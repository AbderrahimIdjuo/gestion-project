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

export function ModifyFournisseurDialog({currFournisseur , getFournisseurs }) { 
    const {
      register,
      reset,
      handleSubmit,
      setError,
      formState: { errors },
    } = useForm();

  const onSubmit = async (data) => {   
    const Data = {...data , id : currFournisseur.id }
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
        getFournisseurs()
        setOpen(false)
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
                  Nom
                </Label>
                <div className="w-full">
                  <Input
                    id="nom"
                    name="nom"
                    {...register("nom")}
                    defaultValue={currFournisseur.nom?.toUpperCase()}
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
                <Label htmlFor="email" className="text-left mb-2 mb-2">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  {...register("email")}
                  defaultValue={currFournisseur.email}
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
                  defaultValue={currFournisseur.telephone}
                  className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
                />
              </div>
              <div className="w- full grid grid-cols-1">
                <Label htmlFor="adresse" className="text-left mb-2 mb-2">
                  Adresse
                </Label>
                <Input
                  id="adresse"
                  name="adresse"
                  {...register("adresse")}
                  defaultValue={currFournisseur.adresse}
                  className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
                />
              </div>
              <SaveButton type="submit" title="Enregistrer" />
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
