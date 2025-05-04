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
import { Phone, Calendar, Smartphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function LoadingCommandePdf() {
  return (
    <div className="container mx-auto p-8 max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none">
      {/* Document Content */}
      <div id="print-area" className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#228B8B] pb-1">
          <img src="/images/LOGO-tete.jpg" alt="Logo" width={300} />
          <img src="/images/LOGO-OUDAOUD.jpg" className="h-24 w-24" />
        </div>
        {/* Company and Client Info */}
        <div className="grid grid-cols-2 gap-8">
          {/* Devis Info */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="font-bold text-lg text-gray-900">Commande N° :</h1>
              <Skeleton className=" h-4 w-[150px]" />
            </div>

            <div className="flex items-center gap-2 mt-2 ">
              <Calendar className="h-3 w-3" />
              <p className="font-medium text-sm">Date limite de livraison:</p>
              <Skeleton className=" h-4 w-[150px]" />
            </div>
          </div>

          {/* Client Info */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="font-bold text-lg text-gray-900">Client : </h2>
              <Skeleton className=" h-4 w-[150px]" />
            </div>
            <div className="flex items-center gap-2 ">
              <Phone className="h-3 w-3" />
              <Skeleton className=" h-4 w-[150px]" />
            </div>
          </div>
        </div>

          {/* Items Table */}
          <div className="overflow-hidden rounded-lg border border-black">
              <Table className="w-full border-collapse">
                <TableHeader className="text-[1rem] border-black">
                  <TableRow>
                    <TableHead className="text-black font-bold text-center border-b border-black w-[50%]">
                      Désignation
                    </TableHead>
                    <TableHead className="text-black font-bold border-l border-b border-black text-center ">
                      Qté
                    </TableHead>
                    <TableHead className="text-black font-bold border-l border-b border-black text-center">
                      Prix unitaire
                    </TableHead>
                    <TableHead className="text-black font-bold border-l border-b border-black p-2 text-center">
                      Montant
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell className=" p-2 text-left border-b border-black">
                    <Skeleton className=" h-4 w-[50%]" />
                  </TableCell>
                  <TableCell className="border-l border-b p-2 text-left border-black">
                    <Skeleton className=" h-4 w-[50%]" />
                  </TableCell>
                  <TableCell className="border-l border-b p-2 text-left border-black">
                    <Skeleton className=" h-4 w-[50%]" />
                  </TableCell>
                  <TableCell className="border-l border-b p-2 border-black" align="right">
                    <Skeleton className="right h-4 w-[50%]" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
                <TableFooter className="font-medium">
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className=" border-b border-black p-2 text-right font-bold"
                    >
                      Coût de production :
                    </TableCell>
                    <TableCell className="border-l border-b border-black p-2 text-right font-bold">
                    <Skeleton className=" h-6 w-[80px]" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className=" border-b border-black p-2 text-right font-bold"
                    >
                      Montant à payer :
                    </TableCell>
                    <TableCell className="border-l border-b border-black p-2 text-right font-bold">
                    <Skeleton className=" h-6 w-[80px]" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-xl text-gray-900 p-2 text-right font-extrabold"
                    >
                      Reste à payer :
                    </TableCell>
                    <TableCell className="border-l border-black p-2 text-xl text-gray-900 text-right font-extrabold">
                    <Skeleton className=" h-6 w-[80px]" />
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
      </div>
    </div>
  );
}

export default LoadingCommandePdf;
