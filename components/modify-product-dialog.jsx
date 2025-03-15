"use client";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { SaveButton } from "./customUi/styledButton";
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CircleX } from "lucide-react";
import { useInView } from "react-intersection-observer";
import {
  useQuery,
  useQueryClient,
  useInfiniteQuery,
  useMutation,
} from "@tanstack/react-query";
export function ModifyProductDialog({ currProduct }) {
  const [open, setOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { ref, inView } = useInView();
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const productSchema = z.object({
    id: z.string(),
    designation: z.string().min(1, "Champ obligatoire"),
    categorie: z.string().optional(),
    fournisseur: z
      .object({
        id: z.string().uuid(),
        nom: z.string(),
        email: z.string().email(),
        telephone: z.string(),
        adresse: z.string(),
      })
      .optional(),

    prixAchat: z.preprocess((value) => {
      if (value === "" || value === undefined) return undefined; // Handle empty input
      return typeof value === "string" ? parseFloat(value) : value;
    }, z.number({ invalid_type_error: "Le prix d'achat doit être un nombre" }).optional()),
    prixVente: z.preprocess((value) => {
      if (value === "" || value === undefined) return undefined; // Handle empty input
      return typeof value === "string" ? parseFloat(value) : value;
    }, z.number({ invalid_type_error: "Le prix de vente doit être un nombre" }).optional()),
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
    ),
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
    defaultValues: {
      id: currProduct?.id,
      designation: currProduct?.designation,
      categorie: currProduct?.categorie,
      prixAchat: currProduct?.prixAchat,
      prixVente: currProduct?.prixVente,
      stock: currProduct?.stock,
      description: currProduct?.description,
      fournisseur: currProduct?.fournisseur,
    },
    resolver: zodResolver(productSchema),
  });

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await axios.get("/api/categoriesProduits");
      const categories = response.data.categories;
      console.log("categories : ", categories);
      return categories;
    },
  });

  const modifierProduit = useMutation({
    mutationFn: async (data) => {
      const loadingToast = toast.loading("Modification du produit...");
      try {
        const response = await axios.put("/api/produits", data);
        toast.success("Produit modifier avec succès!");
        return response.data;
      } catch (error) {
        toast.error("Échec de la modification du produit");
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      reset();
      queryClient.invalidateQueries(["produits"]);
    },
  });

  const onSubmit = async (data) => {
    modifierProduit.mutate(data);
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
    <>
      <Card className="w-full grid gap-2 h-full px-2">
        <CardHeader className="flex-col justify-start">
          <CardTitle className="my-3">Modifier un produit</CardTitle>
          <CardDescription className="my-5">
            Modifier les informations du produit. Cliquez sur enregistrer
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
              <div className="space-y-2">
                <Label htmlFor="customerName">Fournisseur*</Label>
                <br />
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between mt-2"
                    >
                      {watch("fournisseur")
                        ? watch("fournisseur").nom.toUpperCase()
                        : "Sélectionner ..."}
                      <ChevronDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto min-w-[25vw] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Chercher..."
                        className="h-9"
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList>
                        {isLoading ? (
                          <div className="flex justify-center p-2">
                            <span className="px-5 pb-5 text-gray-400 text-sm text-center">
                              Chargement...
                            </span>
                          </div>
                        ) : fournisseurs.length === 0 ? (
                          <CommandEmpty>
                            <span>Aucun fournisseur trouvé.</span>
                          </CommandEmpty>
                        ) : (
                          <>
                            <ScrollArea className="h-72 w-full">
                              <CommandGroup>
                                {fournisseurs.map((fournisseur) => (
                                  <CommandItem
                                    name="fournisseur"
                                    key={fournisseur.id}
                                    value={fournisseur.nom}
                                    onSelect={() => {
                                      setOpen(false);
                                      setValue("fournisseur", fournisseur);
                                    }}
                                  >
                                    {fournisseur.nom.toUpperCase()}
                                  </CommandItem>
                                ))}
                                <div
                                  ref={ref}
                                  className="flex justify-center p-2"
                                ></div>
                              </CommandGroup>
                              {isFetchingNextPage && (
                                <span className="px-5 pb-5 text-gray-400 text-sm text-center">
                                  Chargement...
                                </span>
                              )}
                            </ScrollArea>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                    <SelectValue placeholder="Sélectionnez une catégorie" />
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
                  Prix d&apos;achat
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
                <Label htmlFor="prixVente" className="text-left mb-2 mb-2">
                  Prix de vente
                </Label>
                <div className="relative z-10 grid grid-cols-1 items-center gap-4">
                  <Input
                    id="prixVente"
                    name="prixVente"
                    {...register("prixVente")}
                    className={`col-span-3 focus-visible:ring-purple-300 focus-visible:ring-purple-500 ${
                      errors.prixVente && "border-red-500 border-2"
                    }`}
                  />
                  <div className="absolute z-0 inset-y-0 right-0 w-12 flex items-center justify-center bg-slate-100 border rounded-r-md">
                    <span className="text-sm text-gray-600">MAD</span>
                  </div>
                </div>
                {errors.prixVente && (
                  <p className="text-red-500 text-sm mt-1 flex gap-1 items-center">
                    <CircleX className="h-4 w-4" />
                    {errors.prixVente.message}
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
            <SaveButton
              disabled={isSubmitting}
              type="submit"
              title="Enregistrer"
            />
          </form>
        </CardContent>
      </Card>
    </>
  );
}
