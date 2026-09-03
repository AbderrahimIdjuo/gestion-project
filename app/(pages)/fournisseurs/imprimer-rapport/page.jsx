"use client";

import { EnteteDevis } from "@/components/Entete-devis";
import { RapportEntete } from "@/components/rapport-entete";
import { DirectPrintButton } from "@/components/ui/print-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/functions";
import { useEffect, useState } from "react";
import "@/styles/print-rapport.css";

function formatDateString(dateString) {
  if (!dateString) return "—";
  const iso = typeof dateString === "string" ? (dateString.includes("T") ? dateString : new Date(dateString).toISOString()) : new Date(dateString).toISOString();
  return formatDate(iso);
}

export default function ImprimerRapportFournisseur() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("fournisseur-rapport-bl-reglements");
    if (raw) setData(JSON.parse(raw));
  }, []);

  const fournisseur = data?.fournisseur;
  const rapportItems = data?.rapportItems || [];
  const rapportTotaux = data?.rapportTotaux || {};
  const periodeRapport = data?.periodeRapport || "";
  const startDateRapport = data?.startDateRapport;
  const endDateRapport = data?.endDateRapport;

  const formatPeriode = () => {
    if (periodeRapport === "personnalisee" && startDateRapport && endDateRapport) {
      return `${formatDateString(startDateRapport)} → ${formatDateString(endDateRapport)}`;
    }
    const labels = {
      "aujourd'hui": "Aujourd'hui",
      "ce-mois": "Ce mois",
      "mois-dernier": "Le mois dernier",
      "trimestre-actuel": "Trimestre actuel",
      "trimestre-precedent": "Trimestre précédent",
      "cette-annee": "Cette année",
      "annee-derniere": "L'année dernière",
    };
    return labels[periodeRapport] || periodeRapport;
  };

  if (!data) {
    return (
      <div className="container mx-auto p-8 w-[90vw]">
        <p className="text-muted-foreground">Aucune donnée de rapport à imprimer.</p>
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
          <RapportEntete
            title="Rapport BL & Règlements"
            rightValue={formatPeriode()}
            extraItems={[
              { label: "Fournisseur", value: fournisseur?.nom ?? "—" },
            ]}
            stats={[
              {
                label: "Fourniture",
                value: formatCurrency(rapportTotaux.sumAchats ?? 0),
              },
              {
                label: "Règlement",
                value: formatCurrency(rapportTotaux.sumReglements ?? 0),
                valueClassName: "text-green-600",
              },
              {
                label: "Retour",
                value: formatCurrency(rapportTotaux.sumRetours ?? 0),
                valueClassName: "text-red-600",
              },
              {
                label: "Dette finale",
                value: formatCurrency(rapportTotaux.detteFinale ?? 0),
              },
            ]}
          />
            <div className="rounded-xl border shadow-sm overflow-x-auto main-table-container print-block">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="font-semibold border-r border-b">Date</TableHead>
                    <TableHead className="font-semibold border-r border-b">Référence</TableHead>
                    <TableHead className="font-semibold text-right border-r border-b">Fourniture</TableHead>
                    <TableHead className="font-semibold text-right border-r border-b">Règlement</TableHead>
                    <TableHead className="font-semibold text-right border-r border-b">Retour</TableHead>
                    <TableHead className="font-semibold text-right border-b">Dette</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-gray-700 text-white font-semibold border-b">
                    <TableCell className="py-2 border-r">DETTE INITIALE</TableCell>
                    <TableCell className="py-2 border-r" colSpan={4}></TableCell>
                    <TableCell className="py-2 text-right">
                      {formatCurrency(rapportTotaux.detteInitiale ?? 0)}
                    </TableCell>
                  </TableRow>
                  {rapportItems.map((item, index) => (
                    <TableRow key={`${item.reference}-${index}`} className="border-b">
                      <TableCell className="py-2 border-r">{formatDateString(item.date)}</TableCell>
                      <TableCell className="py-2 font-medium border-r">
                        {item.itemType === "reglement" && item.motif
                          ? item.motif
                          : item.reference}
                      </TableCell>
                      <TableCell className="py-2 text-right border-r">
                        {item.itemType === "bl" && item.blType === "achats"
                          ? formatCurrency(item.montant ?? 0)
                          : ""}
                      </TableCell>
                      <TableCell className="py-2 text-right border-r">
                        {item.itemType === "reglement"
                          ? formatCurrency(Math.abs(item.montant ?? 0))
                          : ""}
                      </TableCell>
                      <TableCell className="py-2 text-right border-r">
                        {item.itemType === "bl" && item.blType === "retour"
                          ? formatCurrency(Math.abs(item.montant ?? 0))
                          : ""}
                      </TableCell>
                      <TableCell className="py-2 text-right font-medium">
                        {formatCurrency(rapportTotaux.runningDette?.[index] ?? 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-100 font-semibold border-b">
                    <TableCell className="py-2 border-r">Total</TableCell>
                    <TableCell className="py-2 border-r"></TableCell>
                    <TableCell className="py-2 text-right border-r">
                      {formatCurrency(rapportTotaux.sumAchats ?? 0)}
                    </TableCell>
                    <TableCell className="py-2 text-right border-r">
                      {formatCurrency(rapportTotaux.sumReglements ?? 0)}
                    </TableCell>
                    <TableCell className="py-2 text-right border-r">
                      {formatCurrency(rapportTotaux.sumRetours ?? 0)}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      {formatCurrency(rapportTotaux.detteFinale ?? 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
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
