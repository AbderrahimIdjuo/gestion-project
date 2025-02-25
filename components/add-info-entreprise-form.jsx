"use fournisseur";

import { useEffect } from "react";
import { addInfoEntreprise } from "@/app/api/actions";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleX } from "lucide-react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";

export function AddInfoEntrepriseForm({ isOpen, onClose, onConfirm }) {
  const infoEntrepriseSchema = z.object({
    nom: z.string().min(1, "champ obligatoir"),
    slogan: z.string().optional(),
    telephone: z.preprocess((telephone) => {
      // If telephone is empty or undefined, return null
      return telephone === "" ? null : telephone;
    }, z.string().length(10, "Téléphone doit contenir 10 chiffres").regex(/^\d+$/, "Téléphone doit contenir des chiffres")),
    mobile: z
      .preprocess((telephone) => {
        // If telephone is empty or undefined, return null
        return telephone === "" ? null : telephone;
      }, z.string().length(10, "Téléphone doit contenir 10 chiffres").regex(/^\d+$/, "Téléphone doit contenir des chiffres"))
      .nullable(),
    email: z.string().email("Email invalide").nullable(),
    adresse: z.string().min(1, "champ obligatoir"),
  });
  const getInfoEntreprise = async () => {
    const response = await axios.get("/api/infoEntreprise");
    const infoEntreprise = response.data.infoEntreprise;
    console.log("infoEntreprise : ", infoEntreprise);
    return infoEntreprise;
  };

  const query = useQuery({
    queryKey: ["infoEntreprise"],
    queryFn: getInfoEntreprise,
  });

  const {
    register,
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(infoEntrepriseSchema),
  });

  const queryClient = useQueryClient();
  const addInfosEntreprise = useMutation({
    mutationFn: async (data) => {
      const loadingToast = toast.loading("Ajout des informations...");
      try {
        await addInfoEntreprise(data);
        toast.success("Informations ajouté avec succès");
      } catch (error) {
        toast.error("Échec de l'ajout!");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["infoEntreprise"] });
      reset();
      onClose();
    },
  });
  const onSubmit = async (data) => {
    addInfosEntreprise.mutate(data);
  };
  useEffect(() => {
    if (query.data) {
      reset({
        nom: query.data[0]?.nom || "",
        slogan: query.data[0]?.slogan || "",
        telephone: query.data[0]?.telephone || "",
        mobile: query.data[0]?.mobile || "",
        email: query.data[0]?.email || "",
        adresse: query.data[0]?.adresse || "",
      });
    }
  }, [query.data, reset]);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Informations de la société</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <form
          className="w-full h-[80%] grid gap-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="rounded-lg  h-full w-full col-span-3 p-5">
            <div className="flex gap-3 justify-between">
              <div className="w-full grid grid-cols-1 my-4">
                <Label htmlFor="nom" className="text-left mb-2 mb-2">
                  Raison sociale
                </Label>
                <div className="w-full">
                  <Input
                    id="nom"
                    {...register("nom")}
                    className={`w-full focus-visible:ring-purple-500 ${
                      errors.nom &&
                      "border-red-300 border-2 focus-visible:!ring-red-500"
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
              <div className="w-full grid grid-cols-1 my-4">
                <Label htmlFor="slogan" className="text-left mb-2 mb-2">
                  Slogan
                </Label>
                <div className="w-full">
                  <Input
                    id="slogan"
                    {...register("slogan")}
                    className={`w-full focus-visible:ring-purple-500 ${
                      errors.slogan && "border-red-500 border-2"
                    }`}
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-between">
              <div className="w-full grid grid-cols-1 my-4">
                <Label htmlFor="telephone" className="text-left mb-2 mb-2">
                  Téléphone
                </Label>
                <div className="w-full">
                  <Input
                    id="telephone"
                    {...register("telephone")}
                    className={`w-full focus-visible:ring-purple-500 ${
                      errors.telephone && "border-red-500 border-2"
                    }`}
                    spellCheck={false}
                  />
                </div>
              </div>
              <div className="w-full grid grid-cols-1 my-4">
                <Label htmlFor="mobile" className="text-left mb-2 mb-2">
                  Mobile
                </Label>
                <div className="w-full">
                  <Input
                    id="mobile"
                    {...register("mobile")}
                    className={`w-full focus-visible:ring-purple-500 ${
                      errors.mobile && "border-red-500 border-2"
                    }`}
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>
            <div className="w-full grid grid-cols-1 my-4 flex-grow-1">
              <Label htmlFor="email" className="text-left mb-2 mb-2">
                Email
              </Label>
              <div className="w-full">
                <Input
                  id="email"
                  {...register("email")}
                  className={`w-full focus-visible:ring-purple-500 ${
                    errors.email && "border-red-500 border-2"
                  }`}
                  spellCheck={false}
                />
              </div>
            </div>
            <div className="w-full grid grid-cols-1 my-4 flex-grow-2">
              <Label htmlFor="adresse" className="text-left mb-2 mb-2">
                Adresse
              </Label>
              <div className="w-full">
                <Input
                  id="adresse"
                  {...register("adresse")}
                  className={`w-full focus-visible:ring-purple-500 ${
                    errors.adresse && "border-red-500 border-2"
                  }`}
                  spellCheck={false}
                />
              </div>
            </div>
          </div>
          <div className="col-span-3 flex justify-end gap-3 sm:gap-2">
            <Button
              type="button"
              className="rounded-full"
              variant="outline"
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-emerald-300 hover:bg-emerald-400 "
              variant="default"
              onClick={() => {
                onConfirm();
                infoEntrepriseSchema.parse(watch());
              }}
            >
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
