"use client";

import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import axios from "axios";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleX } from "lucide-react";
import {
  useQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";

export function ArticlForm({ isOpen, onClose, onConfirm }) {
  const articlSchema = z.object({
    designation: z.string().min(1, "Champ obligatoire"),
    categorieId: z.string().optional().nullable(),
  });
  const {
    register,
    watch,
    reset,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(articlSchema),
  });
  const queryClient = useQueryClient();
  const ajouterArticl = useMutation({
    mutationFn: async (data) => {
      const loadingToast = toast.loading("Ajout de articl...");
      try {
        const response = await axios.post("/api/articls", data);
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
      queryClient.invalidateQueries(["articls"]);
      reset();
    },
  });

  const onSubmit = async (data) => {
    ajouterArticl.mutate(data);
    console.log("save clicked!");

    onConfirm();
    articlSchema.parse(watch());
  };
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await axios.get("/api/categoriesProduits");
      const categories = response.data.categories;
      return categories;
    },
  });
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau articl</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <form
          className="w-full h-[80%] grid gap-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="w-full grid grid-cols-1 my-5">
            <Label htmlFor="nom" className="text-left text-black mb-2 mb-2">
              Désignation*
            </Label>
            <Input
              id="designation"
              name="designation"
              {...register("designation", {
                required: "Ce champ est obligatoire",
              })}
              className={`max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl col-span-3 focus-visible:ring-purple-300 text-slate-700 focus-visible:ring-purple-500 ${
                errors.designation && "border-red-500 border-2"
              }`}
              spellCheck={false}
            />
            {errors.designation && (
              <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                <CircleX className="h-4 w-4" />
                {errors.designation.message}
              </p>
            )}
          </div>
          <div className="w-full grid grid-cols-1">
            <Label htmlFor="categorieId" className="text-left mb-2 mb-2">
              Catégorie
            </Label>
            <Select
              name="categorieId"
              onValueChange={(value) => setValue("categorieId", value)}
              value={watch("categorieId")}
            >
              <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                <SelectValue placeholder="Sélectionner ..." />
              </SelectTrigger>
              <SelectContent>
                {categories.data?.map((element) => (
                  <SelectItem key={element.id} value={element.id}>
                    {element.categorie}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              className="rounded-full"
              variant="outline"
              onClick={onClose}
              type="button"
            >
              Annuler
            </Button>
            <Button
              className="rounded-full bg-green-300 hover:bg-green-500 text-white"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
