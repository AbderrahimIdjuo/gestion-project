"use client";

import { EnteteDevis } from "@/components/Entete-devis";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
  const fromDay = new Date(data?.from);

  return (
    <>
      <div className="container mx-auto p-8 max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        {/* Document Content */}
        <div id="print-area" className="space-y-3">
          {/* Header */}
          <EnteteDevis />
          <div className="space-y-2">
            <h3 className="font-semibold text-center text-lg text-gray-900 mb-2">
              CALCUL DU RESTE D&apos;AVANCES DES CLIENTS
            </h3>
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2 items-center">
                <h3 className="mb-1 font-semibold text-gray-900">Période :</h3>
                <p className="text-sm text-gray-600">
                  {`${fromDay.getDate()}-${
                    fromDay.getMonth() + 1
                  }-${fromDay.getFullYear()}`}{" "}
                  • {formatDate(data?.to)}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <h3 className="mb-1 font-semibold text-gray-900">
                  Date de création :
                </h3>
                <p className="text-sm text-gray-600">
                  {formatDate(new Date().toISOString())}
                </p>
              </div>
            </div>
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
                {data?.devis?.map(client =>
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
              <TableFooter className="bg-white">
                <TableRow className="border-t border-gray-200">
                  <TableCell
                    colSpan={4}
                    className="text-right text-sky-600 text-xl font-bold"
                  >
                    Total général :
                  </TableCell>
                  <TableCell
                    colSpan={2}
                    className="text-left text-xl text-sky-600 font-bold"
                  >
                    {formatCurrency(data?.totalGeneral)}
                  </TableCell>
                </TableRow>
                <TableRow className="border-t border-gray-200">
                  <TableCell
                    colSpan={4}
                    className="text-right text-emerald-600 text-xl font-bold"
                  >
                    Total payé :
                  </TableCell>
                  <TableCell
                    colSpan={2}
                    className="text-left text-xl text-emerald-600 font-bold"
                  >
                    {formatCurrency(data?.totalMontantPaye)}
                  </TableCell>
                </TableRow>
                <TableRow className="border-t border-gray-200">
                  <TableCell
                    colSpan={4}
                    className="text-right text-rose-600 text-xl font-bold"
                  >
                    Total des crédits :
                  </TableCell>
                  <TableCell
                    colSpan={2}
                    className="text-left text-xl text-rose-600 font-bold"
                  >
                    {formatCurrency(data?.totalResteAPayer)}
                  </TableCell>
                </TableRow>
              </TableFooter>
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
