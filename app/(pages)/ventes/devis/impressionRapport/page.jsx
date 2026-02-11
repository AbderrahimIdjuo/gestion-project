"use client";

import { EnteteDevis } from "@/components/Entete-devis";
import { DirectPrintButton } from "@/components/ui/print-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/functions";
import { useEffect, useState } from "react";
import "./page.css";

function formatDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  return d.toLocaleDateString("fr-FR");
}

const getStatutColor = (statut) => {
  switch (statut) {
    case "En attente":
      return "bg-amber-100 text-amber-700";
    case "Accepté":
      return "bg-green-100 text-green-700";
    case "Annulé":
      return "bg-red-100 text-red-700";
    case "Terminer":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const statutPaiementBadge = (devis) => {
  if (!devis?.statutPaiement) return { lable: "Impayé", color: "bg-slate-100 text-slate-600" };
  switch (devis.statutPaiement) {
    case "paye":
      return { lable: "Payé", color: "bg-green-100 text-green-600" };
    case "enPartie":
      return { lable: "En partie", color: "bg-orange-100 text-orange-500" };
    case "impaye":
      return { lable: "Impayé", color: "bg-slate-100 text-slate-600" };
    default:
      return { lable: "Impayé", color: "bg-slate-100 text-slate-600" };
  }
};

const totalBlFourniture = (produits) =>
  produits?.reduce((acc, p) => acc + (p.quantite || 0) * (p.prixUnite || 0), 0) ?? 0;

const totalFourniture = (group) =>
  group?.reduce((acc, item) => {
    const type = item?.bonLivraison?.type;
    if (type === "achats") return acc + totalBlFourniture(item.produits);
    if (type === "retour") return acc - totalBlFourniture(item.produits);
    return acc;
  }, 0) ?? 0;

export default function ImpressionRapportDevis() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("devis-rapport");
    if (stored) setData(JSON.parse(stored));
  }, []);

  if (!data) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-muted-foreground">Aucun rapport à afficher. Générez un rapport devis puis cliquez sur Imprimer.</p>
      </div>
    );
  }

  const { devis = [], bLGroupsList = [], totals = {}, commercant, periode, from, to } = data;
  const filteredOrders = (numero) => bLGroupsList.filter((o) => o.devisNumero === numero);

  return (
    <>
      <div className="container mx-auto p-8 w-[90vw] bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        <div id="print-area" className="space-y-3">
          <div className="print-block">
            <EnteteDevis />
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 items-center mb-4 print-block">
              <h3 className="font-semibold text-gray-900">
                Commerçant : <span className="text-sm text-gray-600">{commercant === "all" ? "Tous" : commercant ?? "—"}</span>
              </h3>
              <h3 className="font-semibold text-gray-900">
                Période : 
                { from && to && (
                  <span className="text-sm text-gray-600 ml-1">
                    {formatDate(from)} → {formatDate(to)}
                  </span>
                )}
              </h3>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6 print-block">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Total devis</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(totals.montantTotalDevis ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Total payé</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(totals.montantTotalPaye ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Restant à payer</p>
                  <p className="text-lg font-bold text-amber-600">{formatCurrency(totals.montantTotalRestant ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Total marge</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(totals.totalMarge ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">% bénéfice</p>
                  <p className="text-lg font-bold">{totals.pctBenefice != null ? `${totals.pctBenefice}%` : "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Bénéfice</p>
                  <p className="text-lg font-bold text-purple-600">{formatCurrency(totals.beneficeFromMarge ?? 0)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border shadow-sm overflow-x-auto main-table-container print-block">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>N°</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Payé</TableHead>
                    <TableHead className="text-right">Reste</TableHead>
                    <TableHead className="text-right">Marge</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Statut paiement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devis.length > 0 ? (
                    devis.map((d) => {
                      const fourn = totalFourniture(filteredOrders(d.numero));
                      const marge = (Number(d.total) || 0) - fourn;
                      const reste = (Number(d.total) || 0) - (Number(d.totalPaye) || 0);
                      return (
                        <TableRow key={d.id}>
                          <TableCell>{formatDate(d.date)}</TableCell>
                          <TableCell className="font-medium">{d.numero}</TableCell>
                          <TableCell>{d.client?.nom ?? "—"}</TableCell>
                          <TableCell className="text-right">{formatCurrency(d.total)}</TableCell>
                          <TableCell className="text-right text-green-600">{formatCurrency(d.totalPaye)}</TableCell>
                          <TableCell className="text-right text-amber-600">{formatCurrency(reste)}</TableCell>
                          <TableCell className="text-right text-blue-600">{formatCurrency(marge)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatutColor(d.statut) ?? "bg-gray-100 text-gray-700"}`}>
                              {d.statut ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statutPaiementBadge(d)?.color}`}>
                              {statutPaiementBadge(d)?.lable}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">
                        Aucun devis trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
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
