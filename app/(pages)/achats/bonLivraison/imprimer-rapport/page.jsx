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

  // Ancien format par BL (liste des BL) — fallback si rapportItems absent
  function renderTableParBLAncien(bls) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead >Date</TableHead>
            <TableHead className="text-left">N° BL</TableHead>
            <TableHead className="col-fournisseur">Fournisseur</TableHead>
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
              bl.type === "achats" ? "Achats" : bl.type === "retour" ? "Retour" : bl.type || "—";
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
                <TableCell className="px-1 py-2 col-fournisseur" title={fournisseurNom}>{fournisseurNom}</TableCell>
                <TableCell className="px-1 py-2">
                  <span className="text-foreground font-medium">
                    {typeLabel}
                  </span>
                </TableCell>
                <TableCell className="px-1 py-2 text-right pr-4 text-foreground">
                  {formatCurrency(bl.total || 0)}
                </TableCell>
                <TableCell className="px-1 py-2 text-right pr-4 text-foreground">
                  {bl.type === "retour" ? "—" : formatCurrency(bl.totalPaye || 0)}
                </TableCell>
                <TableCell className="px-1 py-2">
                  {bl.type === "retour" ? (
                    "—"
                  ) : (
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold uppercase ${statutColorClass}`}>
                      {statutLabel}
                    </span>
                  )}
                </TableCell>
                <TableCell className="px-1 py-2 text-right pr-4 font-medium text-foreground">
                  {formatCurrency(restAPayer)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter className="bg-gray-50">
          <TableRow className="border-b font-semibold">
            <TableCell colSpan={5} className="p-2 text-right text-xl text-foreground">Montant total</TableCell>
            <TableCell className="p-2" />
            <TableCell className="p-2" />
            <TableCell className="p-2 text-right pr-4 text-xl text-foreground">
              {formatCurrency(bonLivraison?.montantTotal || 0)}
            </TableCell>
          </TableRow>
          <TableRow className="border-b font-semibold">
            <TableCell colSpan={5} className="p-2 text-right text-xl text-foreground">Montant payé</TableCell>
            <TableCell className="p-2" />
            <TableCell className="p-2" />
            <TableCell className="p-2 text-right pr-4 text-xl text-foreground">
              {formatCurrency(bonLivraison?.montantPaye || 0)}
            </TableCell>
          </TableRow>
          <TableRow className="border-b font-semibold">
            <TableCell colSpan={5} className="p-2 text-right text-xl text-foreground">Reste à payé</TableCell>
            <TableCell className="p-2" />
            <TableCell className="p-2" />
            <TableCell className="p-2 text-right pr-4 text-xl text-foreground">
              {formatCurrency(bonLivraison?.restAPaye || 0)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
  }

  // Contenu du tableau selon le mode (synchronisé avec le dialogue)
  const renderTable = () => {
    // Mode "par BL" : tableau Rapport BL & Règlements (comme dans le dialogue)
    if (modeAffichage === "parBL") {
      const items = bonLivraison?.rapportItems || [];
      const totaux = bonLivraison?.rapportTotaux || {};
      const showFournisseurCol = !!bonLivraison?.showFournisseurCol;
      const totalFourniture = bonLivraison?.totalFourniture ?? 0;
      const totalReglement = bonLivraison?.totalReglement ?? 0;
      const totalRetour = bonLivraison?.totalRetour ?? 0;
      const runningDette = totaux.runningDette || [];

      if (items.length === 0) {
        const bls = bonLivraison?.bls || [];
        if (bls.length > 0) {
          return renderTableParBLAncien(bls);
        }
        return (
          <div className="text-center py-10 text-muted-foreground">
            <p>Aucune donnée pour cette période</p>
          </div>
        );
      }

      return (
        <Table>
          <TableHeader className="bg-gradient-to-r from-zinc-50 to-zinc-100 border-b">
            <TableRow>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold col-description">Description</TableHead>
              {showFournisseurCol && (
                <TableHead className="font-semibold col-fournisseur">Fournisseur</TableHead>
              )}
              <TableHead className="font-semibold text-right">Fourniture</TableHead>
              <TableHead className="font-semibold text-right">Règlement</TableHead>
              <TableHead className="font-semibold text-right">Retour</TableHead>
              <TableHead className="font-semibold text-right">Dette</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-gray-100 border-b font-semibold">
              <TableCell className="py-2">DETTE INITIALE</TableCell>
              <TableCell className="py-2" colSpan={showFournisseurCol ? 5 : 4} />
              <TableCell className="py-2 text-right font-semibold text-foreground">
                {formatCurrency(totaux.detteInitiale ?? 0)}
              </TableCell>
            </TableRow>
            {items.map((item, index) => (
              <TableRow
                key={`${item.itemType}-${item.reference}-${index}`}
                className="border-b"
              >
                <TableCell className="py-2">
                  {item.date ? formatDateString(item.date) : "—"}
                </TableCell>
                <TableCell className="py-2 font-medium col-description" title={item.itemType === "reglement" && item.motif ? item.motif : item.reference}>
                  {item.itemType === "reglement" && item.motif
                    ? item.motif
                    : item.reference}
                </TableCell>
                {showFournisseurCol && (
                  <TableCell className="py-2 text-muted-foreground col-fournisseur" title={item.fournisseurNom ?? "—"}>
                    {item.fournisseurNom ?? "—"}
                  </TableCell>
                )}
                <TableCell className="py-2 text-right">
                  {item.itemType === "bl" && item.blType === "achats" ? (
                    <span className="text-foreground font-medium">
                      {formatCurrency(item.montant)}
                    </span>
                  ) : (
                    ""
                  )}
                </TableCell>
                <TableCell className="py-2 text-right">
                  {item.itemType === "reglement" ? (
                    <span className="text-foreground font-medium">
                      {formatCurrency(Math.abs(item.montant || 0))}
                    </span>
                  ) : (
                    ""
                  )}
                </TableCell>
                <TableCell className="py-2 text-right">
                  {item.itemType === "bl" && item.blType === "retour" ? (
                    <span className="text-red-600 font-medium">
                      {formatCurrency(Math.abs(item.montant || 0))}
                    </span>
                  ) : (
                    ""
                  )}
                </TableCell>
                <TableCell
                  className="py-2 text-right font-medium text-foreground"
                >
                  {formatCurrency(runningDette[index] ?? 0)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-gray-100 border-b font-semibold">
              <TableCell className="py-2">Total</TableCell>
              <TableCell className="py-2" colSpan={showFournisseurCol ? 1 : 0} />
              {showFournisseurCol && <TableCell className="py-2" />}
              <TableCell className="py-2 text-right font-semibold text-foreground">
                {formatCurrency(totalFourniture)}
              </TableCell>
              <TableCell className="py-2 text-right font-semibold text-foreground">
                {formatCurrency(totalReglement)}
              </TableCell>
              <TableCell className="py-2 text-right font-semibold text-foreground">
                {formatCurrency(totalRetour)}
              </TableCell>
              <TableCell className="py-2 text-right font-semibold text-foreground">
                {formatCurrency(totaux.detteFinale ?? 0)}
              </TableCell>
            </TableRow>
          </TableBody>
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
              <TableHead className="col-fournisseur">Fournisseur</TableHead>
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
                <TableCell className="px-1 py-2 font-medium col-fournisseur" title={row.fournisseur}>
                  {row.fournisseur}
                </TableCell>
                <TableCell className="px-1 py-2 text-right pr-4 text-foreground">
                  {formatCurrency(row.total)}
                </TableCell>
                <TableCell className="px-1 py-2 text-right pr-4 font-medium text-foreground">
                  {formatCurrency(row.restAPayer)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-gray-50">
            <TableRow className="border-b font-semibold">
              <TableCell className="p-2 text-right text-xl text-foreground" colSpan={3}>
                Montant total
              </TableCell>
              <TableCell className="p-2 text-right pr-4 text-xl text-foreground">
                {formatCurrency(bonLivraison?.montantTotal || 0)}
              </TableCell>
            </TableRow>
            <TableRow className="border-b font-semibold">
              <TableCell className="p-2 text-right text-xl text-foreground" colSpan={3}>
                Montant payé
              </TableCell>
              <TableCell className="p-2 text-right pr-4 text-xl text-foreground">
                {formatCurrency(bonLivraison?.montantPaye || 0)}
              </TableCell>
            </TableRow>
            <TableRow className="border-b font-semibold">
              <TableCell className="p-2 text-right text-xl text-foreground" colSpan={3}>
                Reste à payé
              </TableCell>
              <TableCell className="p-2 text-right pr-4 text-xl text-foreground">
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
            <TableHead className="col-fournisseur">Fournisseur</TableHead>
            <TableHead className="text-right">Fourniture</TableHead>
            <TableHead className="text-right">Retour</TableHead>
            <TableHead className="text-right">Règlement</TableHead>
            <TableHead className="text-right">Dette</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="bg-gray-100">
            <TableCell className="px-1 py-2 font-semibold">
              DETTE INITIALE
            </TableCell>
            <TableCell className="px-1 py-2" colSpan={4}></TableCell>
            <TableCell className="px-1 py-2 text-right pr-4 font-semibold text-foreground">
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
              <TableCell className="px-1 py-2 col-fournisseur" title={transaction.fournisseur}>
                {transaction.fournisseur}
              </TableCell>
              <TableCell className="px-1 py-2 text-right pr-4 text-foreground">
                {transaction.type === "bonLivraison" &&
                transaction.blType === "achats"
                  ? formatCurrency(transaction.montant)
                  : ""}
              </TableCell>
              <TableCell className="px-1 py-2 text-right pr-4 text-foreground">
                {transaction.type === "bonLivraison" &&
                transaction.blType === "retour"
                  ? formatCurrency(transaction.montant)
                  : ""}
              </TableCell>
              <TableCell className="px-1 py-2 text-right pr-4 text-foreground">
                {transaction.type === "reglement"
                  ? formatCurrency(transaction.montant)
                  : ""}
              </TableCell>
              <TableCell className="px-1 py-2 text-right pr-4 font-semibold text-foreground">
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
            <TableCell className="text-right text-lg font-semibold p-2 text-foreground">
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

          <div className="space-y-3">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                Rapport des achats
              </h3>
                        <div className="flex items-center justify-between gap-2 px-4 py-2 rounded-lg bg-muted/50  text-sm print-block">
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
