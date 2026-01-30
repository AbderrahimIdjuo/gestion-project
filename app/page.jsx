"use client";

import { BasicCard } from "@/components/customUi/BasicCardDashBoard";
import TopArticlesCard from "@/components/customUi/TopArticlesCard";
import TopProductsCard from "@/components/customUi/TopProductsCard";
import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
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
import { formatCurrency } from "@/lib/functions";
import { SignIn, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  isValid,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subQuarters,
  subYears,
} from "date-fns";
import {
  FileText,
  Landmark,
  Package,
  ScrollText,
  TrendingUp,
  Truck,
  Users,
  Wallet
} from "lucide-react";
import { useState } from "react";

export default function Page() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [periode, setPeriode] = useState("ce-mois");

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
          from: from && isValid(from) ? format(from, "yyyy-MM-dd") : null,
          to: to && isValid(to) ? format(to, "yyyy-MM-dd") : null,
        },
      });
      // console.log("statistiques", response.data);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Logo OUDAOUDOX */}
          <div
            className="flex flex-col justify-center items-center text-center fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="text-center">
              <h1
                className="text-6xl font-black text-slate-700 tracking-tight leading-none slide-in-left opacity-0"
                style={{ animationDelay: "0.4s" }}
              >
                OUDAOUDOX
              </h1>
              <div className="mt-4 flex items-center justify-center">
                <div
                  className="h-1 bg-teal-500 flex-1 max-w-16 scale-in opacity-0"
                  style={{ animationDelay: "0.8s" }}
                ></div>
                <p
                  className="mx-4 text-lg font-semibold text-teal-600 tracking-wide slide-in-right opacity-0"
                  style={{ animationDelay: "0.9s" }}
                >
                  DECORATION - MENUISERIE - TRAVAUX DIVERS
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Clerk SignIn */}
          <div
            className="flex justify-center lg:justify-end slide-in-up opacity-0"
            style={{ animationDelay: "0.6s" }}
          >
            <div className="w-full max-w-md">
              <SignIn
                appearance={{
                  elements: {
                    rootBox: "mx-auto",
                    card: "bg-white/80  backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_18px_70px_rgba(0,0,0,0.35)] overflow-hidden px-6 py-7",
                    headerTitle: "text-slate-700",
                    headerSubtitle: "text-slate-700",
                    form: "space-y-4",
                    formFieldLabel: "text-slate-700",
                    formFieldInput:
                      "bg-white/5 border border-white/15 text-slate-700 placeholder:text-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c8aa6d]/70 focus:border-transparent",
                    socialButtonsBlockButton:
                      "bg-white/10 hover:bg-white/15 text-slate-700 border border-white/10 rounded-xl transition-colors",
                    dividerLine: "bg-white/12",
                    dividerText: "text-slate-700",
                    formButtonPrimary:
                      "bg-slate-600  hover:bg-slate-700  text-white font-medium rounded-lg shadow-md transition-colors",
                    footer: "hidden", // حذف الفوتر والخط
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Animations CSS améliorées */}
        <style jsx>{`
          /* Respect des préférences de réduction de mouvement */
          @media (prefers-reduced-motion: reduce) {
            .fade-in-up,
            .slide-in-left,
            .slide-in-right,
            .slide-in-up,
            .scale-in {
              animation: none !important;
              opacity: 1 !important;
              transform: none !important;
              filter: none !important;
            }
          }

          /* Animation d'entrée depuis le bas avec fade */
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
              filter: blur(5px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
              filter: blur(0);
            }
          }

          /* Animation de glissement depuis la gauche */
          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-50px);
              filter: blur(3px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
              filter: blur(0);
            }
          }

          /* Animation de glissement depuis la droite */
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(50px);
              filter: blur(3px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
              filter: blur(0);
            }
          }

          /* Animation de glissement depuis le bas */
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(40px);
              filter: blur(4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
              filter: blur(0);
            }
          }

          /* Animation d'échelle avec fade */
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scaleX(0);
            }
            to {
              opacity: 1;
              transform: scaleX(1);
            }
          }

          /* Classes d'animation avec timing optimisé */
          .fade-in-up {
            animation: fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
            will-change: transform, opacity, filter;
          }

          .slide-in-left {
            animation: slideInLeft 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)
              both;
            will-change: transform, opacity, filter;
          }

          .slide-in-right {
            animation: slideInRight 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)
              both;
            will-change: transform, opacity, filter;
          }

          .slide-in-up {
            animation: slideInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
            will-change: transform, opacity, filter;
          }

          .scale-in {
            animation: scaleIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
            will-change: transform, opacity;
            transform-origin: left center;
          }

          /* Effet de hover subtil sur le titre */
          h1:hover {
            transform: scale(1.02);
            transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }

          /* Animation de la ligne de séparation */
          .scale-in {
            transform-origin: left center;
          }
        `}</style>
      </div>
    );
  }

  // Utilisateur connecté - afficher le tableau de bord
  return (
    <>
      <div className="flex flex-col h-screen">
        {/* Navbar - prend toute la largeur */}
        <Navbar />

        {/* Container principal avec sidebar et contenu */}
        <div className="flex flex-1">
          {/* Sidebar */}
          <Sidebar />

          {/* Main content area */}
          <div className="flex-1 flex flex-col">
            {/* Page content */}
            <div className="flex-1 overflow-auto">
              <div className="h-full flex flex-col space-y-4 p-6">
                <h1 className="text-3xl font-bold">Tableau de bord</h1>

                {/* Filtre période - bloc dédié */}
                <Card className="border border-slate-200/80 bg-slate-50/50 shadow-sm">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
                      <div className="flex min-w-0 flex-1 items-center gap-3 sm:max-w-xs">
                        <Label
                          htmlFor="periode"
                          className="shrink-0 text-sm font-medium text-slate-700"
                        >
                          Période
                        </Label>
                        <Select
                          value={periode}
                          onValueChange={value => setPeriode(value)}
                        >
                          <SelectTrigger
                            id="periode"
                            className="h-10 w-full rounded-lg border-slate-200 bg-white font-medium text-slate-800 shadow-sm transition-colors hover:border-slate-300 focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                          >
                            <SelectValue placeholder="Sélectionnez la période" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border-slate-200 shadow-lg">
                            <SelectItem value="ce-mois" className="rounded-md">
                              Ce mois
                            </SelectItem>
                            <SelectItem value="3-derniers-mois" className="rounded-md">
                              Les 3 derniers mois
                            </SelectItem>
                            <SelectItem value="6-derniers-mois" className="rounded-md">
                              Les 6 derniers mois
                            </SelectItem>
                            <SelectItem value="cette-annee" className="rounded-md">
                              Cette année
                            </SelectItem>
                            <SelectItem value="annee-derniere" className="rounded-md">
                              L&apos;année dernière
                            </SelectItem>
                            <SelectItem value="trimestre-actuel" className="rounded-md">
                              Trimestre actuel
                            </SelectItem>
                            <SelectItem value="trimestre-precedent" className="rounded-md">
                              Trimestre précédent
                            </SelectItem>
                            <SelectItem value="personnalisee" className="rounded-md">
                              Période personnalisée
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {periode === "personnalisee" && (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                          <Label className="shrink-0 text-sm font-medium text-slate-700">
                            Plage de dates
                          </Label>
                          <div className="min-w-0 flex-1">
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
                  </CardContent>
                </Card>
                <div
                  className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                  id="header-cards"
                >
                  <Card className="bg-gradient-to-tr from-fuchsia-400 via-purple-500 to-violet-600 overflow-hidden shadow-md border-0 col-span-full lg:col-span-1 order-first transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                      <CardTitle className="text-lg font-medium text-white">
                        Bénéfice
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3">
                      {statistiques.isLoading || statistiques.isFetching ? (
                        <Skeleton className="h-8 w-[200px] bg-purple-200" />
                      ) : (
                        <div className="text-3xl font-bold text-white mb-3">
                          {formatCurrency(
                            statistiques.data?.benefice ?? 0
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-tr from-emerald-300 via-emerald-400 to-emerald-500 overflow-hidden shadow-md border-0 col-span-full lg:col-span-1 order-first transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                      <CardTitle className="text-lg font-medium text-white ">
                        Recettes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3">
                      {statistiques.isLoading || statistiques.isFetching ? (
                        <Skeleton className="h-8 w-[200px] bg-green-200" />
                      ) : (
                        <>
                          <div className="text-3xl font-bold text-white mb-1">
                            {formatCurrency(
                              statistiques.data?.recettes ?? 0
                            )}
                          </div>
                          <p className="text-sm text-white/90">
                            {statistiques.data?.nbrRecettes ?? 0} recette
                            {(statistiques.data?.nbrRecettes ?? 0) !== 1 ? "s" : ""}
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-tr from-amber-400 via-orange-500 to-orange-600 overflow-hidden shadow-md border-0 col-span-full lg:col-span-1 order-first transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                      <CardTitle className="text-lg font-medium text-white ">
                        Dépenses fixes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3">
                      {statistiques.isLoading || statistiques.isFetching ? (
                        <Skeleton className="h-8 w-[200px] bg-orange-200" />
                      ) : (
                        <>
                          <div className="text-3xl font-bold text-white mb-1">
                            {formatCurrency(
                              statistiques.data?.depensesFixes ?? 0
                            )}
                          </div>
                          <p className="text-sm text-white/90">
                            {statistiques.data?.nbrDepensesFixes ?? 0} dépense
                            {(statistiques.data?.nbrDepensesFixes ?? 0) !== 1 ? "s" : ""} fixe
                            {(statistiques.data?.nbrDepensesFixes ?? 0) !== 1 ? "s" : ""}
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-tr from-red-300 via-red-400 to-red-500 overflow-hidden shadow-md border-0 col-span-full lg:col-span-1 order-first transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                      <CardTitle className="text-lg font-medium text-white ">
                        Dépenses variables
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3">
                      {statistiques.isLoading || statistiques.isFetching ? (
                        <Skeleton className="h-8 w-[200px] bg-red-200" />
                      ) : (
                        <>
                          <div className="text-3xl font-bold text-white mb-1">
                            {formatCurrency(
                              statistiques.data?.depensesVariantes ?? 0
                            )}
                          </div>
                          <p className="text-sm text-white/90">
                            {statistiques.data?.nbrDepensesVariantes ?? 0} dépense
                            {(statistiques.data?.nbrDepensesVariantes ?? 0) !== 1 ? "s" : ""} variable
                            {(statistiques.data?.nbrDepensesVariantes ?? 0) !== 1 ? "s" : ""}
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
                <div
                  className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                  id="Basic-cards"
                >
                  <BasicCard
                    title="Caisse"
                    statistiques={formatCurrency(statistiques.data?.caisse)}
                    Icon={Wallet}
                    iconClassName="bg-amber-100 text-amber-600"
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
                  />
                  <BasicCard
                    title="Compte personnel"
                    statistiques={formatCurrency(
                      statistiques.data?.comptePersonnel
                    )}
                    Icon={Wallet}
                    iconClassName="bg-slate-100 text-slate-600"
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
                  />
                  <BasicCard
                    title="Compte professionnel"
                    statistiques={formatCurrency(
                      statistiques.data?.compteProfessionnel
                    )}
                    Icon={Wallet}
                    iconClassName="bg-violet-100 text-violet-600"
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
                  />
                  <BasicCard
                    title="Règlements prévus"
                    statistiques={formatCurrency(
                      statistiques.data?.sommeReglementsPrevus ?? 0
                    )}
                    Icon={Landmark}
                    iconClassName="bg-blue-100 text-blue-600"
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
                  />
                  <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white border border-gray-200 hover:border-gray-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-lg font-medium">
                        Solde restant après prélèvements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {statistiques.isLoading || statistiques.isFetching ? (
                        <Skeleton className="h-4 w-[150px]" />
                      ) : (
                        <div
                          className={`text-3xl font-bold ${
                            (statistiques.data?.differenceBalance ?? 0) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(
                            statistiques.data?.differenceBalance ?? 0
                          )}
                        </div>
                      )}
                    </CardContent>
                    <div className="absolute bottom-4 right-4 p-3 rounded-full bg-emerald-100">
                      <TrendingUp className="h-8 w-8 text-emerald-600" />
                    </div>
                  </Card>
                  <BasicCard
                    title="Devis"
                    statistiques={statistiques.data?.nbrDevis}
                    Icon={FileText}
                    iconClassName="bg-fuchsia-100 text-fuchsia-600"
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
                  />
                  <BasicCard
                    title="Bon de livraison"
                    statistiques={statistiques.data?.nbrBonLivraison}
                    Icon={ScrollText}
                    iconClassName="bg-teal-100 text-teal-600"
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
                  />
                  <BasicCard
                    title="Commandes de fournitures"
                    statistiques={statistiques.data?.nbrCommandes}
                    Icon={Truck}
                    iconClassName="bg-orange-100 text-orange-600"
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
                  />
                  <BasicCard
                    title="Clients"
                    statistiques={statistiques.data?.nbrClients}
                    Icon={Users}
                    iconClassName="bg-emerald-100 text-emerald-600"
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
                  />
                  <BasicCard
                    title="Fournisseurs"
                    statistiques={statistiques.data?.nbrFournisseurs}
                    Icon={Users}
                    iconClassName="bg-sky-100 text-sky-600"
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
                  />
                  <BasicCard
                    title="Produits"
                    statistiques={statistiques.data?.nbrProduits}
                    Icon={Package}
                    iconClassName="bg-indigo-100 text-indigo-600"
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
