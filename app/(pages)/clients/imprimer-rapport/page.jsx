"use client";

import { EnteteDevis } from "@/components/Entete-devis";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/functions";
import { useEffect, useState } from "react";

import { DirectPrintButton } from "@/components/ui/print-button";
import { formatDate } from "@/lib/functions";

export default function ImprimerRapport() {
  const [data, setData] = useState();
  useEffect(() => {
    const storedData = localStorage.getItem("clients-rapport");
    if (storedData) {
      setData(JSON.parse(storedData));
      console.log("Data:", JSON.parse(storedData));
    }
  }, []);
  const handlePrint = () => {
    window.print();
  };
  return (
    <>
      <div className="container mx-auto p-8 max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        {/* Document Content */}
        <div id="print-area" className="space-y-6">
          {/* Header */}
          <EnteteDevis />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-center">
              CALCUL DE REST D&apos;AVANCES DES CLIENTS
            </h1>
            <h1 className="text-xl font-semibold text-center">
              Date : {formatDate(new Date().toISOString())}
            </h1>
          </div>
          <div className="rounded-xl print:rounded-sm border shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-30 text-center border-b border-t border-l text-black font-semibold">
                    Client
                  </TableHead>
                  <TableHead className="w-24 text-center px-1 border-b border-t border-l text-black font-semibold">
                    N° Devis
                  </TableHead>
                  <TableHead className="text-center px-1 border-b border-t border-l text-black font-semibold">
                    Total
                  </TableHead>
                  <TableHead className="text-center px-1 border-b border-t border-l text-black font-semibold">
                    Montant payé
                  </TableHead>
                  <TableHead className="text-center px-1 border-b border-t border-l text-black font-semibold">
                    Reste à payer
                  </TableHead>
                  <TableHead className="text-center px-1 border text-black font-semibold">
                    Crédit
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map(client =>
                  client.devis.map((devis, index) => (
                    <TableRow key={`${client.nom}-${devis.numero}`}>
                      {index === 0 && (
                        <TableCell
                          rowSpan={client.devis.length}
                          className="font-semibold  border-r border-b  border-l  pr-1"
                        >
                          {client.nom}
                        </TableCell>
                      )}
                      <TableCell className="border-b px-1">
                        {devis.numero}
                      </TableCell>
                      <TableCell className="text-right border-b border-l px-1 ">
                        {formatCurrency(devis.total)}
                      </TableCell>
                      <TableCell className="text-right border-b border-l px-1">
                        {formatCurrency(devis.totalPaye)}
                      </TableCell>
                      <TableCell className="text-right border-b border-l px-1">
                        {formatCurrency(devis.restePaye)}
                      </TableCell>
                      {index === 0 && (
                        <TableCell
                          rowSpan={client.devis.length}
                          className="font-semibold text-rose-600 text-center px-1 border-r border-b  border-l"
                        >
                          {formatCurrency(client.totalRestePaye)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <div
          className="flex items-center justify-end print:hidden
print:hidden mt-5"
        >
          <DirectPrintButton className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full">
            Imprimer
          </DirectPrintButton>
        </div>
      </div>
    </>
  );
}
