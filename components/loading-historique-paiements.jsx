"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableFooter,
  TableRow,
} from "@/components/ui/table";
import { Phone, MapPin, Smartphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function LoadingHistoriquePaiements() {
  return (
    <div className="container mx-auto p-8 max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none">
      {/* Document Content */}
      <div id="print-area" className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-purple-500 pb-4">
          <h1 className="flex gap-2 items-center text-3xl font-bold text-purple-600">
            COMMANDE N° :
            <Skeleton className="bg-purple-200 h-6 w-[200px] my-4" />
          </h1>

          <Skeleton className="bg-gray-200 h-24 w-24 rounded-full my-4" />
        </div>

        {/* Company and Client Info */}
        <div className="grid grid-cols-2 gap-8">
          {/* Company Info */}
          <div className="space-y-1">
            <Skeleton className="h-4 w-[200px] my-4" />
            <Skeleton className="h-4 w-[200px] my-4" />
            <div className="flex items-center gap-2 ">
              <MapPin className="h-4 w-4" />
              <Skeleton className="h-4 w-[350px] my-2" />
            </div>
            <div className="flex items-center gap-2 ">
              <Phone className="h-4 w-4" />
              <Skeleton className="h-4 w-[200px] my-2" />
            </div>
            <div className="flex items-center gap-2 ">
              <Smartphone className="h-4 w-4" />
              <Skeleton className="h-4 w-[200px] my-2" />
            </div>
          </div>

          {/* Client Info */}
          <div className="space-y-1">
            <h2 className="font-bold text-xl text-gray-900">Client</h2>
            <Skeleton className="h-4 w-[200px] my-4" />
            <div className="flex items-center gap-2 ">
              <MapPin className="h-4 w-4" />
              <Skeleton className="h-4 w-[350px] my-4" />
            </div>
            <div className="flex items-center gap-2 ">
              <Phone className="h-4 w-4" />
              <Skeleton className="h-4 w-[200px] " />
            </div>
          </div>
        </div>

        {/* Items Table */}
        <h3 className="text-xl font-bold">Historique des paiements :</h3>
        <div className="overflow-hidden rounded-lg border border-black">
          <Table className="w-full border-collapse">
            <TableHeader className="text-[1rem] border-black">
              <TableRow>
                <TableHead className="text-black font-bold text-left border-b border-black">
                  Date
                </TableHead>
                <TableHead className="text-black font-bold border-l border-b border-black text-left">
                  Montant
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="border-b border-black p-2 text-left">
                    <Skeleton className=" h-4 w-[50%]" />
                  </TableCell>
                  <TableCell className="border-l border-b border-black p-2 text-left">
                    <Skeleton className=" h-4 w-[50%]" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="font-medium bg-zinc-100">
              <TableRow>
                <TableCell
                  colSpan={1}
                  className="text-xl border-b border-black text-gray-900 p-2 text-right font-extrabold"
                >
                  Total payé :
                </TableCell>
                <TableCell className="border-l border-b border-black border-black p-2 text-xl text-gray-900 text-left font-extrabold">
                <Skeleton className=" h-4 w-[80px]" />
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell
                  colSpan={1}
                  className="text-xl text-gray-900 p-2 text-right font-extrabold"
                >
                  Reste à payer :
                </TableCell>
                <TableCell className="border-l border-black p-2 text-xl text-gray-900 text-left font-extrabold">
                <Skeleton className=" h-4 w-[80px]" />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default LoadingHistoriquePaiements;
