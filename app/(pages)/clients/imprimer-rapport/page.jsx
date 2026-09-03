"use client";

import { EnteteDevis } from "@/components/Entete-devis";
import { RapportEntete } from "@/components/rapport-entete";
import { DirectPrintButton } from "@/components/ui/print-button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/functions";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import "@/styles/print-rapport.css";

// Composant pour afficher les détails des transactions
function TransactionsDetails({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return <div className="text-center text-gray-500 text-sm"></div>;
  }

  return (
    <div className="bg-white border-gray-200">
      {/* Corps du tableau */}
      <div>
        {transactions.map((transaction, index) => (
          <div
            key={index}
            className={`grid grid-cols-2 gap-2 px-3 py-2 text-xs border-b border-gray-200 last:border-b-0 bg-white`}
          >
            <div className="space-y-1  border-gray-200 pr-2">
              <div className="font-medium text-gray-800">
                {format(new Date(transaction.date), "dd/MM/yy")}
              </div>
              <div className="text-gray-600 text-xs">
                {transaction.methodePaiement || "Non spécifié"}
              </div>
            </div>
            <div className="text-right pl-2 flex items-center justify-end">
              <div className="font-semibold text-green-600 ">
                {formatCurrency(transaction.montant)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ImprimerRapport() {
  const [data, setData] = useState();
  useEffect(() => {
    const storedData = localStorage.getItem("clients-rapport");
    if (storedData) {
      setData(JSON.parse(storedData));
      console.log("Data:", JSON.parse(storedData));
    }
  }, []);

  return (
    <>
      <div className="container mx-auto p-8 w-[90vw] bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        {/* Document Content */}
        <div id="print-area" className="space-y-3">
          {/* Header */}
          <div className="print-block">
            <EnteteDevis />
          </div>
          <RapportEntete
            title="Crédits des clients"
            rightValue={
              data?.from && data?.to
                ? `${formatDate(data.from)} • ${formatDate(data.to)}`
                : "—"
            }
            extraItems={[
              {
                label: "Date de création",
                value: formatDate(new Date().toISOString()),
              },
            ]}
            stats={[
              {
                label: "Total général",
                value: formatCurrency(data?.totalGeneral),
                valueClassName: "text-sky-600",
              },
              {
                label: "Total payé",
                value: formatCurrency(data?.totalMontantPaye),
                valueClassName: "text-emerald-600",
              },
              {
                label: "Total des crédits",
                value: formatCurrency(data?.totalResteAPayer),
                valueClassName: "text-rose-600",
              },
            ]}
          />
          <div className="rounded-xl border shadow-sm overflow-x-auto main-table-container print-block">
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="w-30 text-center border-r border-b text-black font-semibold">
                    Client
                  </TableHead>
                  <TableHead className="w-24 text-center px-1 border-r border-b text-black font-semibold">
                    N° Devis
                  </TableHead>
                  <TableHead className="text-center px-1 border-r border-b text-black font-semibold">
                    Total
                  </TableHead>
                  <TableHead className="text-center px-1 border-r border-b text-black font-semibold">
                    Paiements
                  </TableHead>
                  <TableHead className="text-center px-1 border-r border-b text-black font-semibold">
                    Montant payé
                  </TableHead>
                  <TableHead className="text-center px-1 border-r border-b text-black font-semibold">
                    Reste à payer
                  </TableHead>
                  <TableHead className="text-center px-1 border-b text-black font-semibold">
                    Crédit
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.devis?.map(client =>
                  client.devis.map((devis, index) => (
                    <TableRow key={`${client.nom}-${devis.numero}`} className="border-b">
                      {index === 0 && (
                        <TableCell
                          rowSpan={client.devis.length}
                          className="font-semibold border-r pr-1"
                        >
                          {client.nom}
                        </TableCell>
                      )}
                      <TableCell className="border-r px-1">
                        {devis.numero}
                      </TableCell>
                      <TableCell className="text-right border-r px-1">
                        {formatCurrency(devis.total)}
                      </TableCell>
                      <TableCell className="text-center p-0 border-r">
                        <TransactionsDetails
                          transactions={devis.transactions}
                        />
                      </TableCell>
                      <TableCell className="text-right border-r px-1">
                        {formatCurrency(devis.totalPaye)}
                      </TableCell>
                      <TableCell className="text-right border-r px-1">
                        {formatCurrency(devis.restePaye)}
                      </TableCell>
                      {index === 0 && (
                        <TableCell
                          rowSpan={client.devis.length}
                          className="font-semibold text-rose-600 text-center px-1"
                        >
                          {formatCurrency(client.totalRestePaye)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter className="bg-gray-50 table-footer-print">
                <TableRow className="border-b">
                  <TableCell
                    colSpan={5}
                    className="text-right text-sky-600 text-xl font-bold border-r"
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
                <TableRow className="border-b">
                  <TableCell
                    colSpan={5}
                    className="text-right text-emerald-600 text-xl font-bold border-r"
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
                <TableRow className="border-b">
                  <TableCell
                    colSpan={5}
                    className="text-right text-rose-600 text-xl font-bold border-r"
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
        <div className="fixed bottom-4 right-4 z-50 print:hidden">
          <DirectPrintButton className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full shadow-lg">
            Imprimer
          </DirectPrintButton>
        </div>
      </div>
    </>
  );
}
