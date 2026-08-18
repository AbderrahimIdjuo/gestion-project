"use client";
import { EnteteDevis } from "@/components/Entete-devis";
import TransactionsChronologicalTable from "@/components/transactions-chronological-table";
import TransactionsTypeTotalsHeader from "@/components/transactions-type-totals-header";
import { DirectPrintButton } from "@/components/ui/print-button";
import {
  calculateTransactionsTypeTotals,
  formatDate,
  typeDepenseLabel,
  typeLabel,
} from "@/lib/functions";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import "@/styles/print-rapport.css";

export default function ImpressionTransactions() {
  const [params, setParams] = useState();

  function methodePaiementLabel(methodePaiement) {
    if (!methodePaiement || methodePaiement === "all") {
      return "Tous";
    }
    if (methodePaiement.includes("-")) {
      return methodePaiement
        .split("-")
        .map(m => methodePaiementLabel(m))
        .join(", ");
    }
    if (methodePaiement === "versement") return "Versement";
    if (methodePaiement === "cheque") return "Chèque";
    if (methodePaiement === "espece") return "Espèce";
    if (methodePaiement === "traite") return "Traite";
    return methodePaiement;
  }

  function formatTypeLabel(type) {
    if (!type || type === "all") return "Tous";
    if (type.includes("-")) {
      return type.split("-").map(t => typeLabel(t)).join(", ");
    }
    return typeLabel(type);
  }

  function formatCompteLabel(compte) {
    if (!compte || compte === "all") return "Tous";
    if (compte.includes("-")) {
      return compte.split("-").join(", ");
    }
    return compte;
  }

  useEffect(() => {
    const storedData = localStorage.getItem("transactions-params");
    if (storedData) {
      setParams(JSON.parse(storedData));
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
    enabled: !!params,
  });

  const typeTotals = calculateTransactionsTypeTotals(transactions);
  const fromDay = params?.from ? new Date(params.from) : null;

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
            <div className="space-y-2 print-block">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                Transactions
              </h3>
              <div className="grid grid-cols-3 items-center mb-4">
                <div className="flex gap-2 items-center">
                  <h3 className="mb-1 font-semibold text-gray-900">
                    Période :
                  </h3>
                  {params?.from && params?.to ? (
                    <p className="text-sm text-gray-600">
                      {fromDay
                        ? `${fromDay.getDate()}-${
                            fromDay.getMonth() + 1
                          }-${fromDay.getFullYear()}`
                        : "—"}{" "}
                      • {formatDate(params?.to)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">Indéterminer</p>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <h3 className="mb-1 font-semibold text-gray-900">Compte :</h3>
                  <p className="text-sm text-gray-600">
                    {formatCompteLabel(params?.compte)}
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
                    {formatTypeLabel(params?.type)}
                  </p>
                </div>
                {params?.type?.includes("depense") &&
                  params?.typeDepense &&
                  params?.typeDepense !== "all" && (
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
            <TransactionsTypeTotalsHeader totals={typeTotals} />
            <div className="main-table-container print-block">
              <TransactionsChronologicalTable
                transactions={transactions}
                totals={typeTotals}
                footerClassName="bg-gray-50 table-footer-print"
              />
            </div>
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
