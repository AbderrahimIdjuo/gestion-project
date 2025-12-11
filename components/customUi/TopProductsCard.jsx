import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/functions";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { isValid } from "date-fns";
import { Package } from "lucide-react";
import { useState } from "react";
import CustomTooltip from "./customTooltip";

// Fonction pour obtenir la couleur selon le rang
function getRankColor(index) {
  const colors = [
    {
      bg: "bg-emerald-500",
      text: "text-white",
      border: "border-emerald-200",
      bgLight: "bg-emerald-50",
      textDark: "text-emerald-700",
      textMedium: "text-emerald-600",
    },
    {
      bg: "bg-lime-500",
      text: "text-white",
      border: "border-lime-200",
      bgLight: "bg-lime-50",
      textDark: "text-lime-700",
      textMedium: "text-lime-600",
    },
    {
      bg: "bg-yellow-500",
      text: "text-white",
      border: "border-yellow-200",
      bgLight: "bg-yellow-50",
      textDark: "text-yellow-700",
      textMedium: "text-yellow-600",
    },
    {
      bg: "bg-amber-500",
      text: "text-white",
      border: "border-amber-200",
      bgLight: "bg-amber-50",
      textDark: "text-amber-700",
      textMedium: "text-amber-600",
    },
    {
      bg: "bg-orange-500",
      text: "text-white",
      border: "border-orange-200",
      bgLight: "bg-orange-50",
      textDark: "text-orange-700",
      textMedium: "text-orange-600",
    },
  ];

  return index < 5
    ? colors[index]
    : {
        bg: "bg-primary/10",
        text: "text-primary",
        border: "border-transparent",
        bgLight: "hover:bg-muted/50",
        textDark: "",
        textMedium: "text-muted-foreground",
      };
}

export default function TopProductsCard({ from, to }) {
  const [sortBy, setSortBy] = useState("montant");
  const { data: topProduits, isLoading } = useQuery({
    queryKey: ["topProduits", sortBy, from, to],
    queryFn: async () => {
      const response = await axios.get("/api/statistiques/topProduits", {
        params: {
          from: from && isValid(from) ? from.toISOString() : null,
          to: to && isValid(to) ? to.toISOString() : null,
          sortBy: sortBy,
        },
      });
      console.log(response.data.produitsPlusAchetes);
      return response.data.produitsPlusAchetes;
    },
    refetchOnWindowFocus: false,
  });
  if (isLoading) {
    return (
      <Card className="w-full shadow-md border-0">
        <CardHeader className="grid grid-cols-3 items-center justify-between space-y-0 pb-2 pt-4 mb-2">
          <CardTitle className="text-lg font-medium">
            Produits les plus achetés
          </CardTitle>
          <div className="flex items-center justify-end gap-3 col-span-2 w-full">
            <span className="font-medium">Trier par</span>
            <Skeleton className="h-9 w-[120px]" />
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-3">
            {[...Array(10)].map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!topProduits || topProduits.length === 0) {
    return (
      <Card className="w-full shadow-md border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
          <CardTitle className="text-lg font-medium">
            Produits les plus achetés
          </CardTitle>
          <Package className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-muted-foreground text-center py-4">
            Aucun produit acheté dans cette période
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-md border-0">
      <CardHeader className="grid grid-cols-3 items-center justify-between space-y-0 pb-2 pt-4 mb-2">
        <CardTitle className="text-lg font-medium">
          Produits les plus achetés
        </CardTitle>
        <div className="flex items-center justify-end gap-3 col-span-2 w-full">
          <span className="font-medium">Trier par</span>

          <Select value={sortBy} onValueChange={value => setSortBy(value)}>
            <SelectTrigger className="max-w-[120px] focus:ring-2 focus:ring-purple-500">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="montant">Montant</SelectItem>
              <SelectItem value="quantite">Quantité</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-3">
          {topProduits.slice(0, 10).map((produit, index) => {
            const rankColor = getRankColor(index);
            return (
              <div
                key={produit.id}
                className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                  index < 5
                    ? `${rankColor.bgLight} border ${rankColor.border}`
                    : rankColor.bgLight
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${rankColor.bg} ${rankColor.text}`}
                  >
                    {index + 1}
                  </div>
                  <div className="max-w-[200px]">
                    <CustomTooltip message={produit.designation}>
                      <p
                        className={`font-medium text-sm truncate ${
                          index < 5 ? rankColor.textDark : ""
                        }`}
                      >
                        {produit.designation}
                      </p>
                    </CustomTooltip>
                    {produit.categorie && (
                      <p
                        className={`text-xs ${
                          index < 5
                            ? rankColor.textMedium
                            : "text-muted-foreground"
                        }`}
                      >
                        {produit.categorie}
                      </p>
                    )}
                  </div>
                </div>
                {sortBy === "montant" ? (
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {formatCurrency(produit.totalMontant)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {produit.totalQuantite} unités
                    </p>
                  </div>
                ) : (
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {" "}
                      {produit.totalQuantite} unités
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(produit.totalMontant)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
