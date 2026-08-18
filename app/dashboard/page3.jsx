"use client";
import { BasicCard } from "@/components/customUi/BasicCardDashBoard";
import PeriodeFilter from "@/components/customUi/periode-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/functions";
import { getDateRangeFromPeriode } from "@/lib/periode";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { isValid } from "date-fns";
import {
  CircleDollarSign,
  HandCoins,
  Package,
  ScrollText,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";

export default function DashboardPage() {
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [periode, setPeriode] = useState("ce-mois");

  const { from, to } = getDateRangeFromPeriode(periode, startDate, endDate);
  const statistiques = useQuery({
    queryKey: ["statistiques", startDate, endDate, periode],
    queryFn: async () => {
      const response = await axios.get("/api/statistiques", {
        params: {
          from: from && isValid(from) ? from.toISOString() : null,
          to: to && isValid(to) ? to.toISOString() : null,
        },
      });
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  return (
    <>
      <div className="h-full flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <PeriodeFilter
            periode={periode}
            onPeriodeChange={setPeriode}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            id="periode-dashboard-page3"
          />
        </div>
        <div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          id="header-cards"
        >
          <Card className="bg-gradient-to-tr from-fuchsia-400 via-purple-500 to-violet-600 overflow-hidden shadow-md border-0 col-span-full lg:col-span-1 order-first transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-lg font-medium text-white">
                Sold
              </CardTitle>
              <TrendingUp className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="pb-3">
              {statistiques.isLoading || statistiques.isFetching ? (
                <Skeleton className="h-8 w-[200px] bg-purple-200" />
              ) : (
                <div className="text-3xl font-bold text-white mb-3">
                  {formatCurrency(
                    statistiques.data?.recettes - statistiques.data?.depenses
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-tr from-emerald-300 via-emerald-400 to-emerald-500 overflow-hidden shadow-md border-0 col-span-full lg:col-span-1 order-first transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-lg font-medium text-white ">
                Total des recettes
              </CardTitle>
              <CircleDollarSign className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="pb-3">
              {statistiques.isLoading || statistiques.isFetching ? (
                <Skeleton className="h-8 w-[200px] bg-green-200" />
              ) : (
                <div className="text-3xl font-bold text-white mb-3">
                  {formatCurrency(statistiques.data?.recettes)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-tr from-red-300 via-red-400 to-red-500 overflow-hidden shadow-md border-0 col-span-full lg:col-span-1 order-first transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-lg font-medium text-white ">
                Total des dépenses
              </CardTitle>
              <HandCoins className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="pb-3">
              {statistiques.isLoading || statistiques.isFetching ? (
                <Skeleton className="h-8 w-[200px] bg-red-200" />
              ) : (
                <div className="text-3xl font-bold text-white mb-3">
                  {formatCurrency(statistiques.data?.depenses)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          id="Basic-cards"
        >
          <BasicCard
            title="Clients"
            statistiques={statistiques.data?.nbrClients}
            Icon={Users}
            isLoading={statistiques.isLoading || statistiques.isFetching}
          />
          <BasicCard
            title="Fournisseurs"
            statistiques={statistiques.data?.nbrFournisseurs}
            Icon={Users}
            isLoading={statistiques.isLoading || statistiques.isFetching}
          />
          <BasicCard
            title="Produits"
            statistiques={statistiques.data?.nbrProduits}
            Icon={Package}
            isLoading={statistiques.isLoading || statistiques.isFetching}
          />
          <BasicCard
            title="Commandes de fournitures"
            statistiques={statistiques.data?.nbrCommandes}
            Icon={Truck}
            isLoading={statistiques.isLoading || statistiques.isFetching}
          />
          <BasicCard
            title="Bon de livraison"
            statistiques={statistiques.data?.nbrBonLivraison}
            Icon={ScrollText}
            isLoading={statistiques.isLoading || statistiques.isFetching}
          />

          <BasicCard
            title="Caisse"
            statistiques={formatCurrency(statistiques.data?.caisse)}
            Icon={Wallet}
            isLoading={statistiques.isLoading || statistiques.isFetching}
          />
          <BasicCard
            title="Compte personnel"
            statistiques={formatCurrency(statistiques.data?.comptePersonnel)}
            Icon={Wallet}
            isLoading={statistiques.isLoading || statistiques.isFetching}
          />
          <BasicCard
            title="Compte professionnel"
            statistiques={formatCurrency(
              statistiques.data?.compteProfessionnel
            )}
            Icon={Wallet}
            isLoading={statistiques.isLoading || statistiques.isFetching}
          />
        </div>
      </div>
    </>
  );
}
