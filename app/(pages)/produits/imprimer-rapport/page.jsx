"use client";

import { EnteteDevis } from "@/components/Entete-devis";
import { RapportEntete } from "@/components/rapport-entete";
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
import "@/styles/print-rapport.css";
import { useEffect, useState } from "react";

function formatQty(value) {
  return Number(value || 0).toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  });
}

function formatList(value) {
  if (Array.isArray(value)) return value.join(", ");
  return value || "—";
}

export default function ImprimerRapportStock() {
  const [data, setData] = useState();

  useEffect(() => {
    const storedData = localStorage.getItem("produits-rapport");
    if (storedData) {
      setData(JSON.parse(storedData));
    }
  }, []);

  return (
    <>
      <div className="container mx-auto p-8 w-[90vw] bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        <div id="print-area" className="space-y-3">
          <div className="print-block">
            <EnteteDevis />
          </div>
          <RapportEntete
            title="Rapport du stock (Entrée)"
            rightLabel="Date de création"
            rightValue={formatDate(new Date().toISOString())}
            stats={[
              {
                label: "Entrepôts",
                value: formatList(data?.entrepots),
              },
              {
                label: "Catégories",
                value: formatList(data?.categories),
              },
              {
                label: "Produits",
                value: formatList(data?.produitsFiltres),
              },
              {
                label: "Nombre de produits",
                value: data?.produits?.length || 0,
              },
              {
                label: "Valeur du stock",
                value: formatCurrency(data?.valeurGlobale),
                valueClassName: "text-emerald-700",
              },
            ]}
          />
          <div className="rounded-xl border shadow-sm overflow-x-auto main-table-container print-block">
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="w-24 text-center border-r border-b text-black font-semibold">
                    Référence
                  </TableHead>
                  <TableHead className="text-center border-r border-b text-black font-semibold">
                    Désignation
                  </TableHead>
                  <TableHead className="text-center border-r border-b text-black font-semibold">
                    Catégorie
                  </TableHead>
                  {data?.showEntrepotColumn !== false && (
                    <TableHead className="text-center border-r border-b text-black font-semibold">
                      Entrepôt
                    </TableHead>
                  )}
                  <TableHead className="text-center border-r border-b text-black font-semibold">
                    Quantité
                  </TableHead>
                  <TableHead className="text-center border-r border-b text-black font-semibold">
                    Prix d&apos;unité
                  </TableHead>
                  <TableHead className="text-center border-b text-black font-semibold">
                    Valeur en stock
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.produits?.map(produit => (
                  <TableRow key={produit.id} className="border-b">
                    <TableCell className="border-r px-1">
                      {produit.reference || "—"}
                    </TableCell>
                    <TableCell className="border-r px-1">
                      {produit.designation}
                    </TableCell>
                    <TableCell className="border-r px-1">
                      {produit.categorie}
                    </TableCell>
                    {data?.showEntrepotColumn !== false && (
                      <TableCell className="border-r px-1">
                        {(produit.entrepots || [])
                          .map(
                            stock =>
                              `${stock.nom} : ${formatQty(stock.quantite)}`
                          )
                          .join(" · ")}
                      </TableCell>
                    )}
                    <TableCell className="text-right border-r px-1">
                      {formatQty(produit.quantite)} {produit.unite}
                    </TableCell>
                    <TableCell className="text-right border-r px-1">
                      {formatCurrency(produit.prixUnite)}
                    </TableCell>
                    <TableCell className="text-right px-1 font-medium">
                      {formatCurrency(produit.valeurStock)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter className="bg-gray-50 table-footer-print">
                <TableRow className="border-b">
                  <TableCell
                    colSpan={data?.showEntrepotColumn !== false ? 6 : 5}
                    className="text-right text-emerald-700 text-xl font-bold border-r"
                  >
                    Valeur du stock :
                  </TableCell>
                  <TableCell className="text-right text-xl text-emerald-700 font-bold">
                    {formatCurrency(data?.valeurGlobale)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
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
