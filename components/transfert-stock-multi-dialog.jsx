"use client";

import { EntrepotSelect } from "@/components/entrepot-select";
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
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { ArrowRightLeft, Check, Minus, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useInView } from "react-intersection-observer";

function stockInEntrepot(article, entrepotId) {
  if (!entrepotId) return 0;
  const row = article?.stocksEntrepot?.find(s => s.entrepotId === entrepotId);
  return Number(row?.quantite ?? 0);
}

export function TransfertStockMultiDialog() {
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
  const [sourceId, setSourceId] = useState("");
  const [destId, setDestId] = useState("");

  const handleToggleArticle = article => {
    const available = stockInEntrepot(article, sourceId);
    if (available <= 0) {
      toast.error("Aucun stock dans l'entrepôt source pour ce produit.");
      return;
    }
    setSelectedArticles(prev => {
      const next = { ...prev };
      if (next[article.id]) {
        delete next[article.id];
      } else {
        next[article.id] = {
          ...article,
          quantite: Math.min(1, available),
          available,
        };
      }
      return next;
    });
  };

  const handleQuantityChange = (articleId, delta) => {
    setSelectedArticles(prev => {
      const currentQty = parseFloat(prev[articleId]?.quantite) || 0;
      const max = Number(prev[articleId]?.available) || 0;
      const newQty = Math.min(max, Math.max(0, currentQty + delta));
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
    const parsed = parseFloat(value);
    setSelectedArticles(prev => {
      const max = Number(prev[articleId]?.available) || 0;
      const capped =
        value === "" || Number.isNaN(parsed)
          ? value
          : Math.min(max, Math.max(0, parsed));
      return {
        ...prev,
        [articleId]: {
          ...prev[articleId],
          quantite: capped,
        },
      };
    });
  };

  const handleTransfer = async () => {
    if (!sourceId || !destId) {
      toast.error("Sélectionnez l'entrepôt source et destination.");
      return;
    }
    if (sourceId === destId) {
      toast.error("La source et la destination doivent être différentes.");
      return;
    }

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
      await axios.post("/api/produits/transfert", {
        entrepotSourceId: sourceId,
        entrepotDestId: destId,
        items,
      });
      toast.success("Transfert effectué.");
      queryClient.invalidateQueries({ queryKey: ["produits"] });
      setSelectedArticles({});
      setOpen(false);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Échec du transfert."
      );
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
      queryKey: [
        "produits",
        "transfert-dialog",
        debouncedQuery,
        filters.categorie,
        sourceId,
      ],
      queryFn: async ({ pageParam = null }) => {
        const response = await axios.get("/api/produits/infinitPagination", {
          params: {
            limit: 12,
            query: debouncedQuery,
            cursor: pageParam,
            categorie: filters.categorie,
            entrepotId: sourceId || undefined,
          },
        });
        return response.data;
      },
      getNextPageParam: lastPage => lastPage.nextCursor || null,
      keepPreviousData: true,
      enabled: open && !!sourceId,
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
          setSourceId("");
          setDestId("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-amber-600/40 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:text-amber-950 rounded-full"
        >
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Transférer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1000px] p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>Transférer du stock</DialogTitle>
          <DialogDescription>
            Choisissez l&apos;entrepôt source et destination, puis les produits
            et quantités à déplacer.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-3 shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EntrepotSelect
            label="Entrepôt source"
            value={sourceId}
            onValueChange={value => {
              setSourceId(value);
              setSelectedArticles({});
            }}
            placeholder="Source…"
          />
          <EntrepotSelect
            label="Entrepôt destination"
            value={destId}
            onValueChange={setDestId}
            placeholder="Destination…"
          />
        </div>
        <div className="flex flex-col min-h-0 flex-1 border-t">
          <div className="flex flex-col md:flex-row gap-0 min-h-[420px] flex-1">
            <div className="w-full md:w-1/2 flex flex-col min-h-0 border-b md:border-b-0 md:border-r">
              <div className="relative px-4 pt-3 pb-2 shrink-0">
                <Select
                  value={filters.categorie}
                  onValueChange={value =>
                    setFilters({ ...filters, categorie: value })
                  }
                  disabled={!sourceId}
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
                  disabled={!sourceId}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isFetching && !isLoading && <LoadingDots />}
                </div>
              </div>
              <ScrollArea className="flex-1 min-h-[280px] px-2">
                {!sourceId ? (
                  <p className="text-center text-muted-foreground text-sm py-12">
                    Sélectionnez d&apos;abord un entrepôt source.
                  </p>
                ) : isLoading ? (
                  <div className="flex justify-center py-10">
                    <LoadingDots size={8} />
                  </div>
                ) : produits?.length > 0 ? (
                  <>
                    {produits.map(article => {
                      const available = stockInEntrepot(article, sourceId);
                      return (
                        <button
                          type="button"
                          key={article.id}
                          className={cn(
                            "flex w-full items-center justify-between p-3 my-1 rounded-lg text-left transition-colors",
                            selectedArticles[article.id]
                              ? "bg-amber-50 text-amber-900"
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
                                Stock source :{" "}
                                <span className="font-medium text-foreground">
                                  {available.toLocaleString("fr-FR", {
                                    maximumFractionDigits: 2,
                                  })}
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
                                ? "bg-amber-500 border-amber-500"
                                : "border-muted-foreground/30"
                            )}
                          >
                            {selectedArticles[article.id] && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                    <div ref={ref} className="h-4" />
                  </>
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-12">
                    Aucun produit en stock dans cet entrepôt.
                  </p>
                )}
              </ScrollArea>
            </div>

            <div className="w-full md:w-1/2 flex flex-col min-h-0 px-4 pt-3">
              <div className="flex items-center gap-2 mb-3 shrink-0">
                <h3 className="font-medium text-sm">Produits à transférer</h3>
                <Badge
                  variant="secondary"
                  className="rounded-full bg-amber-50 text-amber-800"
                >
                  {selectedCount}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {totalQuantity.toLocaleString("fr-FR", {
                    maximumFractionDigits: 2,
                  })}{" "}
                  u.
                </span>
              </div>
              <ScrollArea className="flex-1 min-h-[240px] pr-2">
                <div className="space-y-2 pb-4">
                  {Object.values(selectedArticles).map(article => (
                    <div
                      key={article.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">
                          {article.designation}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          Dispo. :{" "}
                          {Number(article.available ?? 0).toLocaleString(
                            "fr-FR",
                            { maximumFractionDigits: 2 }
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          Qté
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => handleQuantityChange(article.id, -1)}
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
                          onClick={() => handleQuantityChange(article.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {selectedCount === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Cliquez sur des produits à gauche pour les transférer.
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
              className="rounded-full bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleTransfer}
              disabled={
                !sourceId ||
                !destId ||
                sourceId === destId ||
                selectedCount === 0 ||
                totalQuantity <= 0 ||
                isSubmitting
              }
            >
              {isSubmitting ? "En cours…" : "Transférer"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
