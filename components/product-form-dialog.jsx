"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import axios from "axios";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleX } from "lucide-react";
import { useInView } from "react-intersection-observer";
import {
  useQuery,
  useQueryClient,
  useInfiniteQuery,
  useMutation,
} from "@tanstack/react-query";

export function ProductFormDialog() {
  const [open, setOpen] = useState(false);
  const productSchema = z.object({
    designation: z.string().min(1, "Champ obligatoire"),
    categorie: z.string().optional(),
    prixAchat: z.preprocess((value) => {
      if (value === "" || value === undefined) return undefined; // Handle empty input
      return typeof value === "string" ? parseFloat(value) : value;
    }, z.number({ invalid_type_error: "Le prix d'achat doit être un nombre" }).optional().default(0)),
    stock: z.preprocess(
      (value) => {
        if (value === "" || value === undefined) return undefined; // Handle empty input
        if (typeof value === "string") {
          return parseFloat(value.replace(",", ".")); // Replace comma with dot
        }
        return value;
      },
      z
        .number()
        .refine(
          (value) => Number.isInteger(value), // Ensure the value is an integer
          { message: "Le stock doit être un entier" } // Custom error message
        )
        .optional()
        .default(0)
    ),
    reference : z.string().optional(),
    description: z.string().optional(),
  });
  const {
    register,
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
  });
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { ref, inView } = useInView();
  const [searchQuery, setSearchQuery] = useState("");

  const queryClient = useQueryClient();

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await axios.get("/api/categoriesProduits");
      const categories = response.data.categories;
      return categories;
    },
  });

  const ajouterProduit = useMutation({
    mutationFn: async (data) => {
      const loadingToast = toast.loading("Ajout de produit...");
      try {
        const response = await axios.post("/api/produits", data);
        toast.success("Produit ajouté avec succès!");
        return response.data;
      } catch (error) {
        toast.error("Échec de l'ajout du produit");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      reset();
      setValue("categorie", "");
      queryClient.invalidateQueries(["produits"]);
    },
  });

  const onSubmit = async (data) => {
    ajouterProduit.mutate(data);
  };

  // infinite scrolling fournisseurs comboBox
  const { data, fetchNextPage, isLoading, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["fournisseurs", debouncedQuery],
      queryFn: async ({ pageParam = null }) => {
        const response = await axios.get(
          "/api/fournisseurs/infinitPagination",
          {
            params: {
              limit: 10,
              query: debouncedQuery,
              cursor: pageParam,
            },
          }
        );

        return response.data;
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor || null,
      keepPreviousData: true,
    });

  const fournisseurs = data?.pages.flatMap((page) => page.fournisseurs) || [];

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 rounded-full">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un produit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>Nouveau produit</DialogTitle>
                <DialogDescription>
                Remplissez les informations du nouveau produit ici. Cliquez sur
                enregistrer lorsque vous avez terminé.
                </DialogDescription>
              </DialogHeader>
              <div className="w-full grid gap-6 my-4">
            <div className="w-full grid grid-cols-1">
              <Label htmlFor="nom" className="text-left mb-3">
                Désignation*
              </Label>
              <Input
                id="designation"
                name="designation"
                {...register("designation")}
                className={`col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500 ${
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
              <Label htmlFor="reference" className="text-left mb-3">
                Référence
              </Label>
              <Input
                id="reference"
                name="reference"
                {...register("reference")}
                className={`col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500 ${
                  errors.reference && "border-red-500 border-2"
                }`}
                spellCheck={false}
              />
              {errors.reference && (
                <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                  <CircleX className="h-4 w-4" />
                  {errors.reference.message}
                </p>
              )}
            </div>
            <div className="w-full grid grid-cols-1">
              <Label htmlFor="categorie" className="text-left mb-2 mb-2">
                Catégorie
              </Label>
              <Select
                name="categorie"
                onValueChange={(value) => setValue("categorie", value)}
                value={watch("categorie")}
              >
                <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                  <SelectValue placeholder="Sélectionner ..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.data?.map((element) => (
                    <SelectItem key={element.id} value={element.categorie}>
                      {element.categorie}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-full grid grid-cols-1">
              <Label htmlFor="prixAchat" className="text-left mb-2 mb-2">
                Prix
              </Label>
              <div className="relative grid grid-cols-1 items-center gap-4">
                <Input
                  id="prixAchat"
                  name="prixAchat"
                  {...register("prixAchat")}
                  className={`col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500 ${
                    errors.prixAchat && "border-red-500 border-2"
                  }`}
                />
                <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-center bg-slate-100 border rounded-r-md">
                  <span className="text-sm text-gray-600">MAD</span>
                </div>
              </div>
              {errors.prixAchat && (
                <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                  <CircleX className="h-4 w-4" />
                  {errors.prixAchat.message}
                </p>
              )}
            </div>
            <div className="relative w-full grid grid-cols-1">
              <Label htmlFor="stock" className="text-left mb-2 mb-2">
                Stock
              </Label>
              <Input
                id="stock"
                name="stock"
                {...register("stock")}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500"
              />
              {errors.stock && (
                <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                  <CircleX className="h-4 w-4" />
                  {errors.stock.message}
                </p>
              )}
            </div>
            <div className="relative w-full grid grid-cols-1">
              <Label htmlFor="description" className="text-left mb-2 mb-2">
                Description
              </Label>
              <Textarea
                {...register("description")}
                className="col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500"
              />
            </div>
          </div>
              <DialogFooter>
                <Button
                  className="bg-[#00e701] hover:bg-[#00e701] shadow-lg hover:scale-105 text-white text-md rounded-full font-bold transition-all duration-300 transform"
                  type="submit"
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
