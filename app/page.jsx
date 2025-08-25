"use client";

import { BasicCard } from "@/components/customUi/BasicCardDashBoard";
import TopArticlesCard from "@/components/customUi/TopArticlesCard";
import TopProductsCard from "@/components/customUi/TopProductsCard";
import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { formatCurrency } from "@/lib/functions";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subQuarters,
  subYears,
} from "date-fns";
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
  const [periode, setPeriode] = useState("");
  const connectionStatus = useConnectionStatus();

  function getDateRangeFromPeriode(periode) {
    const now = new Date();

    switch (periode) {
      case "aujourd'hui":
        return {
          from: startOfDay(now),
          to: endOfDay(now),
        };
      case "ce-mois":
        return {
          from: startOfMonth(now),
          to: endOfMonth(now),
        };
      case "mois-dernier":
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return {
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        };
      case "trimestre-actuel":
        return {
          from: startOfQuarter(now),
          to: endOfQuarter(now),
        };
      case "trimestre-precedent":
        const prevQuarter = subQuarters(now, 1);
        return {
          from: startOfQuarter(prevQuarter),
          to: endOfQuarter(prevQuarter),
        };
      case "cette-annee":
        return {
          from: startOfYear(now),
          to: endOfYear(now),
        };
      case "annee-derniere":
        const lastYear = subYears(now, 1);
        return {
          from: startOfYear(lastYear),
          to: endOfYear(lastYear),
        };
      case "personnalisee":
        return {
          from: startDate ? new Date(startDate) : null,
          to: endDate ? new Date(endDate) : null,
        };
      default:
        return {
          from: null,
          to: null,
        };
    }
  }
  const { from, to } = getDateRangeFromPeriode(periode);
  const statistiques = useQuery({
    queryKey: ["statistiques", startDate, endDate, periode],
    queryFn: async () => {
      const response = await axios.get("/api/statistiques", {
        params: {
          from: from && isValid(from) ? from.toISOString() : null,
          to: to && isValid(to) ? to.toISOString() : null,
        },
      });
      // console.log("statistiques", response.data);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  return (
    <>
      <div className="min-h-full flex flex-col space-y-4 pb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="grid grid-cols-4 items-center gap-2">
            <Label htmlFor="periode" className="text-sm font-medium col-span-1">
              Période :
            </Label>
            <div className="col-span-3">
              <Select
                value={periode}
                onValueChange={value => setPeriode(value)}
              >
                <SelectTrigger className="focus:ring-2 focus:ring-purple-500">
                  <SelectValue placeholder="Sélectionnez la période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aujourd'hui">Aujourd&apos;hui</SelectItem>
                  <SelectItem value="ce-mois">Ce mois</SelectItem>
                  <SelectItem value="mois-dernier">Le mois dernier</SelectItem>
                  <SelectItem value="trimestre-actuel">
                    Trimestre actuel
                  </SelectItem>
                  <SelectItem value="trimestre-precedent">
                    Trimestre précédent
                  </SelectItem>
                  <SelectItem value="cette-annee">Cette année</SelectItem>
                  <SelectItem value="annee-derniere">
                    L&apos;année dernière
                  </SelectItem>
                  <SelectItem value="personnalisee">
                    Période personnalisée
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {periode === "personnalisee" && (
            <div className="grid grid-cols-4 items-center gap-2">
              <Label
                htmlFor="statut"
                className="col-span-1 text-left text-black"
              >
                Date :
              </Label>
              <div className="col-span-3">
                <CustomDateRangePicker
                  startDate={startDate}
                  setStartDate={setStartDate}
                  endDate={endDate}
                  setEndDate={setEndDate}
                />
              </div>
            </div>
          )}
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

        {/* Cartes des produits et articles sur la même ligne */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {/* Carte des produits les plus achetés */}
          <TopProductsCard from={from} to={to} />

          {/* Carte des articles les plus vendus */}
          <TopArticlesCard from={from} to={to} />
        </div>

        {/* <div className="grid gap-4 grid-cols-1 shadow-md">
          <PerformanceChart />
        </div> */}
      </div>
    </>
  );
}
