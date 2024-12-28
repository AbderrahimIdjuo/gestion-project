"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import axios from "axios";
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

export function ModifyClientDialog({ children, currClient, getClients }) {
  const { register, reset, handleSubmit } = useForm();
  const [open, setOpen] = useState(false);

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
        reset();
        getClients();
        setOpen(false);
      })(),
      {
        loading: "Modification en cours...",
        success: "Client modifier avec succès!",
        error: "Échec de la modification!",
      }
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier un client</DialogTitle>
            <DialogDescription>
              Modifier les informations du client ici. Cliquez sur modifer
              lorsque vous avez terminé.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nom" className="text-right">
                  Nom
                </Label>
                <Input
                  id="nom"
                  {...register("nom")}
                  defaultValue={currClient.nom?.toUpperCase()}
                  className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  defaultValue={currClient.email}
                  className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="telephone" className="text-right">
                  Téléphone
                </Label>
                <Input
                  id="telephone"
                  type="tel"
                  {...register("telephone")}
                  defaultValue={currClient.telephone}
                  className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="adresse" className="text-right">
                  Adresse
                </Label>
                <Input
                  id="adresse"
                  {...register("adresse")}
                  defaultValue={currClient.adresse}
                  className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-offset-0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                className="bg-[#4ade80] hover:bg-[#22c55e] text-white"
              >
                Modifier
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
