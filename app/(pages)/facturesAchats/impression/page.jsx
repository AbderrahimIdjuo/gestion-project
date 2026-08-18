"use client";
import { EnteteDevis } from "@/components/Entete-devis";
import { DirectPrintButton } from "@/components/ui/print-button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import "@/styles/print-rapport.css";

export default function ImpressionFacturesAchats() {
  const [params, setParams] = useState(null);

  useEffect(() => {
    const storedData = localStorage.getItem("facturesAchats-params");
    if (storedData) {
      setParams(JSON.parse(storedData));
    } else {
      setParams({});
    }
  }, []);

  const factures = useQuery({
    queryKey: ["facturesAchats-impression", params],
    queryFn: async () => {
      const response = await axios.get("/api/facturesAchats", {
        params: {
          ...params,
          limit: 10000,
          page: 1,
        },
      });
      return response.data;
    },
    enabled: params !== null,
  });

  const formatDateRange = (from, to) => {
    if (from && to) {
      return `${formatDate(from)} - ${formatDate(to)}`;
    }
    return "Toutes les dates";
  };

  const totalMontant =
    factures.data?.factures?.reduce(
      (sum, facture) => sum + (facture.total || 0),
      0
    ) || 0;

  if (factures.isLoading || params === null) {
    return (
      <div className="container mx-auto p-8 w-[90vw] bg-white min-h-screen">
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto p-8 w-[90vw] bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        <div id="print-area" className="space-y-4">
          <div className="print-block">
            <EnteteDevis />
          </div>

          <div className="space-y-4">
            <div className="space-y-2 print-block">
              <h3 className="font-semibold text-lg text-gray-900 mb-3">
                Liste des Factures Achats
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                {params?.query && (
                  <div>
                    <span className="font-semibold">Recherche: </span>
                    <span>{params.query}</span>
                  </div>
                )}
                {params?.fournisseurNom && (
                  <div>
                    <span className="font-semibold">Fournisseur: </span>
                    <span>{params.fournisseurNom}</span>
                  </div>
                )}
                <div>
                  <span className="font-semibold">Période: </span>
                  <span>{formatDateRange(params?.from, params?.to)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border shadow-sm overflow-x-auto main-table-container print-block">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="border-r border-b">Date</TableHead>
                    <TableHead className="border-r border-b">Numéro</TableHead>
                    <TableHead className="border-r border-b">
                      Fournisseur
                    </TableHead>
                    <TableHead className="border-r border-b">ICE</TableHead>
                    <TableHead className="text-right border-b">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factures.data?.factures?.length > 0 ? (
                    factures.data.factures.map(facture => (
                      <TableRow key={facture.id} className="border-b">
                        <TableCell className="border-r">
                          {formatDate(facture.date) ||
                            formatDate(facture.createdAt) ||
                            "—"}
                        </TableCell>
                        <TableCell className="border-r">
                          {facture.numero || "—"}
                        </TableCell>
                        <TableCell className="border-r">
                          {facture.fournisseur?.nom || "—"}
                        </TableCell>
                        <TableCell className="border-r">
                          {facture.fournisseur?.ice || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(facture.total || 0)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Aucune facture trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter className="bg-gray-50 table-footer-print">
                  <TableRow className="border-b">
                    <TableCell
                      colSpan={4}
                      className="font-bold text-right border-r"
                    >
                      Total:
                    </TableCell>
                    <TableCell className="font-bold text-right">
                      {formatCurrency(totalMontant)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
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
