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
export function BasicCard({ title, statistiques, Icon, isLoading, iconClassName }) {
  const iconBg = iconClassName?.replace(/text-[a-z]+-\d+/g, "").trim() || "bg-gray-100";
  const iconColor = iconClassName?.match(/text-[a-z]+-\d+/)?.[0] || "text-gray-600";
  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white border border-gray-200 hover:border-gray-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? <Skeleton className="h-4 w-[150px]" /> : <div className="text-3xl font-bold">{statistiques}</div>}
      </CardContent>
      <div className={`absolute bottom-4 right-4 p-3 rounded-full ${iconBg}`}>
        <Icon className={`h-8 w-8 ${iconColor}`} />
      </div>
    </Card>
  );
}
