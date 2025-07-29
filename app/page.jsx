"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Package,
  Receipt,
  TrendingUp,
  ArrowUpRight,
  Wallet,
  CircleDollarSign,
  HandCoins,
  Truck,
  ScrollText,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
  startOfQuarter,
  endOfQuarter,
  subQuarters,
  isValid,
} from "date-fns";
import { Label } from "@/components/ui/label";
import { PerformanceChart } from "@/components/performance-chart";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";
import { Skeleton } from "@/components/ui/skeleton";
import { BasicCard } from "@/components/customUi/BasicCardDashBoard";
export default function DashboardPage() {
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [periode, setPeriode] = useState("");

  function formatMontant(montant) {
    if (typeof montant !== "number") return montant;

    return Math.floor(montant)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  function getDateRangeFromPeriode(periode) {
    const now = new Date();

    switch (periode) {
      case "ce-mois":
        return {
          from: startOfMonth(now),
          to: endOfMonth(now),
        };
      case "3-derniers-mois":
        return {
          from: subMonths(startOfMonth(now), 2),
          to: endOfMonth(now),
        };
      case "6-derniers-mois":
        return {
          from: subMonths(startOfMonth(now), 5),
          to: endOfMonth(now),
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
      default:
        return {
          from: new Date(startDate) ?? null,
          to: new Date(endDate) ?? null,
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
      <div className="h-full flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <div className="grid grid-cols-4 items-center gap-2">
            <Label htmlFor="periode" className="text-sm font-medium col-span-1">
              Période :
            </Label>
            <div className="col-span-3">
              <Select
                value={periode}
                onValueChange={(value) => setPeriode(value)}
              >
                <SelectTrigger className="focus:ring-2 focus:ring-purple-500">
                  <SelectValue placeholder="Sélectionnez la période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ce-mois">Ce mois</SelectItem>
                  <SelectItem value="3-derniers-mois">
                    Les 3 derniers mois
                  </SelectItem>
                  <SelectItem value="6-derniers-mois">
                    Les 6 derniers mois
                  </SelectItem>
                  <SelectItem value="cette-annee">Cette année</SelectItem>
                  <SelectItem value="annee-derniere">
                    L&apos;année dernière
                  </SelectItem>
                  <SelectItem value="trimestre-actuel">
                    Trimestre actuel
                  </SelectItem>
                  <SelectItem value="trimestre-precedent">
                    Trimestre précédent
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
                  {formatMontant(
                    statistiques.data?.recettes - statistiques.data?.depenses
                  )}{" "}
                  DH
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
                  {formatMontant(statistiques.data?.recettes)} DH
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
                  {formatMontant(statistiques.data?.depenses)} DH
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
            statistiques={formatMontant(statistiques.data?.caisse) + " DH"}
            Icon={Wallet}
            isLoading={statistiques.isLoading || statistiques.isFetching}
          />
          <BasicCard
            title="Compte personnel"
            statistiques={
              formatMontant(statistiques.data?.comptePersonnel) + " DH"
            }
            Icon={Wallet}
            isLoading={statistiques.isLoading || statistiques.isFetching}
          />
          <BasicCard
            title="Compte professionnel"
            statistiques={
              formatMontant(statistiques.data?.compteProfessionnel) + " DH"
            }
            Icon={Wallet}
            isLoading={statistiques.isLoading || statistiques.isFetching}
          />
        </div>

        {/* <div className="grid gap-4 grid-cols-1 shadow-md">
          <PerformanceChart />
        </div> */}
      </div>
    </>
  );
}
