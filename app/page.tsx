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
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PerformanceChart } from "@/components/performance-chart";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [search, setSearche] = useState(false);
  const statistiques = useQuery({
    queryKey: ["statistiques", search],
    queryFn: async () => {
      const response = await axios.get("/api/statistiques", {
        params: {
          from: startDate,
          to: endDate,
        },
      });
      console.log("statistiques", response.data);

      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  return (
    <>
      <div className="h-full flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex gap-2 justify-between">
            <Select>
              <SelectTrigger className="w-full bg-white focus:ring-purple-500">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">le mois dernier</SelectItem>
                <SelectItem value="dark">les 3 derniers mois</SelectItem>
                <SelectItem value="system">les 6 derniers mois</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* <div className="flex gap-2 justify-between">
            <CustomDateRangePicker
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
            />
            <Button
              onClick={() => setSearche(!search)}
              className="bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-violet-500 rounded-full hover:bg-gradient-to-bl from-fuchsia-500 via-purple-500 to-violet-500  text-white  font-semibold"
            >
              Chercher
            </Button>
          </div> */}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-gradient-to-tr from-fuchsia-400 via-purple-500 to-violet-600 overflow-hidden shadow-md border-0 col-span-full lg:col-span-1 order-first">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-md font-medium text-white">
                Sold
              </CardTitle>
              <TrendingUp className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="pb-3">
              {statistiques.isLoading || statistiques.isFetching ? (
                <Skeleton className="h-6 w-[150px] bg-purple-200" />
              ) : (
                <div className="text-2xl font-bold text-white">
                  {statistiques.data?.recettes - statistiques.data?.depenses} DH
                </div>
              )}
              <div className="flex items-center gap-1  mt-3">
                <ArrowUpRight className="h-5 w-5 text-gray-700" />
                <p className="text-xs text-gray-700">
                  <span>+15.3%</span>
                  <span> par rapport au mois dernier</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-tr from-emerald-300 via-emerald-400 to-emerald-500 overflow-hidden shadow-md border-0 col-span-full lg:col-span-1 order-first">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-md font-medium text-white">
                Total des recettes
              </CardTitle>
              <CircleDollarSign className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="pb-3">
              {statistiques.isLoading || statistiques.isFetching ? (
                <Skeleton className="h-6 w-[150px] bg-green-200" />
              ) : (
                <div className="text-2xl font-bold text-white">
                  {statistiques.data?.recettes} DH
                </div>
              )}

              <div className="flex items-center gap-1 mt-3">
                <ArrowUpRight className="h-5 w-5 text-gray-700" />
                <p className="text-xs text-gray-700">
                  <span>+15.3%</span>
                  <span> par rapport au mois dernier</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-tr from-red-300 via-red-400 to-red-500 overflow-hidden shadow-md border-0 col-span-full lg:col-span-1 order-first">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-md font-medium text-white">
                Total des dépenses
              </CardTitle>
              <HandCoins className="h-6 w-6 text-white" />
            </CardHeader>
            <CardContent className="pb-3">
              {statistiques.isLoading || statistiques.isFetching ? (
                <Skeleton className="h-6 w-[150px] bg-red-200" />
              ) : (
                <div className="text-2xl font-bold text-white">
                  {statistiques.data?.depenses} DH
                </div>
              )}

              <div className="flex items-center gap-1 mt-3">
                <ArrowUpRight className="h-5 w-5 text-gray-700" />
                <p className="text-xs text-gray-700">
                  <span>+15.3%</span>
                  <span> par rapport au mois dernier</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative bg-white overflow-hidden shadow-md">
            <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-violet-500 p-[2px]">
              <div className="absolute inset-0 bg-white"></div>
            </div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-sm font-medium">
                Total Clients
              </CardTitle>
              <Users className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">
                {statistiques.data?.nbrClients}
              </div>
              <div className="flex items-center gap-1">
                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                <p className="text-xs">
                  <span className="text-emerald-500">+20.1%</span>
                  <span className="text-muted-foreground">
                    {" "}
                    par rapport au mois dernier
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="relative bg-white overflow-hidden shadow-md">
            <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-violet-500 p-[2px]">
              <div className="absolute inset-0 bg-white"></div>
            </div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-sm font-medium">Produits</CardTitle>
              <Package className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">
                {" "}
                {statistiques.data?.nbrProduits}
              </div>
              <div className="flex items-center gap-1 ">
                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                <p className="text-xs">
                  <span className="text-emerald-500">+12.5%</span>
                  <span className="text-muted-foreground">
                    {" "}
                    par rapport au mois dernier
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="relative bg-white overflow-hidden shadow-md">
            <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-violet-500 p-[2px]">
              <div className="absolute inset-0 bg-white"></div>
            </div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-sm font-medium">Caisse</CardTitle>
              <Wallet className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">
                {statistiques.data?.caisse} DH
              </div>
              <div className="flex items-center gap-1 ">
                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                <p className="text-xs">
                  <span className="text-emerald-500">+8.2%</span>
                  <span className="text-muted-foreground">
                    {" "}
                    par rapport au mois dernier
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="relative bg-white overflow-hidden shadow-md">
            <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-violet-500 p-[2px]">
              <div className="absolute inset-0 bg-white"></div>
            </div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-sm font-medium">
                Compte personnel
              </CardTitle>
              <Wallet className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">
                {statistiques.data?.comptePersonnel} DH
              </div>
              <div className="flex items-center gap-1 ">
                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                <p className="text-xs">
                  <span className="text-emerald-500">+8.2%</span>
                  <span className="text-muted-foreground">
                    {" "}
                    par rapport au mois dernier
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="relative bg-white overflow-hidden shadow-md">
            <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-violet-500 p-[2px]">
              <div className="absolute inset-0 bg-white"></div>
            </div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-sm font-medium">
                Compte professionnel
              </CardTitle>
              <Wallet className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">
                {statistiques.data?.compteProfessionnel} DH
              </div>
              <div className="flex items-center gap-1 ">
                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                <p className="text-xs">
                  <span className="text-emerald-500">+8.2%</span>
                  <span className="text-muted-foreground">
                    {" "}
                    par rapport au mois dernier
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="relative bg-white overflow-hidden shadow-md">
            <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-violet-500 p-[2px]">
              <div className="absolute inset-0 bg-white"></div>
            </div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-sm font-medium">
                Total Commandes
              </CardTitle>
              <Receipt className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">
                {statistiques.data?.nbrCommandes}
              </div>
              <div className="flex items-center gap-1 ">
                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                <p className="text-xs">
                  <span className="text-emerald-500">+8.2%</span>
                  <span className="text-muted-foreground">
                    {" "}
                    par rapport au mois dernier
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 grid-cols-1 shadow-md">
          <PerformanceChart />
        </div>
      </div>
    </>
  );
}
