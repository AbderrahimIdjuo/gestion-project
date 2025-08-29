"use client";
import { EnteteDevis } from "@/components/Entete-devis";
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
import { formatCurrency, formatDate, typeLabel , methodePaiementLabel } from "@/lib/functions";
import React, { useEffect, useState } from "react";
import "./page.css";

export default function ImpressionRapport() {
  const [data, setData] = useState();

  useEffect(() => {
    const storedData = localStorage.getItem("transaction-rapport");
    if (storedData) {
      setData(JSON.parse(storedData));
      console.log("transaction-rapport", JSON.parse(storedData));
    }
  }, []);

  // Fonction pour grouper les transactions par type
  const groupTransactionsByType = transactions => {
    if (!transactions || transactions.length === 0) return [];

    const grouped = transactions.reduce((acc, transaction) => {
      const type = transaction.type || "inconnu";
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(transaction);
      return acc;
    }, {});

    return Object.entries(grouped).map(([type, transactions]) => ({
      type,
      transactions,
      total: transactions.reduce((sum, transaction) => {
        if (type === "recette") {
          return sum + transaction.montant;
        } else if (type === "depense" || type === "vider") {
          return sum - transaction.montant;
        }
        return sum;
      }, 0),
    }));
  };

  function ajouterUneHeure(from) {
    // Si "from" est déjà un objet Date, on l'utilise directement
    const date =
      from instanceof Date ? new Date(from) : new Date(String(from).trim());

    if (isNaN(date.getTime())) {
      throw new Error(`Date invalide : ${from}`);
    }

    date.setHours(date.getHours() + 1);
    return date.toISOString();
  }

  const soldeColor = solde => {
    if (solde > 0) {
      return "text-green-500";
    } else if (solde < 0) {
      return "text-rose-600";
    }
  };

  return (
    <>
      <div className="container mx-auto p-8 w-[90vw] bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        {/* Document Content */}
        <div id="print-area" className="space-y-3">
          {/* Header */}
          <div className="print-block">
            <EnteteDevis />
          </div>

          <div className="flex justify-between gap-8"></div>
          <div className="space-y-6">
            <div className="grid grid-cols-2 items-center mb-4 print-block">
              <div className="flex gap-2 items-center">
                <h3 className="mb-1 font-semibold text-gray-900">Compte :</h3>
                <p className="text-sm text-gray-600">{data?.compte}</p>
              </div>
              <div className="flex gap-2 items-center">
                <h3 className="mb-1 font-semibold text-gray-900">Période :</h3>
                <p className="text-sm text-gray-600">
                  {data?.from ? formatDate(ajouterUneHeure(data.from)) : "—"} •{" "}
                  {data?.to ? formatDate(data.to) : "—"}
                </p>
              </div>
            </div>
            <div className="rounded-xl border shadow-sm overflow-x-auto main-table-container print-block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Compte</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.transactions?.length > 0 ? (
                    groupTransactionsByType(data.transactions).map(
                      (typeGroup, typeIndex) => (
                        <React.Fragment key={typeIndex}>
                          {/* Transactions du groupe */}
                          {typeGroup.transactions.map((transaction, index) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="px-1 py-2">
                                {formatDate(transaction.date) ||
                                  formatDate(transaction.createdAt)}
                              </TableCell>
                              <TableCell className="px-1 py-2">
                                {transaction.lable}
                              </TableCell>
                              <TableCell className="px-1 py-2 text-right pr-4">
                                {transaction.montant} DH
                              </TableCell>
                              <TableCell className="px-1 py-2">
                                {typeLabel(transaction.type)}
                              </TableCell>
                              <TableCell className="px-1 py-2">
                                {methodePaiementLabel(transaction.methodePaiement)}
                              </TableCell>
                              <TableCell className="px-1 py-2">
                                {transaction.compte.replace("compte", "")}
                              </TableCell>
                              <TableCell className="px-1 py-2">
                                {transaction.description.replace(
                                  "paiement du fournisseur",
                                  "Bénéficiaire : "
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          {/* Total du groupe de type en bas */}
                          <TableRow
                            className={`${
                              typeGroup.type === "depense"
                                ? "bg-rose-50"
                                : typeGroup.type === "recette"
                                ? "bg-emerald-50"
                                : "bg-sky-50"
                            }`}
                          >
                            <TableCell
                              colSpan={7}
                              className={`font-semibold text-lg py-3 ${
                                typeGroup.type === "depense"
                                  ? "text-rose-700"
                                  : typeGroup.type === "recette"
                                  ? "text-emerald-700"
                                  : "text-sky-700"
                              }`}
                            >
                              Total {typeLabel(typeGroup.type)} :{" "}
                              {formatCurrency(typeGroup.total)}
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      )
                    )
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Aucune transaction trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter className="bg-none">
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className={`text-right text-lg font-semibold p-2 ${soldeColor(
                        data?.totalTransactions
                      )}`}
                    >
                      Total des transactions :
                    </TableCell>
                    <TableCell
                      colSpan={1}
                      className={`text-left text-lg font-semibold p-2 ${soldeColor(
                        data?.totalTransactions
                      )}`}
                    >
                      {formatCurrency(data?.totalTransactions)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className={`text-right text-lg font-semibold p-2 ${soldeColor(
                        data?.soldeActuel
                      )}`}
                    >
                      Solde actuel:
                    </TableCell>
                    <TableCell
                      colSpan={1}
                      className={`text-left text-lg font-semibold p-2 ${soldeColor(
                        data?.soldeActuel
                      )}`}
                    >
                      {formatCurrency(data?.soldeActuel)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        </div>
        <div
          className="flex items-center justify-end 
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
