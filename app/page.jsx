"use client";
import { SignIn, useUser } from "@clerk/nextjs";
import { BasicCard } from "@/components/customUi/BasicCardDashBoard";
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
import { formatCurrency } from "@/lib/functions";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  endOfMonth,
  endOfQuarter,
  endOfYear,
  isValid,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subMonths,
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

export default function Page() {
  const { user, isSignedIn, isLoaded } = useUser();
    const [startDate, setStartDate] = useState();
    const [endDate, setEndDate] = useState();
    const [periode, setPeriode] = useState("");

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
      <div className="h-full flex flex-col space-y-4 p-6">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
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

        {/* <div className="grid gap-4 grid-cols-1 shadow-md">
          <PerformanceChart />
        </div> */}
      </div>
    </>
  );
}





