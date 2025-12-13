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
import { ajouterUneHeure, formatCurrency, formatDate } from "@/lib/functions";
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

  const soldeColor = solde => {
    if (solde > 0) {
      return "text-green-600";
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
              <div className="flex flex-row gap-2 items-center">
                <h3 className="font-semibold text-gray-900">
                  Compte :{" "}
                  <span className="text-sm text-gray-600">{data?.compte}</span>
                </h3>
              </div>
              <div className="flex flex-row gap-2 items-center">
                <h3 className="font-semibold text-gray-900">
                  Période :{" "}
                  <span className="text-sm text-gray-600">
                    {data?.from ? formatDate(ajouterUneHeure(data.from)) : "—"}{" "}
                    • {data?.to ? formatDate(data.to) : "—"}
                  </span>
                </h3>
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
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="border-r border-b">Date</TableHead>
                    <TableHead className="w-[15rem] border-r border-b">
                      Désignation
                    </TableHead>
                    <TableHead className="text-right border-r border-b">
                      MNT Recettes
                    </TableHead>
                    <TableHead className="text-right border-r border-b">
                      MNT Dépenses
                    </TableHead>
                    <TableHead className="text-right border-b">Solde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.transactions?.length > 0 ? (
                    <>
                      {/* Solde initial */}
                      <TableRow className="bg-gray-700 text-white hover:!bg-gray-700 hover:!text-white border-b">
                        <TableCell className="px-1 py-2 font-semibold border-r">
                          SOLDE INITIAL
                        </TableCell>
                        <TableCell className="px-1 py-2 w-[15rem] border-r"></TableCell>
                        <TableCell className="px-1 py-2 text-right pr-4 border-r"></TableCell>
                        <TableCell className="px-1 py-2 text-right pr-4 border-r"></TableCell>
                        <TableCell
                          className={`px-1 py-2 text-right pr-4 font-semibold`}
                        >
                          {formatCurrency(data?.soldeInitial || 0)}
                        </TableCell>
                      </TableRow>
                      {/* Transactions */}
                      {sortTransactionsWithBalance(data.transactions).map(
                        transaction => (
                          <TableRow key={transaction.id} className="border-b">
                            <TableCell className="px-1 py-2 border-r">
                              {formatDate(transaction.date) ||
                                formatDate(transaction.createdAt)}
                            </TableCell>
                            <TableCell className="px-1 py-2 border-r">
                              {transaction.description}
                            </TableCell>
                            <TableCell className="px-1 py-2 text-right pr-4 border-r">
                              {transaction.type === "recette"
                                ? formatCurrency(transaction.montant)
                                : ""}
                            </TableCell>
                            <TableCell className="px-1 py-2 text-right pr-4 border-r">
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
                      <TableCell colSpan={5} className="text-center">
                        Aucune transaction trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter className="bg-gray-50 table-footer-print">
                  <TableRow className="border-b">
                    <TableCell className="text-lg font-semibold p-2 border-r">
                      Total :
                    </TableCell>
                    <TableCell className="p-2 border-r"></TableCell>
                    <TableCell className="text-right text-lg font-semibold p-2 text-green-600 border-r">
                      {formatCurrency(
                        calculateTotals(data?.transactions).totalRecettes
                      )}
                    </TableCell>
                    <TableCell className="text-right text-lg font-semibold p-2 text-red-600 border-r">
                      {formatCurrency(
                        calculateTotals(data?.transactions).totalDepenses
                      )}
                    </TableCell>
                    <TableCell className="p-2"></TableCell>
                  </TableRow>
                  {/* <TableRow className="border-b">
                    <TableCell className="text-lg font-semibold p-2 border-r">
                      Total des dépenses :
                    </TableCell>
                    <TableCell className="p-2 border-r"></TableCell>
                    <TableCell className="p-2 border-r"></TableCell>
                    <TableCell className="p-2 border-r"></TableCell>
                    <TableCell className="text-right text-lg font-semibold p-2 text-red-600 border-r">
                      {formatCurrency(
                        calculateTotals(data?.transactions).totalDepenses
                      )}
                    </TableCell>
                    <TableCell className="p-2"></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-lg font-semibold p-2 border-r">
                      Solde :
                    </TableCell>
                    <TableCell className="p-2 border-r"></TableCell>
                    <TableCell className="p-2 border-r"></TableCell>
                    <TableCell className="p-2 border-r"></TableCell>
                    <TableCell className="p-2 border-r"></TableCell>
                    <TableCell
                      className={`text-right text-lg font-semibold p-2 ${soldeColor(
                        calculateTotals(data?.transactions).solde
                      )}`}
                    >
                      {formatCurrency(data?.soldeActuel)}
                    </TableCell>
                  </TableRow> */}
                </TableFooter>
              </Table>
            </div>
          </div>
        </div>
        {/* Bouton d'impression fixé en bas de la page */}
        <div className="fixed  bottom-4 right-4 z-50 print:hidden">
          <DirectPrintButton className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full shadow-lg">
            Imprimer
          </DirectPrintButton>
        </div>
      </div>
    </>
  );
}
