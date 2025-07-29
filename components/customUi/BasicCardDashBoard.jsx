"use client";
import { Skeleton } from "@/components/ui/skeleton";
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
  ScrollText,
  Truck,
} from "lucide-react";
export function BasicCard({ title, statistiques, Icon , isLoading }) {
  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white border border-gray-200 hover:border-gray-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-gray-100">
          <Icon className="h-5 w-5 text-gray-600" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? <Skeleton className="h-4 w-[150px]" /> : <div className="text-3xl font-bold">{statistiques}</div>}
        
      </CardContent>
    </Card>
  );
}
