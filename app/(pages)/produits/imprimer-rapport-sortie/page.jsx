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
import { entrepotBadgeClass } from "@/lib/entrepot-badge";
import { formatCurrency, formatDate as formatDateIso } from "@/lib/functions";
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

function formatDateFr(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("fr-FR");
}

export default function ImprimerRapportStockSortie() {
  const [data, setData] = useState();

  useEffect(() => {
    const storedData = localStorage.getItem("produits-rapport-sortie");
    if (storedData) {
      setData(JSON.parse(storedData));
    }
  }, []);

  const resume = data?.resume || {};
  const parProduit = data?.parProduit || [];
  const mouvements = data?.mouvements || [];
  const devis = data?.devis || [];
  const tables = data?.tables || ["recap", "bl", "devis"];
  const showRecap = tables.includes("recap");
  const showBl = tables.includes("bl");
  const showDevis = tables.includes("devis");
  const valeurDevis = devis.reduce(
    (acc, d) => acc + (Number(d.valeurFournitures) || 0),
    0
  );

  return (
    <>
      <div className="container mx-auto p-8 w-[90vw] bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        <div id="print-area" className="space-y-3">
          <div className="print-block">
            <EnteteDevis />
          </div>
          <RapportEntete
            title="Rapport du stock (Sortie)"
            rightLabel="Date de création"
            rightValue={formatDateIso(new Date().toISOString())}
            stats={[
              {
                label: "Période",
                value: data?.periode || "—",
              },
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
                label: "BL sortie",
                value: resume.nbBl || 0,
              },
              {
                label: "Qté sortie",
                value: formatQty(resume.quantiteTotale),
              },
              {
                label: "Valeur sortie",
                value: formatCurrency(resume.valeurTotale || 0),
                valueClassName: "text-rose-700",
              },
              {
                label: "Devis liés",
                value: resume.nbDevis || 0,
              },
            ]}
          />

          {showRecap && (
            <>
              <h4 className="text-sm font-semibold text-gray-800 print-block">
                Récapitulatif par produit
              </h4>
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
                        Quantité sortie
                      </TableHead>
                      <TableHead className="text-center border-r border-b text-black font-semibold">
                        Valeur
                      </TableHead>
                      <TableHead className="text-center border-r border-b text-black font-semibold">
                        N° BL
                      </TableHead>
                      <TableHead className="text-center border-b text-black font-semibold">
                        N° Devis
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parProduit.map(produit => (
                      <TableRow key={produit.id} className="border-b">
                        <TableCell className="border-r px-1">
                          {produit.reference || "—"}
                        </TableCell>
                        <TableCell className="border-r px-1">
                          {produit.designation}
                        </TableCell>
                        <TableCell className="text-right border-r px-1">
                          {formatQty(produit.quantite)} {produit.unite}
                        </TableCell>
                        <TableCell className="text-right border-r px-1">
                          {formatCurrency(produit.valeur)}
                        </TableCell>
                        <TableCell className="border-r px-1">
                          {(produit.bls || []).map(bl => bl.numero).join(", ") ||
                            "—"}
                        </TableCell>
                        <TableCell className="px-1">
                          {(produit.devis || [])
                            .map(d => d.numero)
                            .join(", ") || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  {parProduit.length > 0 && (
                    <TableFooter className="bg-gray-50 table-footer-print">
                      <TableRow className="border-b">
                        <TableCell
                          colSpan={2}
                          className="text-right font-bold border-r"
                        >
                          Total
                        </TableCell>
                        <TableCell className="text-right font-bold border-r">
                          {formatQty(resume.quantiteTotale)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-rose-700 border-r">
                          {formatCurrency(resume.valeurTotale || 0)}
                        </TableCell>
                        <TableCell className="text-right font-bold border-r">
                          {resume.nbBl || 0}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {resume.nbDevis || 0}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            </>
          )}

          {showBl && (
            <>
              <h4 className="text-sm font-semibold text-gray-800 print-block">
                Bons de livraison STOCK(sortie)
              </h4>
              <div className="rounded-xl border shadow-sm overflow-x-auto main-table-container print-block">
                <Table className="border-collapse">
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="text-center border-r border-b text-black font-semibold">
                        Date
                      </TableHead>
                      <TableHead className="text-center border-r border-b text-black font-semibold">
                        N° BL
                      </TableHead>
                      <TableHead className="text-center border-r border-b text-black font-semibold">
                        Produit
                      </TableHead>
                      <TableHead className="text-center border-r border-b text-black font-semibold">
                        Entrepôt
                      </TableHead>
                      <TableHead className="text-center border-r border-b text-black font-semibold">
                        Devis
                      </TableHead>
                      <TableHead className="text-center border-r border-b text-black font-semibold">
                        Client
                      </TableHead>
                      <TableHead className="text-center border-r border-b text-black font-semibold">
                        Quantité
                      </TableHead>
                      <TableHead className="text-center border-b text-black font-semibold">
                        Valeur
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mouvements.map(m => (
                      <TableRow key={m.id} className="border-b">
                        <TableCell className="border-r px-1">
                          {formatDateFr(m.date)}
                        </TableCell>
                        <TableCell className="border-r px-1 font-medium">
                          {m.blNumero}
                        </TableCell>
                        <TableCell className="border-r px-1">
                          {m.designation}
                        </TableCell>
                        <TableCell className="border-r px-1">
                          {m.entrepot}
                        </TableCell>
                        <TableCell className="border-r px-1">
                          {m.devisNumero || "—"}
                        </TableCell>
                        <TableCell className="border-r px-1">
                          {m.clientName || "—"}
                        </TableCell>
                        <TableCell className="text-right border-r px-1">
                          {formatQty(m.quantite)} {m.unite}
                        </TableCell>
                        <TableCell className="text-right px-1">
                          {formatCurrency(m.valeur)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {showDevis && (
            <>
              <h4 className="text-sm font-semibold text-gray-800 print-block">
                Bilan des devis
              </h4>
              <div className="rounded-xl border shadow-sm overflow-x-auto main-table-container print-block">
                <Table className="border-collapse">
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="text-center border-r border-b text-black font-semibold">
                        N° Devis
                      </TableHead>
                      <TableHead className="text-center border-r border-b text-black font-semibold">
                        Client
                      </TableHead>
                      <TableHead className="text-center border-r border-b text-black font-semibold">
                        Statut
                      </TableHead>
                      <TableHead className="text-center border-r border-b text-black font-semibold">
                        Produits utilisés
                      </TableHead>
                      <TableHead className="text-center border-b text-black font-semibold">
                        Coût sortie
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devis.map(d => (
                      <TableRow key={d.numero} className="border-b">
                        <TableCell className="border-r px-1 font-medium">
                          {d.numero}
                        </TableCell>
                        <TableCell className="border-r px-1">{d.client}</TableCell>
                        <TableCell className="border-r px-1">{d.statut}</TableCell>
                        <TableCell className="border-r px-1">
                          <div className="flex flex-wrap gap-1">
                            {(d.produits || []).map(p => (
                              <span
                                key={`${p.id}-${p.entrepotId || "none"}`}
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-normal ${entrepotBadgeClass(
                                  p.entrepotId
                                )}`}
                              >
                                {p.designation} : {formatQty(p.quantite)}{" "}
                                {p.unite}
                                {p.entrepot && p.entrepot !== "—"
                                  ? ` · ${p.entrepot}`
                                  : ""}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-1">
                          {formatCurrency(d.valeurFournitures)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  {devis.length > 0 && (
                    <TableFooter className="bg-gray-50 table-footer-print">
                      <TableRow className="border-b">
                        <TableCell
                          colSpan={4}
                          className="text-right font-bold border-r"
                        >
                          Total coût sortie
                        </TableCell>
                        <TableCell className="text-right font-bold text-rose-700">
                          {formatCurrency(valeurDevis)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            </>
          )}
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
