"use client";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Pen } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const soldeSchema = z.object({
  solde: z.preprocess(
    value => {
      if (value === "" || value === undefined || value === null) {
        return undefined;
      }

      if (typeof value === "string") {
        value = value.replace(",", ".").trim();
      }

      const number = parseFloat(value);
      if (isNaN(number)) return undefined;

      return number;
    },
    z.number({
      required_error: "Le solde est requis",
      invalid_type_error: "Ce champ doit contenir un nombre valide",
    })
  ),
});

export default function UpdatSolde({ solde, id }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    reset,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm({
    resolver: zodResolver(soldeSchema),
    defaultValues: { solde },
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      reset({ solde });
    }
  }, [open, solde, reset]);

  const updateSoldeCaisse = useMutation({
    mutationFn: async data => {
      const loadingToast = toast.loading("Modification en cours...");
      try {
        const response = await axios.put("/api/solde-comptes", { ...data, id });
        toast.success("Solde modifié avec succès!");
        return response.data;
      } catch (error) {
        const message =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Échec de la modification";
        toast.error(message);
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comptes"] });
      queryClient.invalidateQueries({ queryKey: ["statistiques"] });
    },
  });

  const onSubmit = async data => {
    await updateSoldeCaisse.mutateAsync(data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
        >
          <Pen className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Modifier le solde du compte</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="relative w-full flex flex-col items-start gap-3 py-4">
            <Label htmlFor="solde" className="text-left mb-2">
              Solde :
            </Label>
            <div className="relative grid grid-cols-1 items-center gap-4 w-full">
              <Input
                {...register("solde")}
                id="solde"
                className="col-span-3 focus-visible:ring-purple-500 pr-14"
              />
              <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-center bg-slate-100 border rounded-r-md">
                <span className="text-sm text-gray-600">MAD</span>
              </div>
            </div>
            {errors.solde && (
              <p className="text-red-500 text-sm">{errors.solde.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              className="bg-[#00e701] hover:bg-[#00e701] shadow-lg hover:scale-105 text-white text-md rounded-full font-bold transition-all duration-300 transform"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "En cours..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
