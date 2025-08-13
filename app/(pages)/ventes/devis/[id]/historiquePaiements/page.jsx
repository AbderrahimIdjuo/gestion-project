"use client";

import { EnteteDevis } from "@/components/Entete-devis";
import LoadingHistoriquePaiements from "@/components/loading-historique-paiements";
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
import { formatCurrency, methodePaiementLabel } from "@/lib/functions";
import { useEffect, useState } from "react";

function formatDate(dateString) {
  return dateString?.split("T")[0].split("-").reverse().join("-");
}

function formatPhoneNumber(phone) {
  return phone?.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

export default function HistoriquePaiement() {
  const [devis, setDevis] = useState();
  const [transactions, setTransactions] = useState();
  const handlePrint = () => {
    window.print();
  };
  useEffect(() => {
    const devisDetails = localStorage.getItem("devis");
    console.log("devisDetails", JSON.parse(devisDetails));
    if (devisDetails) {
      setDevis(JSON.parse(devisDetails));
    }

    const transactionsDetails = localStorage.getItem("transactions");
    console.log("transactionsDetails", JSON.parse(transactionsDetails));
    if (transactionsDetails) {
      setTransactions(JSON.parse(transactionsDetails));
    }
  }, []);
  const totalPaye = transactions?.reduce((acc, transaction) => {
    return acc + transaction.montant;
  }, 0);

  return (
    <>
      {devis ? (
        <div className="container mx-auto p-8 max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none mb-10">
          {/* Document Content */}
          <div id="print-area" className="space-y-6">
            {/* Header */}
            <EnteteDevis />
            <div className="space-y-2">
              <div className="grid grid-cols-3 items-center mb-4">
                <div className="flex gap-2 items-center">
                  <h3 className="mb-1 font-semibold text-gray-900">
                    Devis N° :
                  </h3>
                  <p className="text-sm text-gray-600">{devis?.numero}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <h3 className="mb-1 font-semibold text-gray-900">Client :</h3>
                  <p className="text-sm text-gray-600">
                    {devis?.client.titre && devis?.client.titre + ". "}
                    {devis?.client.nom.toUpperCase()}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <h3 className="mb-1 font-semibold text-gray-900">Total :</h3>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(devis?.total)}
                  </p>
                </div>
              </div>
            </div>
            {/* Items Table */}
            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                Historique des paiements :
              </h3>
              <div className="overflow-hidden rounded-lg border border-black">
                <Table className="w-full border-collapse">
                  <TableHeader className="text-[1rem] border-black">
                    <TableRow>
                      <TableHead className="text-black font-bold text-left border-b border-black">
                        Date
                      </TableHead>
                      <TableHead className="text-black  font-bold text-left border-l border-b border-black">
                        Méthode de paiement
                      </TableHead>
                      <TableHead className="text-black  font-bold text-left border-l border-b border-black">
                        Compte
                      </TableHead>
                      <TableHead className="text-black font-bold border-l border-b border-black text-right">
                        Montant
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.map(transaction => (
                      <TableRow key={transaction.id}>
                        <TableCell className=" p-2 text-left border-b border-black font-semibold">
                          {formatDate(transaction.date) ||
                            formatDate(transaction.createdAt)}{" "}
                        </TableCell>
                        <TableCell className=" p-2 text-left border-l border-b border-black font-semibold">
                          {methodePaiementLabel(transaction)}
                        </TableCell>
                        <TableCell className=" p-2 text-left border-l border-b border-black font-semibold">
                          {transaction.compte}
                        </TableCell>
                        <TableCell className="border-l border-b border-black p-2 text-right font-semibold">
                          {formatCurrency(transaction.montant)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter className="font-medium">
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-lg border-b border-black text-gray-900 p-2 text-right font-extrabold"
                      >
                        Total payé :
                      </TableCell>
                      <TableCell className="border-l border-b border-black border-black p-2 text-lg text-gray-900 text-right font-extrabold">
                        {formatCurrency(totalPaye)}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-lg text-gray-900 p-2 text-right font-extrabold"
                      >
                        Reste à payer :
                      </TableCell>
                      <TableCell className="border-l border-black p-2 text-lg text-gray-900 text-right font-extrabold">
                        {formatCurrency(devis?.total - totalPaye)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </div>

            <div className="flex justify-between text-sm text-gray-600 pt-4">
              <div>
                {" "}
                {new Date().toLocaleString("fr-FR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
          <div className="print:hidden mt-8 flex justify-end">
            <DirectPrintButton className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full">
              Imprimer
            </DirectPrintButton>
          </div>
        </div>
      ) : (
        <LoadingHistoriquePaiements />
      )}
    </>
  );
}
