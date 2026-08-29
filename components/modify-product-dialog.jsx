"use client";
import { useState, useEffect } from "react";
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
import { Pen } from "lucide-react";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CircleX } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CategoriesSelectMenu } from "@/components/select-categories-produits";
import { entrepotBadgeClass } from "@/lib/entrepot-badge";

export function ModifyProductDialog({
  currProduct,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? onOpenChange : setUncontrolledOpen;
  const queryClient = useQueryClient();
  const [stocksByEntrepot, setStocksByEntrepot] = useState({});

  const entrepots = useQuery({
    queryKey: ["entrepots"],
    queryFn: async () => {
      const response = await axios.get("/api/entrepots");
      return response.data.entrepots || [];
    },
    enabled: open,
  });
  const productSchema = z.object({
    id: z.string(),
    designation: z.string().min(1, "Champ obligatoire"),
    categorieId: z.string().optional().nullable(),
    prixAchat: z.preprocess((value) => {
      if (value === "" || value === undefined) return undefined; // Handle empty input
      return typeof value === "string" ? parseFloat(value) : value;
    }, z.number({ invalid_type_error: "Le prix d'achat doit être un nombre" }).optional()),
    reference: z.string().optional(),
    unite: z.string().optional(),
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
      categorieId: currProduct?.categorieId || currProduct?.categorieProduits?.id,
      prixAchat: currProduct?.prixAchat,
      unite: currProduct?.Unite,
      reference: currProduct?.reference,
    },
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    if (open && currProduct) {
      reset({
        id: currProduct.id,
        designation: currProduct.designation,
        categorieId:
          currProduct.categorieId || currProduct.categorieProduits?.id,
        prixAchat: currProduct.prixAchat,
        unite: currProduct.Unite,
        reference: currProduct.reference,
      });
      const next = {};
      for (const s of currProduct.stocksEntrepot || []) {
        if (s.entrepotId) {
          next[s.entrepotId] = String(s.quantite ?? 0);
        }
      }
      setStocksByEntrepot(next);
    }
  }, [open, currProduct, reset]);
  
  const uniteList = ["ML", "M²", "U"];
  const modifierProduit = useMutation({
    mutationFn: async (data) => {
      const loadingToast = toast.loading("Modification du produit...");
      try {
        const response = await axios.put("/api/produits", data);
        toast.success("Produit modifié avec succès!");
        return response.data;
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Échec de la modification du produit"
        );
        throw error;
      } finally {
        toast.dismiss(loadingToast);
      }
    },
    onSuccess: () => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["produits"] });
    },
  });

  const onSubmit = async (data) => {
    if (!entrepots.data) {
      toast.error("Chargement des entrepôts…");
      return;
    }
    const stocksEntrepot = entrepots.data.map(entrepot => ({
      entrepotId: entrepot.id,
      quantite:
        parseFloat(
          String(stocksByEntrepot[entrepot.id] ?? "0").replace(",", ".")
        ) || 0,
    }));
    await modifierProduit.mutateAsync({ ...data, stocksEntrepot });
  };

  const stockTotal = (entrepots.data || []).reduce((sum, entrepot) => {
    const q =
      parseFloat(
        String(stocksByEntrepot[entrepot.id] ?? "0").replace(",", ".")
      ) || 0;
    return sum + q;
  }, 0);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {!hideTrigger && (
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-purple-100 hover:text-purple-600"
              onClick={e => e.stopPropagation()}
            >
              <Pen className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        )}
        <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Modifier produit</DialogTitle>
              <DialogDescription>
                Modifier les informations du nouveau produit ici. Cliquez sur
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
                <Label htmlFor="categorieId" className="text-left mb-2 mb-2">
                  Catégorie
                </Label>
                <CategoriesSelectMenu
                  categorie={watch("categorieId")}
                  setCategorie={(value) => {
                    setValue("categorieId", value);
                  }}
                />
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
              <div className="w-full grid grid-cols-1">
                <Label className="text-left mb-2">Stock par entrepôt</Label>
                {entrepots.isLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement…</p>
                ) : (entrepots.data || []).length > 0 ? (
                  <div className="space-y-2 rounded-md border px-3 py-3">
                    {(entrepots.data || []).map(entrepot => (
                      <div
                        key={entrepot.id}
                        className="flex items-center gap-3"
                      >
                        <span
                          className={`inline-flex min-w-0 flex-1 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${entrepotBadgeClass(
                            entrepot.id
                          )}`}
                        >
                          <span className="truncate">{entrepot.nom}</span>
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={stocksByEntrepot[entrepot.id] ?? "0"}
                          onChange={e =>
                            setStocksByEntrepot(prev => ({
                              ...prev,
                              [entrepot.id]: e.target.value,
                            }))
                          }
                          className="w-24 h-8 text-right tabular-nums focus-visible:ring-purple-500"
                        />
                      </div>
                    ))}
                    <div className="flex justify-between gap-2 border-t pt-2 mt-1 text-sm font-medium">
                      <span>Total</span>
                      <span className="tabular-nums">
                        {stockTotal.toLocaleString("fr-FR", {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucun entrepôt. Créez-en un dans Paramètres.
                  </p>
                )}
              </div>
              <div className="w-full grid grid-cols-1">
                <Label htmlFor="unite" className="text-left mb-2 mb-2">
                  Unité
                </Label>
                <Select
                  name="unite"
                  onValueChange={(value) => setValue("unite", value)}
                  value={watch("unite")}
                  //defaultValue={watch("unite")}
                >
                  <SelectTrigger className="col-span-3 bg-white focus:ring-purple-500">
                    <SelectValue placeholder="Sélectionner ..." />
                  </SelectTrigger>
                  <SelectContent>
                    {uniteList.map((element, index) => (
                      <SelectItem key={index} value={element}>
                        {element}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                className="bg-[#00e701] hover:bg-[#00e701] shadow-lg hover:scale-105 text-white text-md rounded-full font-bold transition-all duration-300 transform"
                type="submit"
                disabled={
                  isSubmitting ||
                  modifierProduit.isPending ||
                  entrepots.isLoading
                }
              >
                {isSubmitting || modifierProduit.isPending
                  ? "En cours..."
                  : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
