"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Pen } from "lucide-react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast, { Toaster } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const soldeSchema = z.object({
  solde: z.preprocess((value) => {
    // Convert "" or undefined to undefined
    if (value === "" || value === undefined) return undefined;

    // Convert string with comma to dot notation
    if (typeof value === "string") {
      value = value.replace(",", ".");
      // Remove any whitespace that might interfere
      value = value.trim();
    }

    const number = parseFloat(value);
    // If the conversion fails, return undefined to trigger the validation error
    if (isNaN(number)) return undefined;

    return number;
  }, z.number({ invalid_type_error: "Ce champ doit contenir un nombre valide" }).optional()),
});

export default function UpdateCaisseSolde({ solde }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    reset,
    watch,
    handleSubmit,
    setValue,
    formState: { errors, isSubmiting },
  } = useForm({
    resolver: zodResolver(soldeSchema),
  });
  const queryClient = useQueryClient();
  const updateSoldeCaisse = useMutation({
    mutationFn: async (data) => {
      const loadingToast = toast.loading("Modification en cours...");
      try {
        const response = await axios.put("/api/solde-caisse", data);
        toast.success("Articl ajouté avec succès!");
        return response.data;
      } catch (error) {
        toast.error("Échec de l'ajout du articl");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statistiques"] });
    },
  });
  const onSubmit = async (data) => {
    updateSoldeCaisse.mutate(data);
    console.log("solde modifier:", data);
    setOpen(false);
    reset();
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            onClick={() => {
              console.log("caisse clicked");
            }}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
          >
            <Pen className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] caret-transparent">
          <DialogHeader>
            <DialogTitle>Modifier le solde de la caisse</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="relative w-full flex flex-col items-start gap-3">
            <Label htmlFor="montant" className="text-left mb-2 mb-2">
              Solde :
            </Label>
            <div className="relative grid grid-cols-1 items-center gap-4 w-full">
              <Input
                {...register("solde")}
                defaultValue={solde}
                id="montant"
                name="montant"
                className="col-span-3 focus-visible:ring-purple-500"
                onChange={(e) => setValue("solde",e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-center bg-slate-100 border rounded-r-md">
                <span className="text-sm text-gray-600">MAD</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => onSubmit({solde: watch("solde")})}
              className="bg-[#00e701] hover:bg-[#00e701] shadow-lg hover:scale-105 text-white text-md rounded-full font-bold transition-all duration-300 transform"
              type="submit"
              //isSubmiting={isSubmiting}
              disabled={isSubmiting}
            >
              {isSubmiting ? "En cours..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
