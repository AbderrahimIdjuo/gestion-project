"use client";

import { LoadingDots } from "@/components/loading-dots";
import { Badge } from "@/components/ui/badge";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Check, Minus, PackagePlus, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useInView } from "react-intersection-observer";

export function AjouterStockProduitsDialog() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticles, setSelectedArticles] = useState({});
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { ref, inView } = useInView();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    categorie: "all",
  });

  const handleToggleArticle = article => {
    setSelectedArticles(prev => {
      const next = { ...prev };
      if (next[article.id]) {
        delete next[article.id];
      } else {
        next[article.id] = {
          ...article,
          quantite: 1,
          categorie:
            article.categorieProduits?.categorie || article.categorie,
        };
      }
      return next;
    });
  };

  const handleQuantityChange = (articleId, delta) => {
    setSelectedArticles(prev => {
      const currentQty = parseFloat(prev[articleId]?.quantite) || 0;
      const newQty = Math.max(0, currentQty + delta);
      if (newQty === 0) {
        const { [articleId]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [articleId]: {
          ...prev[articleId],
          quantite: newQty,
        },
      };
    });
  };

  const handleInputChange = (e, articleId) => {
    const value = e.target.value.replace(",", ".");
    setSelectedArticles(prev => ({
      ...prev,
      [articleId]: {
        ...prev[articleId],
        quantite: value,
      },
    }));
  };

  const handleApplyStock = async () => {
    const items = Object.values(selectedArticles)
      .map(a => ({
        produitId: a.id,
        quantite: parseFloat(String(a.quantite).replace(",", ".")) || 0,
      }))
      .filter(i => i.quantite > 0);

    if (items.length === 0) {
      toast.error("Indiquez au moins une quantité supérieure à 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post("/api/produits/stock", { items });
      toast.success("Stock mis à jour.");
      queryClient.invalidateQueries({ queryKey: ["produits"] });
      setSelectedArticles({});
      setOpen(false);
    } catch {
      toast.error("Échec de la mise à jour du stock.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalQuantity = Object.values(selectedArticles).reduce((sum, item) => {
    const q = parseFloat(String(item.quantite).replace(",", ".")) || 0;
    return sum + (q > 0 ? q : 0);
  }, 0);

  const selectedCount = Object.keys(selectedArticles).length;

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await axios.get("/api/categoriesProduits");
      return response.data.categories;
    },
  });

  const { data, fetchNextPage, isLoading, isFetching, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["produits", "stock-dialog", debouncedQuery, filters.categorie],
      queryFn: async ({ pageParam = null }) => {
        const response = await axios.get("/api/produits/infinitPagination", {
          params: {
            limit: 12,
            query: debouncedQuery,
            cursor: pageParam,
            categorie: filters.categorie,
          },
        });
        return response.data;
      },
      getNextPageParam: lastPage => lastPage.nextCursor || null,
      keepPreviousData: true,
      enabled: open,
    });

  const produits = data?.pages.flatMap(page => page.produits) || [];

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        setOpen(next);
        if (!next) {
          setSelectedArticles({});
          setSearchQuery("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-emerald-600/40 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 rounded-full"
        >
          <PackagePlus className="mr-2 h-4 w-4" />
          Ajouter des produits en stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1000px] p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>Ajouter du stock</DialogTitle>
          <DialogDescription>
            Sélectionnez les produits et les quantités à ajouter au stock
            actuel, puis validez.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col min-h-0 flex-1 border-t">
          <div className="flex flex-col md:flex-row gap-0 min-h-[420px] flex-1">
            <div className="w-full md:w-1/2 flex flex-col min-h-0 border-b md:border-b-0 md:border-r">
              <div className="relative px-4 pt-3 pb-2 shrink-0">
                <Select
                  value={filters.categorie}
                  onValueChange={value =>
                    setFilters({ ...filters, categorie: value })
                  }
                >
                  <SelectTrigger className="bg-white focus:ring-purple-500">
                    <SelectValue placeholder="Catégorie…" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.data?.map(element => (
                      <SelectItem key={element.id} value={element.categorie}>
                        {element.categorie}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative px-4 pb-2 shrink-0">
                <Search className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-lg focus-visible:ring-purple-500"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isFetching && !isLoading && <LoadingDots />}
                </div>
              </div>
              <ScrollArea className="flex-1 min-h-[280px] px-2">
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <LoadingDots size={8} />
                  </div>
                ) : produits?.length > 0 ? (
                  <>
                    {produits.map(article => (
                      <button
                        type="button"
                        key={article.id}
                        className={cn(
                          "flex w-full items-center justify-between p-3 my-1 rounded-lg text-left transition-colors",
                          selectedArticles[article.id]
                            ? "bg-purple-50 text-violet-800"
                            : "hover:bg-gray-50"
                        )}
                        onClick={() => handleToggleArticle(article)}
                      >
                        <div className="space-y-1 min-w-0 pr-2">
                          <p className="text-sm font-medium truncate">
                            {article.designation}
                          </p>
                          <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                            <span>
                              Stock :{" "}
                              <span className="font-medium text-foreground">
                                {Number(article.stock ?? 0).toLocaleString(
                                  "fr-FR",
                                  {
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </span>
                            </span>
                            {article.reference && (
                              <span>Réf. {article.reference}</span>
                            )}
                          </div>
                        </div>
                        <div
                          className={cn(
                            "h-5 w-5 shrink-0 rounded-full border flex items-center justify-center",
                            selectedArticles[article.id]
                              ? "bg-green-500 border-green-500"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {selectedArticles[article.id] && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </button>
                    ))}
                    <div ref={ref} className="h-4" />
                  </>
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-12">
                    Aucun produit trouvé.
                  </p>
                )}
              </ScrollArea>
            </div>

            <div className="w-full md:w-1/2 flex flex-col min-h-0 px-4 pt-3">
              <div className="flex items-center gap-2 mb-3 shrink-0">
                <h3 className="font-medium text-sm">Produits sélectionnés</h3>
                <Badge
                  variant="secondary"
                  className="rounded-full bg-purple-50 text-violet-700"
                >
                  {selectedCount}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  +{totalQuantity.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} u.
                </span>
              </div>
              <ScrollArea className="flex-1 min-h-[240px] pr-2">
                <div className="space-y-2 pb-4">
                  {Object.values(selectedArticles).map(article => (
                    <div
                      key={article.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 border rounded-lg"
                    >
                      <span className="font-medium text-sm flex-1 min-w-0">
                        {article.designation}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          Qté à ajouter
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() =>
                            handleQuantityChange(article.id, -1)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          value={article.quantite}
                          onChange={e => handleInputChange(e, article.id)}
                          className="w-20 text-center h-8 text-sm focus-visible:ring-purple-500"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() =>
                            handleQuantityChange(article.id, 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {selectedCount === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Cliquez sur des produits à gauche pour les ajouter.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t shrink-0 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleApplyStock}
              disabled={selectedCount === 0 || totalQuantity <= 0 || isSubmitting}
            >
              {isSubmitting ? "En cours…" : "Mettre à jour le stock"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
