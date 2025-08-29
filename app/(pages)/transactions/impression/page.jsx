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
import { formatDate, typeDepenseLabel, typeLabel } from "@/lib/functions";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import React, { useEffect, useState } from "react";
import "./page.css";


export default function ImpressionTransactions() {
  const [params, setParams] = useState();

  function methodePaiementLabel(methodePaiement) {
    if (methodePaiement === "versement") {
      return "Versement";
    } else if (methodePaiement === "cheque") {
      return "Chèque";
    } else if (methodePaiement === "espece") {
      return "Espèce";
    } else {
      return "Tous";
    }
  }

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

  useEffect(() => {
    const storedData = localStorage.getItem("params");
    if (storedData) {
      setParams(JSON.parse(storedData));
      console.log("params", JSON.parse(storedData));
    }
  }, []);

  const { data: transactions } = useQuery({
    queryKey: ["transactions-impression", params],
    queryFn: async () => {
      const response = await axios.get("/api/tresorie/impression", {
        params,
      });
      return response.data.transactions;
    },
  });

  const total = () => {
    return transactions?.reduce((acc, t) => {
      if (t.type === "recette") {
        return acc + t.montant;
      } else if (t.type === "depense") {
        return acc - t.montant;
      } else return acc;
    }, 0);
  };

  const fromDay = new Date(params?.from);

  return (
    <>
      <div className="container mx-auto p-8 w-[90vw] bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        {/* Document Content */}
        <div id="print-area" className="space-y-3">
          {/* Header */}
          <EnteteDevis />

          <div className="flex justify-between gap-8"></div>
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                Transactions
              </h3>
              <div className="grid grid-cols-3 items-center mb-4">
                <div className="flex gap-2 items-center">
                  <h3 className="mb-1 font-semibold text-gray-900">
                    Période :
                  </h3>
                  {params?.form && params?.to ? (
                    <p className="text-sm text-gray-600">
                      {`${fromDay.getDate()}-${
                        fromDay.getMonth() + 1
                      }-${fromDay.getFullYear()}`}{" "}
                      • {formatDate(params?.to)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">Indéterminer</p>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <h3 className="mb-1 font-semibold text-gray-900">Compte :</h3>
                  <p className="text-sm text-gray-600">
                    {params?.compte === "all" ? "Tous" : params?.compte}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <h3 className="mb-1 font-semibold text-gray-900">
                    Méthode de paiement:
                  </h3>
                  <p className="text-sm text-gray-600">
                    {methodePaiementLabel(params?.methodePaiement)}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <h3 className="mb-1 font-semibold text-gray-900">Type :</h3>
                  <p className="text-sm text-gray-600">
                    {typeLabel(params?.type)}
                  </p>
                </div>
                {params?.type === "depense" && params?.typeDepense && (
                  <div className="flex gap-2 items-center">
                    <h3 className="mb-1 font-semibold text-gray-900">
                      Type de charges:
                    </h3>
                    <p className="text-sm text-gray-600">
                      {typeDepenseLabel(params?.typeDepense)}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-xl border shadow-sm overflow-x-auto main-table-container">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead className="text-right pr-4">Montant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Compte</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.length > 0 ? (
                    groupTransactionsByType(transactions).map(
                      (typeGroup, typeIndex) => (
                        <React.Fragment key={typeIndex}>
                          {/* Transactions du groupe */}
                          {typeGroup.transactions.map(t => (
                            <TableRow key={t.id}>
                              <TableCell className="px-1 py-2">
                                {" "}
                                {formatDate(t.date) || formatDate(t.createdAt)}
                              </TableCell>
                              <TableCell className="px-1 py-2">
                                {t.lable}
                              </TableCell>
                              <TableCell className="px-1 py-2 text-right pr-4">
                                {t.montant} DH
                              </TableCell>
                              <TableCell className="px-1 py-2">
                                {typeLabel(t.type)}
                              </TableCell>
                              <TableCell className="px-1 py-2">
                                {" "}
                                {t.methodePaiement === "espece"
                                  ? "Espèce"
                                  : t.methodePaiement === "cheque"
                                  ? "Chèque"
                                  : t.methodePaiement}
                              </TableCell>
                              <TableCell className="px-1 py-2">
                                {t.compte?.replace("compte", "")}
                              </TableCell>
                              <TableCell className="px-1 py-2">
                                {t.description.replace(
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
                              {typeGroup.total} DH
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
                      className="text-right text-lg font-semibold p-2"
                    >
                      Total :
                    </TableCell>
                    <TableCell
                      colSpan={1}
                      className="text-left text-lg font-semibold p-2"
                    >
                      {total()} DH
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
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
