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

export default function ImpressionRapportCharges() {
  const [data, setData] = useState();

  useEffect(() => {
    const storedData = localStorage.getItem("charges-rapport");
    if (storedData) {
      setData(JSON.parse(storedData));
    }
  }, []);

  const methodeLabel = methode => {
    if (methode === "espece") return "Espèce";
    if (methode === "cheque") return "Chèque";
    if (methode === "versement") return "Versement";
    if (methode === "traite") return "Traite";
    return methode || "—";
  };

  return (
    <>
      <div className="container mx-auto p-8 w-[90vw] bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        <div id="print-area" className="space-y-3">
          <div className="print-block">
            <EnteteDevis />
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 items-center mb-4 print-block">
              <div className="flex flex-row gap-2 items-center">
                <h3 className="font-semibold text-gray-900">
                  {data?.titre || "Rapport des charges"}
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

            <div className="bg-gray-50 p-4 rounded-lg mb-6 print-block">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">
                    Nombre de charges
                  </h3>
                  <p className="text-lg font-bold text-gray-900">
                    {data?.transactions?.length || 0}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">
                    Montant total
                  </h3>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(data?.totalMontant || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border shadow-sm overflow-x-auto main-table-container print-block">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="border-r border-b">Date</TableHead>
                    <TableHead className="border-r border-b">Label</TableHead>
                    <TableHead className="border-r border-b">
                      Description
                    </TableHead>
                    <TableHead className="border-r border-b">Compte</TableHead>
                    <TableHead className="border-r border-b">Méthode</TableHead>
                    <TableHead className="text-right border-b">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.transactions?.length > 0 ? (
                    data.transactions.map(t => (
                      <TableRow key={t.id} className="border-b">
                        <TableCell className="px-1 py-2 border-r">
                          {formatDate(t.date) || formatDate(t.createdAt)}
                        </TableCell>
                        <TableCell className="px-1 py-2 border-r">
                          {t.lable || "—"}
                        </TableCell>
                        <TableCell className="px-1 py-2 border-r">
                          {t.description || "—"}
                        </TableCell>
                        <TableCell className="px-1 py-2 border-r">
                          {t.compte || "—"}
                        </TableCell>
                        <TableCell className="px-1 py-2 border-r">
                          {methodeLabel(t.methodePaiement)}
                        </TableCell>
                        <TableCell className="px-1 py-2 text-right pr-4 font-medium text-red-600">
                          {formatCurrency(t.montant)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Aucune charge trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter className="bg-gray-50 table-footer-print">
                  <TableRow className="border-b">
                    <TableCell
                      colSpan={5}
                      className="text-lg font-semibold p-2 border-r"
                    >
                      Total :
                    </TableCell>
                    <TableCell className="text-right text-lg font-semibold p-2 text-red-600">
                      {formatCurrency(data?.totalMontant || 0)}
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
