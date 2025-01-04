"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { useForm } from "react-hook-form";



export function ClientFormDialog({ children, getClients }) {
  const { register, reset, handleSubmit ,setError ,  formState: { errors } } = useForm();
  const [open, setOpen] = useState(false);
 

  const onSubmit = async (data) => {
    toast.promise(
      (async () => {
        try {
          const response = await axios.post("/api/clients", data);
          
          if (response.status === 200) { // Assuming 201 is the success status code
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
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau client</DialogTitle>
            <DialogDescription>
              Remplissez les informations du nouveau client ici. Cliquez sur
              enregistrer lorsque vous avez terminé.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right">
                Nom
              </Label>
              <div className="col-span-3">
                <Input
                  id="nom"
                  name="nom"
                  {...register("nom", { required: "Nom obligatoir" })}
                  className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
                />
                {errors.nom && <p className="text-red-500 text-sm mt-1">{errors.nom.message}</p>}
              </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <div className="col-span-3">
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="telephone" className="text-right">
                  Téléphone
                </Label>
                <div className="col-span-3">
                <Input
                  id="telephone"
                  type="tel"
                  {...register("telephone",{
                    required : "Numéro de télé obligatoire",
                  minLength:{
                    value : 10,
                    message : "Le numéro de télé doit contenir 10 chiffres"
                  },
                  maxLength:{
                    value : 10,
                    message : "Le numéro de télé doit contenir 10 chiffres"
                  }
                  })}
                  className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
                />
                {errors.telephone && <p className="text-red-500 text-sm mt-1">{errors.telephone.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="adresse" className="text-right">
                  Adresse
                </Label>

                <Input
                  id="adresse"
                  {...register("adresse")}
                  className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
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
    </>
  );
}
