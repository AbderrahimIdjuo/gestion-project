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

// Même style que le dialogue rapport : couleurs par statut
function getStatutStyle(statut) {
  if (statut === "paye")
    return { label: "Payé", colorClass: "bg-green-100 text-green-700" };
  if (statut === "impaye")
    return { label: "Impayé", colorClass: "bg-red-100 text-red-700" };
  if (statut === "enPartie")
    return { label: "En partie", colorClass: "bg-amber-100 text-amber-700" };
  return {
    label: statut || "Indéterminé",
    colorClass: "bg-gray-200 text-gray-700",
  };
}

export default function ImprimerRapport() {
  const [bonLivraison, setBonLivraison] = useState();
  useEffect(() => {
    const storedData = localStorage.getItem("bonLivraison-rapport");
    if (storedData) {
      setBonLivraison(JSON.parse(storedData));
    }
  }, []);

  const transactions = bonLivraison?.transactions || [];
  const modeAffichage = bonLivraison?.modeAffichage;

  const formatDateString = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return formatDate(date.toISOString());
  };

  // Contenu du tableau selon le mode (synchronisé avec le dialogue)
  const renderTable = () => {
    // Mode "par BL" : même tableau que dans le dialogue
    if (modeAffichage === "parBL") {
      const bls = bonLivraison?.bls || [];
      if (bls.length === 0) {
        return (
          <div className="text-center py-10 text-muted-foreground">
            <p>Aucun bon de livraison trouvé</p>
          </div>
        );
      }
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-left">N° BL</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead className="text-right">Montant payé</TableHead>
              <TableHead>Statut paiement</TableHead>
              <TableHead className="text-right">Reste à payé</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bls.map((bl) => {
              const restAPayer = bl.restAPayer ?? (bl.total || 0) - (bl.totalPaye || 0);
              const fournisseurNom = bl.fournisseur?.nom ?? "Inconnu";
              const typeLabel =
                bl.type === "achats"
                  ? "Achats"
                  : bl.type === "retour"
                    ? "Retour"
                    : bl.type || "—";
              const { label: statutLabel, colorClass: statutColorClass } =
                getStatutStyle(bl.statutPaiement);
              return (
                <TableRow key={bl.id} className="border-b">
                  <TableCell className="px-1 py-2 font-medium">
                    {bl.date ? formatDateString(bl.date) : "—"}
                  </TableCell>
                  <TableCell className="px-1 py-2 font-medium">
                    {bl.numero || bl.reference || "—"}
                  </TableCell>
                  <TableCell className="px-1 py-2">{fournisseurNom}</TableCell>
                  <TableCell className="px-1 py-2">
                    <span
                      className={
                        bl.type === "achats"
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {typeLabel}
                    </span>
                  </TableCell>
                  <TableCell className="px-1 py-2 text-right pr-4">
                    <span
                      className={
                        bl.type === "achats"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {formatCurrency(bl.total || 0)}
                    </span>
                  </TableCell>
                  <TableCell className="px-1 py-2 text-right pr-4">
                    {bl.type === "retour"
                      ? "—"
                      : formatCurrency(bl.totalPaye || 0)}
                  </TableCell>
                  <TableCell className="px-1 py-2">
                    {bl.type === "retour" ? (
                      "—"
                    ) : (
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold uppercase ${statutColorClass}`}
                      >
                        {statutLabel}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-1 py-2 text-right pr-4 font-medium">
                    {formatCurrency(restAPayer)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter className="bg-gray-50">
            <TableRow className="border-b font-semibold">
              <TableCell colSpan={5} className="p-2 text-right text-sky-600 text-xl">
                Montant total
              </TableCell>
              <TableCell className="p-2"></TableCell>
              <TableCell className="p-2"></TableCell>
              <TableCell className="p-2 text-right pr-4 text-sky-600 text-xl">
                {formatCurrency(bonLivraison?.montantTotal || 0)}
              </TableCell>
            </TableRow>
            <TableRow className="border-b font-semibold">
              <TableCell colSpan={5} className="p-2 text-right text-green-600 text-xl">
                Montant payé
              </TableCell>
              <TableCell className="p-2"></TableCell>
              <TableCell className="p-2"></TableCell>
              <TableCell className="p-2 text-right pr-4 text-green-600 text-xl">
                {formatCurrency(bonLivraison?.montantPaye || 0)}
              </TableCell>
            </TableRow>
            <TableRow className="border-b font-semibold">
              <TableCell colSpan={5} className="p-2 text-right text-rose-600 text-xl">
                Reste à payé
              </TableCell>
              <TableCell className="p-2"></TableCell>
              <TableCell className="p-2"></TableCell>
              <TableCell className="p-2 text-right pr-4 text-rose-600 text-xl">
                {formatCurrency(bonLivraison?.restAPaye || 0)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );
    }

    // Mode "par montant" : même tableau que dans le dialogue
    if (modeAffichage === "parMontant") {
      const grouped = bonLivraison?.grouped || [];
      if (grouped.length === 0) {
        return (
          <div className="text-center py-10 text-muted-foreground">
            <p>Aucune donnée</p>
          </div>
        );
      }
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead className="text-right">Montant des BL</TableHead>
              <TableHead className="text-right">Reste à payé</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grouped.map((row, idx) => (
              <TableRow key={`${row.fournisseur}-${idx}`} className="border-b">
                <TableCell className="text-left px-4 py-2 font-medium">
                  {idx + 1}
                </TableCell>
                <TableCell className="px-1 py-2 font-medium">
                  {row.fournisseur}
                </TableCell>
                <TableCell className="px-1 py-2 text-right pr-4">
                  <span
                    className={
                      row.total >= 0 ? "text-green-600" : "text-red-600"
                    }
                  >
                    {formatCurrency(row.total)}
                  </span>
                </TableCell>
                <TableCell className="px-1 py-2 text-right pr-4 font-medium">
                  {formatCurrency(row.restAPayer)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-gray-50">
            <TableRow className="border-b font-semibold">
              <TableCell className="p-2 text-right text-sky-600 text-xl" colSpan={3}>
                Montant total
              </TableCell>
              <TableCell className="p-2 text-right text-sky-600 pr-4 text-xl">
                {formatCurrency(bonLivraison?.montantTotal || 0)}
              </TableCell>
            </TableRow>
            <TableRow className="border-b font-semibold">
              <TableCell className="p-2 text-right text-green-600 text-xl" colSpan={3}>
                Montant payé
              </TableCell>
              <TableCell className="p-2 text-right pr-4 text-green-600 text-xl">
                {formatCurrency(bonLivraison?.montantPaye || 0)}
              </TableCell>
            </TableRow>
            <TableRow className="border-b font-semibold">
              <TableCell className="p-2 text-right text-rose-600 text-xl" colSpan={3}>
                Reste à payé
              </TableCell>
              <TableCell className="p-2 text-right pr-4 text-rose-600 text-xl">
                {formatCurrency(bonLivraison?.restAPaye || 0)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );
    }

    // Ancienne vue par transaction (dette initiale + transactions + dette finale)
    return (
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
          <TableRow className="bg-gray-700 text-white">
            <TableCell className="px-1 py-2 font-semibold">
              DETTE INITIALE
            </TableCell>
            <TableCell className="px-1 py-2" colSpan={4}></TableCell>
            <TableCell className="px-1 py-2 text-right pr-4 font-semibold">
              {formatCurrency(bonLivraison?.detteInitiale || 0)}
            </TableCell>
          </TableRow>
          {transactions.map((transaction, index) => (
            <TableRow
              key={`${transaction.type}-${transaction.id}-${index}`}
              className="border-b"
            >
              <TableCell className="px-1 py-2">
                {formatDateString(transaction.date)}
              </TableCell>
              <TableCell className="px-1 py-2">
                {transaction.fournisseur}
              </TableCell>
              <TableCell className="px-1 py-2 text-right pr-4">
                {transaction.type === "bonLivraison" &&
                transaction.blType === "achats" ? (
                  <span className="text-green-600">
                    {formatCurrency(transaction.montant)}
                  </span>
                ) : (
                  ""
                )}
              </TableCell>
              <TableCell className="px-1 py-2 text-right pr-4">
                {transaction.type === "bonLivraison" &&
                transaction.blType === "retour" ? (
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
    );
  };

  return (
    <>
      <div className="container mx-auto p-8 max-w-6xl bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        <div id="print-area" className="space-y-3">
          <EnteteDevis />

          <div className="space-y-2">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                Rapport des achats
              </h3>
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
                  <h3 className="font-semibold text-gray-900">Période :</h3>
                  <p className="text-sm text-gray-600">
                    {bonLivraison?.from && bonLivraison?.to
                      ? `${formatDateString(bonLivraison.from)} • ${formatDateString(bonLivraison.to)}`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border shadow-sm overflow-x-auto">
              {bonLivraison ? renderTable() : null}
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
