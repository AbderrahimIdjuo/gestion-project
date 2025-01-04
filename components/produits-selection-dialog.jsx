"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Check, Plus, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mock data for articles with MAD currency
const articles = [
  { id: 1, nom: "chausseur", prix: 250.0 },
  { id: 2, nom: "chemise", prix: 200.0 },
  { id: 3, nom: "pantalon 1", prix: 120.0 },
  { id: 4, nom: "veste", prix: 300.0 },
  { id: 5, nom: "cravate", prix: 80.0 },
];

export function ArticleSelectionDialog({ open, onOpenChange, onArticlesAdd }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticles, setSelectedArticles] = useState({});

  const filteredArticles = articles.filter((article) =>
    article.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleArticle = (article) => {
    setSelectedArticles((prev) => {
      const newSelected = { ...prev };
      if (newSelected[article.id]) {
        delete newSelected[article.id];
      } else {
        newSelected[article.id] = {
          ...article,
          quantity: 1,
        };
      }
      return newSelected;
    });
  };

  // const handleQuantityChange = (articleId, delta) => {
  //   setSelectedArticles((prev) => {
  //     const currentQty = prev[articleId]?.quantity || 0;
  //     const newQty = Math.max(0, currentQty + delta);

  //     if (newQty === 0) {
  //       const { [articleId]: _, ...rest } = prev;
  //       return rest;
  //     }

  //     return {
  //       ...prev,
  //       [articleId]: {
  //         ...prev[articleId],
  //         quantity: newQty,
  //       },
  //     };
  //   });
  // };

  const handleAddItems = () => {
    const articlesToAdd = Object.values(selectedArticles)
      .filter((article) => article.quantity > 0)
      .map(({ id, nom, prix, quantity }) => ({
        id,
        details: nom,
        rate: prix,
        quantity,
      }));

    onArticlesAdd(articlesToAdd);
    setSelectedArticles({});
    onOpenChange(false);
  };

  const totalQuantity = Object.values(selectedArticles).reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  const selectedCount = Object.keys(selectedArticles).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 gap-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Ajouter les prouduits</h2>
        </div>

        <div className="grid grid-cols-2 gap-0 h-[500px]">
          {/* Left side - Item list */}
          <div className="border-r p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Chercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>

            <div className="space-y-2">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                    selectedArticles[article.id]
                      ? "bg-purple-100 border border-purple-300"
                      : "hover:bg-gray-50"
                  )}
                  onClick={() => handleToggleArticle(article)}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{article.nom}</p>
                    <p className="text-sm text-muted-foreground">
                      Prix d&apos;unité: {article.prix.toFixed(2)} MAD
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
              ))}
            </div>
          </div>

          {/* Right side - Selected items */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-medium">produits selectioner</h3>
              <Badge variant="secondary" className="rounded-full">
                {selectedCount}
              </Badge>
            </div>

            <div className="space-y-3">
              {Object.values(selectedArticles).map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <span className="font-medium">{article.nom}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-full"
                      onClick={() => handleQuantityChange(article.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{article.quantity}</span>
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
          </div>
        </div>

        <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleAddItems}
            disabled={totalQuantity === 0}
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
