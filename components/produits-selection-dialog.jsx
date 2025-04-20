"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Check, Plus, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import axios from "axios";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingDots } from "@/components/loading-dots";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";

export function ArticleSelectionDialog({ open, onOpenChange, onArticlesAdd }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticles, setSelectedArticles] = useState({});
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { ref, inView } = useInView();

  const handleToggleArticle = (article) => {
    setSelectedArticles((prev) => {
      const newSelected = { ...prev };
      if (newSelected[article.id]) {
        delete newSelected[article.id];
      } else {
        newSelected[article.id] = {
          ...article,
          quantite: 1,
        };
      }
      return newSelected;
    });
  };

  const handleQuantityChange = (articleId, delta) => {
    setSelectedArticles((prev) => {
      const currentQty = prev[articleId]?.quantite || 0;
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
    const { value } = e.target;
    setSelectedArticles((prev) => {
      return {
        ...prev,
        [articleId]: {
          ...prev[articleId],
          quantite: parseInt(value, 10) || 1,
        },
      };
    });
  };
  const handleAddItems = () => {
    const articlesToAdd = Object.values(selectedArticles)
      .filter((article) => article.quantite > 0)
      .map(
        ({
          id,
          designation,
          prixVente,
          prixUnite,
          quantite,
          stock,
          fournisseurId,
          categorie,
          description,
        }) => ({
          id,
          designation: designation,
          prixUnite: prixUnite || prixVente,
          quantite,
          stock,
          fournisseurId,
          categorie,
          description,
        })
      );

    onArticlesAdd(articlesToAdd);
    setSelectedArticles({});
    onOpenChange(false);
  };

  const totalQuantity = Object.values(selectedArticles).reduce(
    (sum, item) => sum + (item.quantite || 0),
    0
  );

  const selectedCount = Object.keys(selectedArticles).length;

  // infinite scrolling produits comboBox
  const {
    data,
    fetchNextPage,
    isLoading,
    isFetchingNextPage,
    isFetching,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["produits", debouncedQuery],
    queryFn: async ({ pageParam = null }) => {
      const response = await axios.get("/api/produits/infinitPagination", {
        params: {
          limit: 10,
          query: debouncedQuery,
          cursor: pageParam,
        },
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || null,
    keepPreviousData: true,
  });

  const produits = data?.pages.flatMap((page) => page.produits) || [];

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] p-0 gap-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className="flex flex-col rounded-lg">
          <div className="p-4 border-b">
            <span className="font-semibold">Ajouter les produits </span>
          </div>
          <div className="h-[600px] flex gap-3 gap-2 px-4 ">
            <div className="w-full h-full">
              <div className="relative p-4">
                <Search className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Chercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full text-left rounded-lg focus:!ring-purple-500"
                />
                <div className="absolute mt-1 right-10 top-1/3 h-4 w-4 -translate-y-1/2 text-muted-foreground">
                  {isFetching && !isLoading && <LoadingDots />}
                </div>
              </div>
              <div className="h-[510px] space-y-2">
                <ScrollArea className="h-[100%] w-full">
                  {produits?.length > 0 ? (
                    produits?.map((article) => (
                      <div
                        key={article.id}
                        className={cn(
                          "flex items-center justify-between p-3 my-1 rounded-lg cursor-pointer transition-colors w-full",
                          selectedArticles[article.id]
                            ? "bg-purple-50 text-violet-700"
                            : "hover:bg-gray-50"
                        )}
                        onClick={() => handleToggleArticle(article)}
                      >
                        <div className="space-y-1">
                          <p className="text-md font-medium">
                            {article.designation}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Prix d&apos;unité: {article.prixVente.toFixed(2)}{" "}
                            MAD
                          </p>
                        </div>
                        <div
                          className={cn(
                            "h-5 w-5 rounded-full hover:bg-green-500 border flex items-center justify-center transition-colors",
                            selectedArticles[article.id]
                              ? "bg-green-500 "
                              : "hover:bg-gray-50"
                          )}
                        >
                          {selectedArticles[article.id] && (
                            <Check className="h-3 w-3  text-purple-100" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-center mt-5">
                      <LoadingDots size={8} />
                    </div>
                  )}
                  <div
                    key="observer"
                    ref={ref}
                    className="flex justify-center p-2"
                  ></div>
                </ScrollArea>
              </div>
            </div>

            <div className=" border-l border-gray-300 w-full">
              <div className="h-[550px] pl-3 pb-4">
                <div className="flex items-center gap-2 my-3">
                  <h3 className="font-medium">Produits selectioner</h3>
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-purple-50 text-violet-700"
                  >
                    {selectedCount}
                  </Badge>
                </div>
                <ScrollArea className="h-[100%] w-full mt-3">
                  <div className="space-y-3 ">
                    {Object.values(selectedArticles).map((article) => (
                      <div
                        key={article.id}
                        className="flex items-center justify-between p-3 border rounded-lg w-full"
                      >
                        <span className="font-medium">
                          {article.designation}
                        </span>
                        <div className="flex items-center gap-2 ">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => handleQuantityChange(article.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            id="quantite"
                            name="quantite"
                            value={article.quantite}
                            onChange={(e) => handleInputChange(e, article.id)}
                            className="w-20 text-center focus:!ring-purple-500"
                          />
                          {/* <span className="w-8 text-center">{article.quantity}</span> */}
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => handleQuantityChange(article.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="p-4 border-t">
          <Button
            className="rounded-full"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            onClick={handleAddItems}
            disabled={totalQuantity === 0}
            className="bg-purple-500 hover:bg-purple-600 text-white rounded-full"
          >
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

{
  /* <DialogHeader>
<DialogTitle className="flex items-center justify-between p-4 text-lg font-semibold border-b">
  Ajouter les produits
</DialogTitle>
<DialogDescription></DialogDescription>
</DialogHeader>

<div className="grid grid-cols-2 gap-0 h-[500px]">

<div className="h-[450px]  p-4">
  <div className="relative mb-4">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground " />
    <Input
      placeholder="Chercher un produit..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="pl-9 w-full text-left rounded-r-md focus:!ring-purple-500"
    />
    <div className="absolute right-6 top-1/3 h-4 w-4 -translate-y-1/2 text-muted-foreground">
      {isFetching && !isLoading && <LoadingDots />}
    </div>
  </div>
  <div className="h-[500px] space-y-2">
    <ScrollArea className="h-[84%] w-48  w-full">
      {produits?.length > 0 ? (
        produits?.map((article) => (
          <div
            key={article.id}
            className={cn(
              "flex items-center justify-between p-3 my-1 rounded-lg cursor-pointer transition-colors w-[95%]",
              selectedArticles[article.id]
                ? "bg-purple-100 border border-purple-300"
                : "hover:bg-gray-50"
            )}
            onClick={() => handleToggleArticle(article)}
          >
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {article.designation}
              </p>
              <p className="text-sm text-muted-foreground">
                Prix d&apos;unité: {article.prixVente.toFixed(2)} MAD
              </p>
            </div>
            <div
              className={cn(
                "h-5 w-5 rounded-full hover:bg-green-500 border flex items-center justify-center transition-colors",
                selectedArticles[article.id]
                  ? "bg-green-500 "
                  : "hover:bg-gray-50"
              )}
            >
              {selectedArticles[article.id] && (
                <Check className="h-3 w-3  text-purple-100" />
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="flex justify-center mt-5">
          <LoadingDots size={8} />
        </div>
      )}
      <div
        key="observer"
        ref={ref}
        className="flex justify-center p-2"
      ></div>
    </ScrollArea>
  </div>
</div>

<div className="h-[450px] p-4">
  <div className="flex items-center gap-2 mb-4">
    <h3 className="font-medium">produits selectioner</h3>
    <Badge variant="secondary" className="rounded-full">
      {selectedCount}
    </Badge>
  </div>
  <ScrollArea className="h-[100%] w-full">
    <div className="space-y-3">
      {Object.values(selectedArticles).map((article) => (
        <div
          key={article.id}
          className="flex items-center justify-between p-3 border rounded-lg w-[95%]"
        >
          <span className="font-medium">{article.designation}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={() => handleQuantityChange(article.id, -1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              id="quantite"
              name="quantite"
              value={article.quantite}
              onChange={(e) => handleInputChange(e, article.id)}
              className="w-20 text-center focus:!ring-purple-500"
            />

            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={() => handleQuantityChange(article.id, 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  </ScrollArea>
</div>
</div>

<DialogFooter className="p-4 border-t">
<Button
  className="rounded-full"
  variant="outline"
  onClick={() => onOpenChange(false)}
>
  Annuler
</Button>
<Button
  onClick={handleAddItems}
  disabled={totalQuantity === 0}
  className="bg-purple-500 hover:bg-purple-600 text-white rounded-full"
>
  Ajouter
</Button>
</DialogFooter> */
}
