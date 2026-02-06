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
import { formatCurrency, formatDate } from "@/lib/functions";
import { useEffect, useState } from "react";

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
      <div className="container mx-auto max-w-5xl p-6">
        <p className="text-muted-foreground">Aucune donnée de rapport à imprimer.</p>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto max-w-5xl bg-white min-h-screen print:p-0 print:max-w-none mb-10 p-6">
        <div id="print-area" className="space-y-4">
          <EnteteDevis />
          <div className="space-y-3">
            <h3 className="font-semibold text-lg text-gray-900">
              Rapport BL & Règlements
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex gap-2 items-center">
                <h4 className="font-semibold text-gray-900">Fournisseur :</h4>
                <p className="text-sm text-gray-600">{fournisseur?.nom ?? "—"}</p>
              </div>
              <div className="flex gap-2 items-center">
                <h4 className="font-semibold text-gray-900">Période :</h4>
                <p className="text-sm text-gray-600">{formatPeriode()}</p>
              </div>
            </div>
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Référence</TableHead>
                    <TableHead className="font-semibold text-right">Fourniture</TableHead>
                    <TableHead className="font-semibold text-right">Règlement</TableHead>
                    <TableHead className="font-semibold text-right">Retour</TableHead>
                    <TableHead className="font-semibold text-right">Dette</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-gray-700 text-white font-semibold">
                    <TableCell className="py-2">DETTE INITIALE</TableCell>
                    <TableCell className="py-2" colSpan={4}></TableCell>
                    <TableCell className="py-2 text-right">
                      {formatCurrency(rapportTotaux.detteInitiale ?? 0)}
                    </TableCell>
                  </TableRow>
                  {rapportItems.map((item, index) => (
                    <TableRow key={`${item.reference}-${index}`} className="border-b">
                      <TableCell className="py-2">{formatDateString(item.date)}</TableCell>
                      <TableCell className="py-2 font-medium">
                        {item.itemType === "reglement" && item.motif
                          ? item.motif
                          : item.reference}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        {item.itemType === "bl" && item.blType === "achats"
                          ? formatCurrency(item.montant ?? 0)
                          : ""}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        {item.itemType === "reglement"
                          ? formatCurrency(Math.abs(item.montant ?? 0))
                          : ""}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        {item.itemType === "bl" && item.blType === "retour"
                          ? formatCurrency(Math.abs(item.montant ?? 0))
                          : ""}
                      </TableCell>
                      <TableCell className="py-2 text-right font-medium">
                        {formatCurrency(rapportTotaux.runningDette?.[index] ?? 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50 font-semibold border-b">
                    <TableCell className="py-2">DETTE FINALE</TableCell>
                    <TableCell className="py-2" colSpan={4}></TableCell>
                    <TableCell className="py-2 text-right">
                      {formatCurrency(rapportTotaux.detteFinale ?? 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        <div className="flex justify-end print:hidden mt-5">
          <DirectPrintButton className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-full">
            Imprimer
          </DirectPrintButton>
        </div>
      </div>
    </>
  );
}
