"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Check, Plus, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import axios from "axios";

export function ArticleSelectionDialog({ open, onOpenChange, onArticlesAdd }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticles, setSelectedArticles] = useState({});
  const [products, setProducts] = useState(null);

  const filteredArticles = products?.filter((article) =>
    article.designation.toLowerCase().includes(searchQuery.toLowerCase())
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
  const getProducts = async () => {
    const result = await axios.get("/api/produits");
    const { produits } = result.data;
    setProducts(produits);
    // setIsLoading(false);
    console.log("liste de produits :", produits);
  };

  useEffect(() => {
    getProducts();
  }, []);

  const handleQuantityChange = (articleId, delta) => {
    setSelectedArticles((prev) => {
      console.log("quantity", prev[articleId]?.quantity);

      const currentQty = prev[articleId]?.quantity || 0;
      const newQty = Math.max(0, currentQty + delta);

      if (newQty === 0) {
        const { [articleId]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [articleId]: {
          ...prev[articleId],
          quantity: newQty,
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
          quantity: parseInt(value, 10),
        },
      };
    });
  };
  const handleAddItems = () => {
    const articlesToAdd = Object.values(selectedArticles)
      .filter((article) => article.quantity > 0)
      .map(({ id, designation, prixVente, quantity }) => ({
        id,
        details: designation,
        rate: prixVente,
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
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between p-4 text-lg font-semibold border-b">
            Ajouter les prouduits
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-0 h-[500px]">
          {/* Left side - Item list */}
          <div className="border-r p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground " />
              <Input
                placeholder="Chercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full text-left rounded-r-md focus:!ring-purple-500"
              />
            </div>

            <div className="space-y-2">
              {filteredArticles?.map((article) => (
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
                    <p className="text-sm font-medium">{article.designation}</p>
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
                      id="quantity"
                      name="quantity"
                      value={article.quantity}
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
