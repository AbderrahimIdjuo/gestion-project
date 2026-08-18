"use client";

import {
  BasicCard,
  KpiCard,
} from "@/components/customUi/BasicCardDashBoard";
import TopArticlesCard from "@/components/customUi/TopArticlesCard";
import TopProductsCard from "@/components/customUi/TopProductsCard";
import DashboardRapportsDialog from "@/components/dashboard-rapports-dialog";
import PeriodeFilter from "@/components/customUi/periode-filter";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { formatCurrency } from "@/lib/functions";
import { getDateRangeFromPeriode } from "@/lib/periode";
import { SignIn, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarDays,
  FileText,
  Grid2X2,
  Landmark,
  Package,
  ScrollText,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";

export default function Page() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [periode, setPeriode] = useState("ce-mois");

  const { from, to } = getDateRangeFromPeriode(periode, startDate, endDate);
  const periodeLabel =
    from && to && isValid(from) && isValid(to)
      ? `${format(from, "d MMM yyyy", { locale: fr })} → ${format(to, "d MMM yyyy", { locale: fr })}`
      : null;
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
    enabled: isLoaded && isSignedIn,
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
                routing="hash"
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
            <div className="flex-1 overflow-auto bg-white">
              <div className="flex h-full flex-col gap-6 p-6 sm:p-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    Tableau de bord
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Vue d&apos;ensemble de votre activité
                  </p>
                </div>

                <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-3">
                  <div className="rounded-3xl border-0 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:col-span-2">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                          <CalendarDays className="h-[18px] w-[18px]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            Période d&apos;analyse
                          </p>
                          {periodeLabel && (
                            <p className="text-xs text-slate-400">
                              {periodeLabel}
                            </p>
                          )}
                        </div>
                      </div>

                      <PeriodeFilter
                        periode={periode}
                        onPeriodeChange={setPeriode}
                        startDate={startDate}
                        setStartDate={setStartDate}
                        endDate={endDate}
                        setEndDate={setEndDate}
                        label=""
                        id="periode-dashboard"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <DashboardRapportsDialog />
                  </div>
                </div>
                <div
                  className="grid gap-5 md:grid-cols-2 lg:grid-cols-4"
                  id="header-cards"
                >
                  <KpiCard
                    title="Bénéfice"
                    value={formatCurrency(statistiques.data?.benefice ?? 0)}
                    Icon={TrendingUp}
                    iconClassName="bg-violet-50 text-violet-600"
                    valueClassName="text-violet-600"
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
                  />
                  <KpiCard
                    title="Recettes"
                    value={formatCurrency(statistiques.data?.recettes ?? 0)}
                    subtitle={`${statistiques.data?.nbrRecettes ?? 0} recette${
                      (statistiques.data?.nbrRecettes ?? 0) !== 1 ? "s" : ""
                    }`}
                    Icon={Wallet}
                    iconClassName="bg-emerald-50 text-emerald-600"
                    valueClassName="text-emerald-600"
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
                  />
                  <KpiCard
                    title="Dépenses fixes"
                    value={formatCurrency(
                      statistiques.data?.depensesFixes ?? 0
                    )}
                    subtitle={`${statistiques.data?.nbrDepensesFixes ?? 0} dépense${
                      (statistiques.data?.nbrDepensesFixes ?? 0) !== 1
                        ? "s"
                        : ""
                    } fixe${
                      (statistiques.data?.nbrDepensesFixes ?? 0) !== 1
                        ? "s"
                        : ""
                    }`}
                    Icon={Landmark}
                    iconClassName="bg-amber-50 text-amber-600"
                    valueClassName="text-amber-600"
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
                  />
                  <KpiCard
                    title="Dépenses variables"
                    value={formatCurrency(
                      statistiques.data?.depensesVariantes ?? 0
                    )}
                    subtitle={`${statistiques.data?.nbrDepensesVariantes ?? 0} dépense${
                      (statistiques.data?.nbrDepensesVariantes ?? 0) !== 1
                        ? "s"
                        : ""
                    } variable${
                      (statistiques.data?.nbrDepensesVariantes ?? 0) !== 1
                        ? "s"
                        : ""
                    }`}
                    Icon={TrendingDown}
                    iconClassName="bg-rose-50 text-rose-600"
                    valueClassName="text-rose-600"
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
                  />
                </div>
                <div
                  className="grid gap-5 md:grid-cols-2 lg:grid-cols-4"
                  id="Basic-cards"
                >
                  <BasicCard
                    title="Caisse"
                    statistiques={formatCurrency(statistiques.data?.caisse)}
                    Icon={Wallet}
                    iconClassName="bg-amber-50 text-amber-600"
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
                    iconClassName="bg-slate-50 text-slate-600"
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
                    iconClassName="bg-violet-50 text-violet-600"
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
                    iconClassName="bg-blue-50 text-blue-600"
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
                  />
                  <BasicCard
                    title="Solde après prélèvements"
                    statistiques={formatCurrency(
                      statistiques.data?.differenceBalance ?? 0
                    )}
                    Icon={TrendingUp}
                    iconClassName="bg-emerald-50 text-emerald-600"
                    valueClassName={
                      (statistiques.data?.differenceBalance ?? 0) >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
                  />
                  <BasicCard
                    title="Devis"
                    statistiques={statistiques.data?.nbrDevis}
                    Icon={FileText}
                    iconClassName="bg-fuchsia-50 text-fuchsia-600"
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
                  />
                  <BasicCard
                    title="Bon de livraison"
                    statistiques={statistiques.data?.nbrBonLivraison}
                    Icon={ScrollText}
                    iconClassName="bg-teal-50 text-teal-600"
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
                  />
                  <BasicCard
                    title="Commandes de fournitures"
                    statistiques={statistiques.data?.nbrCommandes}
                    Icon={Truck}
                    iconClassName="bg-orange-50 text-orange-600"
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
                  />
                  <BasicCard
                    title="Clients"
                    statistiques={statistiques.data?.nbrClients}
                    Icon={Users}
                    iconClassName="bg-emerald-50 text-emerald-600"
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
                  />
                  <BasicCard
                    title="Fournisseurs"
                    statistiques={statistiques.data?.nbrFournisseurs}
                    Icon={Users}
                    iconClassName="bg-sky-50 text-sky-600"
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
                  />
                  <BasicCard
                    title="Produits"
                    statistiques={statistiques.data?.nbrProduits}
                    Icon={Package}
                    iconClassName="bg-indigo-50 text-indigo-600"
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
                  />
                  <BasicCard
                    title="Articles"
                    statistiques={statistiques.data?.nbrArticls}
                    Icon={Grid2X2}
                    iconClassName="bg-rose-50 text-rose-600"
                    isLoading={
                      statistiques.isLoading || statistiques.isFetching
                    }
                  />

                </div>
                {/* Cartes des produits et articles sur la même ligne */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
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
