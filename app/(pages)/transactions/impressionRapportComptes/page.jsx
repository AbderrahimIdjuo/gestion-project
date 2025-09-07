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
import { formatCurrency, formatDate } from "@/lib/functions";
import { useEffect, useState } from "react";
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

  // Fonction pour calculer les totaux et le solde
  const calculateTotals = transactions => {
    if (!transactions || transactions.length === 0)
      return { totalRecettes: 0, totalDepenses: 0, solde: 0 };

    const totals = transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === "recette") {
          acc.totalRecettes += transaction.montant;
        } else if (
          transaction.type === "depense" ||
          transaction.type === "vider"
        ) {
          acc.totalDepenses += transaction.montant;
        }
        return acc;
      },
      { totalRecettes: 0, totalDepenses: 0 }
    );

    totals.solde = totals.totalRecettes - totals.totalDepenses;
    return totals;
  };

  // Fonction pour trier les transactions par date et calculer le solde cumulé
  const sortTransactionsWithBalance = transactions => {
    if (!transactions || transactions.length === 0) return [];

    const sorted = [...transactions].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt);
      const dateB = new Date(b.date || b.createdAt);
      return dateA - dateB;
    });

    // Commencer avec le solde initial de la caisse
    let runningBalance = data?.soldeInitial || 0;
    return sorted.map(transaction => {
      if (transaction.type === "recette") {
        runningBalance += transaction.montant;
      } else if (
        transaction.type === "depense" ||
        transaction.type === "vider"
      ) {
        runningBalance -= transaction.montant;
      }
      return { ...transaction, runningBalance };
    });
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
            {/* Section de résumé */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6 print-block">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">
                    Total Des Recettes
                  </h3>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(
                      calculateTotals(data?.transactions).totalRecettes
                    )}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">
                    Total Des Dépenses
                  </h3>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(
                      calculateTotals(data?.transactions).totalDepenses
                    )}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">
                    Solde
                  </h3>
                  <p
                    className={`text-lg font-bold ${soldeColor(
                      data?.soldeActuel
                    )}`}
                  >
                    {formatCurrency(data?.soldeActuel)}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border shadow-sm overflow-x-auto main-table-container print-block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Désignation (Recettes)</TableHead>
                    <TableHead className="text-right">MNT</TableHead>
                    <TableHead>Désignation (Dépenses)</TableHead>
                    <TableHead className="text-right">MNT</TableHead>
                    <TableHead className="text-right">Solde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.transactions?.length > 0 ? (
                    <>
                      {/* Solde initial */}
                      <TableRow>
                        <TableCell className="px-1 py-2 font-semibold">
                          SOLDE DE CAISSE
                        </TableCell>
                        <TableCell className="px-1 py-2"></TableCell>
                        <TableCell className="px-1 py-2 text-right pr-4"></TableCell>
                        <TableCell className="px-1 py-2"></TableCell>
                        <TableCell className="px-1 py-2 text-right pr-4"></TableCell>
                        <TableCell
                          className={`px-1 py-2 text-right pr-4 font-semibold ${soldeColor(
                            data?.soldeInitial || 0
                          )}`}
                        >
                          {formatCurrency(data?.soldeInitial || 0)}
                        </TableCell>
                      </TableRow>
                      {/* Transactions */}
                      {sortTransactionsWithBalance(data.transactions).map(
                        transaction => (
                          <TableRow key={transaction.id}>
                            <TableCell className="px-1 py-2">
                              {formatDate(transaction.date) ||
                                formatDate(transaction.createdAt)}
                            </TableCell>
                            <TableCell className="px-1 py-2">
                              {transaction.type === "recette"
                                ? transaction.lable
                                : ""}
                            </TableCell>
                            <TableCell className="px-1 py-2 text-right pr-4">
                              {transaction.type === "recette"
                                ? formatCurrency(transaction.montant)
                                : ""}
                            </TableCell>
                            <TableCell className="px-1 py-2">
                              {transaction.type === "depense" ||
                              transaction.type === "vider"
                                ? transaction.lable
                                : ""}
                            </TableCell>
                            <TableCell className="px-1 py-2 text-right pr-4">
                              {transaction.type === "depense" ||
                              transaction.type === "vider"
                                ? formatCurrency(transaction.montant)
                                : ""}
                            </TableCell>
                            <TableCell
                              className={`px-1 py-2 text-right pr-4 font-semibold ${soldeColor(
                                transaction.runningBalance
                              )}`}
                            >
                              {formatCurrency(transaction.runningBalance)}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Aucune transaction trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter className="bg-gray-50">
                  <TableRow>
                    <TableCell className="text-lg font-semibold p-2">
                      Total des recettes :
                    </TableCell>
                    <TableCell className="p-2"></TableCell>
                    <TableCell className="text-right text-lg font-semibold p-2 text-green-600">
                      {formatCurrency(
                        calculateTotals(data?.transactions).totalRecettes
                      )}
                    </TableCell>
                    <TableCell className="p-2"></TableCell>
                    <TableCell className="p-2"></TableCell>
                    <TableCell className="p-2"></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-lg font-semibold p-2">
                      Total des dépenses :
                    </TableCell>
                    <TableCell className="p-2"></TableCell>
                    <TableCell className="p-2"></TableCell>
                    <TableCell className="p-2"></TableCell>
                    <TableCell className="text-right text-lg font-semibold p-2 text-red-600">
                      {formatCurrency(
                        calculateTotals(data?.transactions).totalDepenses
                      )}
                    </TableCell>
                    <TableCell className="p-2"></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-lg font-semibold p-2">
                      Solde :
                    </TableCell>
                    <TableCell className="p-2"></TableCell>
                    <TableCell className="p-2"></TableCell>
                    <TableCell className="p-2"></TableCell>
                    <TableCell className="p-2"></TableCell>
                    <TableCell
                      className={`text-right text-lg font-semibold p-2 ${soldeColor(
                        calculateTotals(data?.transactions).solde
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
