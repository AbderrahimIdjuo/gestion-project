'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Package, Receipt, TrendingUp, ArrowUpRight } from 'lucide-react'
import { PerformanceChart } from "@/components/performance-chart"

export default function DashboardPage() {
  return (
    <>
    
    <div className="h-full flex flex-col space-y-4">
      <h1 className="text-3xl font-bold">Tableau de bord</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-violet-500 shadow-lg shadow-purple-500/50 border-0 col-span-full lg:col-span-1 order-first">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
            <CardTitle className="text-sm font-medium text-white">
              Chiffre d&apos;Affaires
            </CardTitle>
            <TrendingUp className="h-6 w-6 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">89,721 €</div>
            <div className="flex items-center gap-1">
              <ArrowUpRight className="h-5 w-5 text-purple-200" />
              <p className="text-xs">
                <span className="text-purple-200">+15.3%</span>
                <span className="text-purple-200"> par rapport au mois dernier</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="relative bg-white overflow-hidden">
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
            <div className="text-2xl font-bold">1,234</div>
            <div className="flex items-center gap-1">
              <ArrowUpRight className="h-5 w-5 text-emerald-500" />
              <p className="text-xs">
                <span className="text-emerald-500">+20.1%</span>
                <span className="text-muted-foreground"> par rapport au mois dernier</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="relative bg-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-violet-500 p-[2px]">
            <div className="absolute inset-0 bg-white"></div>
          </div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
            <CardTitle className="text-sm font-medium">
              Produits en Stock
            </CardTitle>
            <Package className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">5,678</div>
            <div className="flex items-center gap-1">
              <ArrowUpRight className="h-5 w-5 text-emerald-500" />
              <p className="text-xs">
                <span className="text-emerald-500">+12.5%</span>
                <span className="text-muted-foreground"> par rapport au mois dernier</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="relative bg-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-violet-500 p-[2px]">
            <div className="absolute inset-0 bg-white"></div>
          </div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
            <CardTitle className="text-sm font-medium">
              Factures du Mois
            </CardTitle>
            <Receipt className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">432</div>
            <div className="flex items-center gap-1">
              <ArrowUpRight className="h-5 w-5 text-emerald-500" />
              <p className="text-xs">
                <span className="text-emerald-500">+8.2%</span>
                <span className="text-muted-foreground"> par rapport au mois dernier</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1">
        <PerformanceChart />
      </div>
    </div>
    </>
  )
}

