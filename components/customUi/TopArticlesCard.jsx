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
import { ScrollText } from "lucide-react";
import { useState } from "react";
import CustomTooltip from "./customTooltip";
// Fonction pour obtenir la couleur selon le rang
function getRankColor(index) {
  const colors = [
    {
      bg: "bg-blue-500",
      text: "text-white",
      border: "border-blue-200",
      bgLight: "bg-blue-50",
      textDark: "text-blue-700",
      textMedium: "text-blue-600",
    },
    {
      bg: "bg-indigo-500",
      text: "text-white",
      border: "border-indigo-200",
      bgLight: "bg-indigo-50",
      textDark: "text-indigo-700",
      textMedium: "text-indigo-600",
    },
    {
      bg: "bg-purple-500",
      text: "text-white",
      border: "border-purple-200",
      bgLight: "bg-purple-50",
      textDark: "text-purple-700",
      textMedium: "text-purple-600",
    },
    {
      bg: "bg-pink-500",
      text: "text-white",
      border: "border-pink-200",
      bgLight: "bg-pink-50",
      textDark: "text-pink-700",
      textMedium: "text-pink-600",
    },
    {
      bg: "bg-rose-500",
      text: "text-white",
      border: "border-rose-200",
      bgLight: "bg-rose-50",
      textDark: "text-rose-700",
      textMedium: "text-rose-600",
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

export default function TopArticlesCard({ from, to }) {
  const [sortBy, setSortBy] = useState("montant");
  const { data: topArticles, isLoading } = useQuery({
    queryKey: ["topArticles", sortBy, from, to],
    queryFn: async () => {
      const response = await axios.get("/api/statistiques/topArticles", {
        params: {
          from: from && isValid(from) ? from.toISOString() : null,
          to: to && isValid(to) ? to.toISOString() : null,
          sortBy: sortBy,
        },
      });
      return response.data.articlesPlusVendus;
    },
    refetchOnWindowFocus: false,
  });
  if (isLoading) {
    return (
      <Card className="w-full shadow-md border-0">
        <CardHeader className="grid grid-cols-3 items-center justify-between space-y-0 pb-2 pt-4 mb-2">
          <CardTitle className="text-lg font-medium">
            Articles les plus vendus
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
                  <Skeleton className="h-4 w-32" />
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

  if (!topArticles || topArticles.length === 0) {
    return (
      <Card className="w-full shadow-md border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
          <CardTitle className="text-lg font-medium">
            Articles les plus vendus
          </CardTitle>
          <ScrollText className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-muted-foreground text-center py-4">
            Aucun article vendu dans cette période
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-md border-0">
      <CardHeader className="grid grid-cols-3 items-center justify-between space-y-0 pb-2 pt-4 mb-2">
        <CardTitle className="text-lg font-medium">
          Articles les plus vendus
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
          {topArticles.slice(0, 10).map((article, index) => {
            const rankColor = getRankColor(index);
            return (
              <div
                key={article.id}
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
                    <CustomTooltip message={article.designation}>
                      <p
                        className={`font-medium text-sm truncate ${
                          index < 5 ? rankColor.textDark : ""
                        }`}
                      >
                        {article.designation}
                      </p>
                    </CustomTooltip>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">
                    {sortBy === "montant"
                      ? formatCurrency(article.totalMontant)
                      : `Qté : ${article.totalQuantite}`}
                  </p>
                  <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                    <span>
                      {sortBy === "montant"
                        ? `Qté : ${article.totalQuantite}`
                        : formatCurrency(article.totalMontant)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
