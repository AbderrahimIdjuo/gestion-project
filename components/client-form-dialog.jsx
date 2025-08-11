"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleX } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
export function ClientFormDialog() {
  const [open, setOpen] = useState(false);
  const clientSchema = z.object({
    nom: z.string().min(1, "Veuillez insérer le nom du client"),
    titre: z.enum(["M", "Mme", "Mlle", "Sté"]).optional(),
    ice: z.string().optional(),
    email: z.preprocess((email) => {
      // If email is empty or undefined, return null
      return email === "" ? null : email;
    }, z.string().email("Email invalide").nullable()),
    telephone: z.string().optional(),
    mobile: z.string().optional(),
    note: z.string().optional(),
    // dette: z.number().optional(),
    adresse: z.string().optional(),
  });

  const {
    register,
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      titre: "M",
    },
    resolver: zodResolver(clientSchema),
  });

  const queryClient = useQueryClient();
  const onSubmit = async (data) => {
    console.log("data :", data);
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
          queryClient.invalidateQueries(["clients"]);

          reset();
          if (response.status === 200) {
            // Assuming 201 is the success status code
            console.log("Client ajouté avec succès");
            queryClient.invalidateQueries(["clients"]);
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
  const titres = ["M", "Mme", "Mlle", "Sté"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 rounded-full">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Nouveau client</DialogTitle>
            <DialogDescription>
              Remplissez les informations du nouveau client ici. Cliquez sur
              enregistrer lorsque vous avez terminé.
            </DialogDescription>
          </DialogHeader>
          <div className="w-full grid gap-6 my-4">
            <div className="grid md:grid-cols-5 grid-cols-1 gap-4">
              <div className="w-full grid grid-cols-1 col-span-1">
                <Label htmlFor="titre" className="text-left mb-2 mb-2">
                  Titre
                </Label>
                <div className="w-full">
                  <Select
                    defaultValue="M"
                    value={watch("titre")}
                    name="titre"
                    onValueChange={(value) => setValue("titre", value)}
                  >
                    <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {titres.map((titre) => (
                        <SelectItem key={titre} value={titre}>
                          {titre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.titre && (
                    <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                      <CircleX className="h-4 w-4" />
                      {errors.titre.message}
                    </p>
                  )}
                </div>
              </div>
              <div
                className={`w-full grid grid-cols-1 ${
                  watch("titre") === "Sté" ? "md:col-span-3" : "md:col-span-4"
                }`}
              >
                <Label htmlFor="nom" className="text-left mb-2 mb-2">
                  Nom
                </Label>
                <div className="w-full">
                  <Input
                    id="nom"
                    name="nom"
                    {...register("nom")}
                    className={`w-full  focus:!ring-purple-500 ${
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
              {watch("titre") === "Sté" && (
                <div className="w-full grid grid-cols-1 col-span-1">
                  <Label htmlFor="ice" className="text-left mb-2">
                    ICE
                  </Label>

                  <Input
                    id="ice"
                    {...register("ice")}
                    className="col-span-3 focus:!ring-purple-500 "
                    spellCheck={false}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w- full grid grid-cols-1 ">
                <Label htmlFor="telephone" className="text-left mb-2">
                  Téléphone
                </Label>
                <div>
                  <Input
                    id="telephone"
                    type="tel"
                    {...register("telephone")}
                    className={`w-full  focus:!ring-purple-500 ${
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
              <div className="w- full grid grid-cols-1 ">
                <Label htmlFor="mobile" className="text-left mb-2">
                  Mobile
                </Label>
                <div>
                  <Input
                    id="mobile"
                    type="tel"
                    {...register("mobile")}
                    className={`w-full  focus:!ring-purple-500 ${
                      errors.mobile && "border-red-500 border-2"
                    }`}
                  />
                  {errors.mobile && (
                    <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                      <CircleX className="h-4 w-4" />
                      {errors.mobile.message}
                    </p>
                  )}
                </div>
              </div>
              {/* <div className="w- full grid grid-cols-1 md:col-span-2">
                <Label htmlFor="dette" className="text-left mb-2">
                  Dette
                </Label>
                <div>
                  <Input
                    id="dette"
                    type="number"
                    {...register("dette", { valueAsNumber: true })}
                    className={`w-full  focus:!ring-purple-500 ${
                      errors.dette && "border-red-500 border-2"
                    }`}
                  />
                  {errors.dette && (
                    <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                      <CircleX className="h-4 w-4" />
                      {errors.dette.message}
                    </p>
                  )}
                </div>
              </div> */}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w- full grid grid-cols-1">
                <Label htmlFor="email" className="text-left mb-2">
                  Email
                </Label>
                <div className="col-span-1">
                  <Input
                    id="email"
                    {...register("email")}
                    className={`w-full  focus:!ring-purple-500 ${
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
              <div className="w-full grid grid-cols-1">
                <Label htmlFor="adresse" className="text-left mb-2">
                  Adresse
                </Label>

                <Input
                  id="adresse"
                  {...register("adresse")}
                  className="col-span-3 focus:!ring-purple-500"
                  spellCheck={false}
                />
              </div>
            </div>
            <div className="grid gap-2 w-full">
              <Label htmlFor="noteClient" className="text-left text-black">
                Infos supplémentaires
              </Label>
              <Textarea
                name="note"
                {...register("note")}
                className="col-span-3 focus:!ring-purple-500 "
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="bg-[#00e701] hover:bg-[#00e701] shadow-lg hover:scale-105 text-white text-md rounded-full font-bold transition-all duration-300 transform"
              type="submit"
              // isSubmiting={isSubmiting}
              disabled={isSubmitting}
            >
              {isSubmitting ? "En cours..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
