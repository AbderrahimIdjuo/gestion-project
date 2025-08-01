"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Phone } from "lucide-react";
import LoadingHistoriquePaiements from "@/components/loading-historique-paiements";
import { EnteteDevis } from "@/components/Entete-devis";

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
  function methodePaiementLabel(transaction) {
    if (
      transaction.methodePaiement === "espece" &&
      transaction.compte !== "caisse"
    ) {
      return "Vérement";
    } else if (
      transaction.methodePaiement === "espece" &&
      transaction.compte === "caisse"
    ) {
      return "Espèce";
    } else if (transaction.methodePaiement === "cheque") {
      return "Chèque";
    }
  }
  return (
    <>
      {devis ? (
        <div className="container mx-auto p-8 max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none mb-10">
          {/* Document Content */}
          <div id="print-area" className="space-y-6">
            {/* Header */}
            <EnteteDevis />

            {/* Company and Client Info */}
            <div className="grid grid-cols-2 gap-8">
              {/* Company Info */}
              <div className="col-span-1">
                <h1 className="font-bold text-lg text-gray-900">
                  Devis N° : {devis?.numero}
                </h1>
                <h1 className="font-bold text-lg text-gray-900">
                  Total TTC : {devis?.total} DH
                </h1>
              </div>
              {/* Client Info */}
              <div className="col-span-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="font-bold text-lg text-gray-900">Client : </h2>
                  <p className="font-bold text-lg text-gray-900">
                    {devis?.client.titre && devis?.client.titre + ". "}
                    {devis?.client.nom.toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ">
                  <Phone className="h-3 w-3" />
                  <p className="font-medium text-sm">
                    {formatPhoneNumber(devis?.client.telephone)}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h3 className="text-lg font-bold">Historique des paiements :</h3>
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
                      <TableHead className="text-black font-bold border-l border-b border-black text-left">
                        Montant
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.map((transaction) => (
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
                        <TableCell className="border-l border-b border-black p-2 text-left font-semibold">
                          {transaction.montant} DH
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
                      <TableCell className="border-l border-b border-black border-black p-2 text-lg text-gray-900 text-left font-extrabold">
                        {totalPaye} DH
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-lg text-gray-900 p-2 text-right font-extrabold"
                      >
                        Reste à payer :
                      </TableCell>
                      <TableCell className="border-l border-black p-2 text-lg text-gray-900 text-left font-extrabold">
                        {(devis?.total - totalPaye).toFixed(2)} DH
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
            <Button
              onClick={handlePrint}
              className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 rounded-full hover:bg-purple-600 hover:scale-105 text-white font-semibold transition-all duration-300 transform"
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
          </div>
        </div>
      ) : (
        <LoadingHistoriquePaiements />
      )}
    </>
  );
}
