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

function LoadingDeviPdf() {
  return (
    <div className="container mx-auto p-8 max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none">
      {/* Document Content */}
      <div id="print-area" className="space-y-6">
        {/* Header */}

        <div className="flex justify-between items-end border-b border-purple-500 pb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-purple-600">DEVIS N° :</h1>
            <Skeleton className="bg-purple-200 h-6 w-[200px] my-4" />
          </div>

          <Skeleton className="bg-gray-200 h-24 w-24 rounded-full my-4" />
        </div>
        {/* Title */}

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

        {/* Quote Details */}
        <div className="space-y-1">
          <div className="flex gap-2 items-center">
            <p className="font-medium">Date de création:</p>
            <Skeleton className="h-4 w-[200px] " />
          </div>
          <div className="flex gap-2 items-center">
            <p className="font-medium">Référence du devis:</p>
            <Skeleton className="h-4 w-[200px] " />
          </div>
          <div className="flex gap-2 items-center">
            <p className="font-medium">Date de validité du devis:</p>
            <Skeleton className="h-4 w-[200px] " />
          </div>
          <div className="flex gap-2 items-center">
            <p className="font-medium">Émis par:</p>
            <Skeleton className="h-4 w-[200px] " />
          </div>
        </div>

        {/* Items Table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className=" text-left">Désignation</TableHead>
                <TableHead className="border-l text-left">Quantité</TableHead>
                <TableHead className="border-l p-2 text-left">
                  Prix unitaire
                </TableHead>
                <TableHead className="border-l p-2 text-right">
                  Montant
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell className=" p-2 text-left">
                    <Skeleton className=" h-4 w-[50%]" />
                  </TableCell>
                  <TableCell className="border-l p-2 text-left">
                    <Skeleton className=" h-4 w-[50%]" />
                  </TableCell>
                  <TableCell className="border-l p-2 text-left">
                    <Skeleton className=" h-4 w-[50%]" />
                  </TableCell>
                  <TableCell className="border-l p-2" align="right">
                    <Skeleton className="right h-4 w-[50%]" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="font-medium bg-zinc-100">
              <TableRow>
                <TableCell colSpan={3} className="border-b p-2 text-right">
                  Frais de transport :
                </TableCell>
                <TableCell className="border-l border-b p-2 text-right">
                  <Skeleton className=" h-4 w-[80px]" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="border-b p-2 text-right">
                  Sous-total :
                </TableCell>
                <TableCell className="border-l border-b p-2 text-right">
                  <Skeleton className=" h-6 w-[80px]" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="p-2 text-right">
                  Total :
                </TableCell>
                <TableCell className="border-l p-2 text-right">
                  <Skeleton className=" h-6 w-[80px]" />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        {/* Print Button - Hidden when printing */}
        {/* Footer */}
        <div className="flex justify-between text-sm text-gray-600 pt-4">
          <Skeleton className="h-4 w-[200px] " />
        </div>
      </div>
    </div>
  );
}

export default LoadingDeviPdf;
