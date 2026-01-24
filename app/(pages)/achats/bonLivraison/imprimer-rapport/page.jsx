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

export default function ImprimerRapport() {
  const [bonLivraison, setBonLivraison] = useState();
  useEffect(() => {
    const storedData = localStorage.getItem("bonLivraison-rapport");
    if (storedData) {
      setBonLivraison(JSON.parse(storedData));
      console.log(
        "Bon de livraison data loaded from localStorage:",
        JSON.parse(storedData)
      );
    }
  }, []);

  const fromDay = bonLivraison?.from ? new Date(bonLivraison.from) : new Date();
  const transactions = bonLivraison?.transactions || [];
  
  // Fonction pour formater la date
  const formatDateString = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return formatDate(date.toISOString());
  };

  return (
    <>
      <div className="container mx-auto p-8 max-w-6xl bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        {/* Document Content */}
        <div id="print-area" className="space-y-3">
          {/* Header */}
          <EnteteDevis />

          <div className="space-y-2">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
Rapport des achats              </h3>
              <div className="grid grid-cols-2 items-center mb-4">
                {bonLivraison?.fournisseurNom ? (
                  <div className="flex gap-2 items-center">
                    <h3 className="font-semibold text-gray-900">
                      Fournisseur :
                    </h3>
                    <p className="text-sm text-gray-600">
                      {bonLivraison?.fournisseurNom}
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <h3 className="font-semibold text-gray-900">
                      Fournisseur :
                    </h3>
                    <p className="text-sm text-gray-600">Tous</p>
                  </div>
                )}
                <div className="flex gap-2 items-center">
                  <h3 className="font-semibold text-gray-900">
                    Période :
                  </h3>
                  <p className="text-sm text-gray-600">
                    {bonLivraison?.from && bonLivraison?.to
                      ? `${formatDateString(bonLivraison.from)} • ${formatDateString(bonLivraison.to)}`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border shadow-sm overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead className="text-right">Fourniture</TableHead>
                    <TableHead className="text-right">Retour</TableHead>
                    <TableHead className="text-right">Règlement</TableHead>
                    <TableHead className="text-right">Dette</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Ligne de dette initiale */}
                  <TableRow className="bg-gray-700 text-white">
                    <TableCell className="px-1 py-2 font-semibold">
                      DETTE INITIALE
                    </TableCell>
                    <TableCell className="px-1 py-2"></TableCell>
                    <TableCell className="px-1 py-2 text-right"></TableCell>
                    <TableCell className="px-1 py-2 text-right"></TableCell>
                    <TableCell className="px-1 py-2 text-right"></TableCell>
                    <TableCell className="px-1 py-2 text-right pr-4 font-semibold">
                      {formatCurrency(bonLivraison?.detteInitiale || 0)}
                    </TableCell>
                  </TableRow>
                  {/* Transactions */}
                  {transactions.map((transaction, index) => (
                    <TableRow key={`${transaction.type}-${transaction.id}-${index}`} className="border-b">
                      <TableCell className="px-1 py-2">
                        {formatDateString(transaction.date)}
                      </TableCell>
                      <TableCell className="px-1 py-2">
                        {transaction.fournisseur}
                      </TableCell>
                      <TableCell className="px-1 py-2 text-right pr-4">
                        {transaction.type === "bonLivraison" && transaction.blType === "achats" ? (
                          <span className="text-green-600">
                            {formatCurrency(transaction.montant)}
                          </span>
                        ) : (
                          ""
                        )}
                      </TableCell>
                      <TableCell className="px-1 py-2 text-right pr-4">
                        {transaction.type === "bonLivraison" && transaction.blType === "retour" ? (
                          <span className="text-red-600">
                            {formatCurrency(transaction.montant)}
                          </span>
                        ) : (
                          ""
                        )}
                      </TableCell>
                      <TableCell className="px-1 py-2 text-right pr-4">
                        {transaction.type === "reglement" ? (
                          <span className="text-blue-600">
                            {formatCurrency(transaction.montant)}
                          </span>
                        ) : (
                          ""
                        )}
                      </TableCell>
                      <TableCell
                        className={`px-1 py-2 text-right pr-4 font-semibold ${
                          transaction.runningDette >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(transaction.runningDette || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="bg-gray-50">
                  <TableRow className="border-b">
                    <TableCell
                      colSpan={5}
                      className="text-right text-lg font-semibold p-2"
                    >
                      Dette finale :
                    </TableCell>
                    <TableCell
                      className={`text-right text-lg font-semibold p-2 ${
                        (bonLivraison?.detteFinale || 0) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(bonLivraison?.detteFinale || 0)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end print:hidden mt-5">
          <DirectPrintButton className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full">
            Imprimer
          </DirectPrintButton>
        </div>
      </div>
    </>
  );
}
