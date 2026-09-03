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
import { useEffect, useState } from "react";
import "@/styles/print-rapport.css";
import "./page.css";

// Même style que le dialogue rapport : couleurs par statut
function labelMethodePaiement(methode) {
  if (!methode) return "";
  if (methode === "versement") return "Versement";
  if (methode === "cheque") return "Chèque";
  if (methode === "espece") return "Espèce";
  if (methode === "traite") return "Traite";
  return methode;
}

function descriptionReglement(item) {
  const parts = [];
  const methode = labelMethodePaiement(item.methodePaiement);
  if (methode) parts.push(methode);
  if (item.compte) parts.push(item.compte);
  return parts.join(" · ");
}

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
      <Table className="border-collapse">
        <TableHeader>
          <TableRow className="border-b">
            <TableHead className="text-center border-r border-b text-black font-semibold">
              Date
            </TableHead>
            <TableHead className="text-center border-r border-b text-black font-semibold">
              N° BL
            </TableHead>
            <TableHead className="text-center col-fournisseur border-r border-b text-black font-semibold">
              Fournisseur
            </TableHead>
            <TableHead className="text-center border-r border-b text-black font-semibold">
              Type
            </TableHead>
            <TableHead className="text-center border-r border-b text-black font-semibold">
              Montant
            </TableHead>
            <TableHead className="text-center border-r border-b text-black font-semibold">
              Montant payé
            </TableHead>
            <TableHead className="text-center border-r border-b text-black font-semibold">
              Statut paiement
            </TableHead>
            <TableHead className="text-center border-b text-black font-semibold">
              Reste à payer
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bls.map((bl) => {
            const fournisseurNom = bl.fournisseur?.nom ?? "Inconnu";
            const typeLabel =
              bl.type === "achats" ? "Achats" : bl.type === "retour" ? "Retour" : bl.type || "—";
            const { label: statutLabel, colorClass: statutColorClass } =
              getStatutStyle(bl.statutPaiement);
            return (
              <TableRow key={bl.id} className="border-b">
                <TableCell className="px-1 py-2 font-medium border-r">
                  {bl.date ? formatDateString(bl.date) : "—"}
                </TableCell>
                <TableCell className="px-1 py-2 font-medium border-r">
                  {bl.numero || bl.reference || "—"}
                </TableCell>
                <TableCell className="px-1 py-2 col-fournisseur border-r" title={fournisseurNom}>{fournisseurNom}</TableCell>
                <TableCell className="px-1 py-2 border-r">
                  <span className="text-foreground font-medium">
                    {typeLabel}
                  </span>
                </TableCell>
                <TableCell className="px-1 py-2 text-right pr-4 text-foreground border-r">
                  {formatCurrency(bl.total || 0)}
                </TableCell>
                <TableCell className="px-1 py-2 text-right pr-4 text-foreground border-r">
                  {bl.type === "retour" ? "—" : formatCurrency(bl.totalPaye || 0)}
                </TableCell>
                <TableCell className="px-1 py-2 border-r">
                  {bl.type === "retour" ? (
                    "—"
                  ) : (
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold uppercase ${statutColorClass}`}>
                      {statutLabel}
                    </span>
                  )}
                </TableCell>
                <TableCell className="px-1 py-2 text-right pr-4 font-medium text-foreground">
                  {bl.type === "retour"
                    ? "—"
                    : formatCurrency(
                        bl.restAPayer ??
                          (bl.total || 0) - (bl.totalPaye || 0)
                      )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter className="bg-gray-50 table-footer-print">
          <TableRow className="border-b font-semibold">
            <TableCell colSpan={5} className="p-2 text-right text-xl text-foreground border-r">Montant total</TableCell>
            <TableCell className="p-2 border-r" />
            <TableCell className="p-2 border-r" />
            <TableCell className="p-2 text-right pr-4 text-xl text-foreground">
              {formatCurrency(bonLivraison?.montantTotal || 0)}
            </TableCell>
          </TableRow>
          <TableRow className="border-b font-semibold">
            <TableCell colSpan={5} className="p-2 text-right text-xl text-foreground border-r">Montant payé</TableCell>
            <TableCell className="p-2 border-r" />
            <TableCell className="p-2 border-r" />
            <TableCell className="p-2 text-right pr-4 text-xl text-foreground">
              {formatCurrency(bonLivraison?.montantPaye || 0)}
            </TableCell>
          </TableRow>
          <TableRow className="border-b font-semibold">
            <TableCell colSpan={5} className="p-2 text-right text-xl text-foreground border-r">Reste à payé</TableCell>
            <TableCell className="p-2 border-r" />
            <TableCell className="p-2 border-r" />
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
        <Table className="border-collapse">
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="text-center border-r border-b text-black font-semibold">
                Date
              </TableHead>
              <TableHead className="text-center col-description border-r border-b text-black font-semibold">
                Description
              </TableHead>
              {showFournisseurCol && (
                <TableHead className="text-center col-fournisseur border-r border-b text-black font-semibold">
                  Fournisseur
                </TableHead>
              )}
              <TableHead className="text-center border-r border-b text-black font-semibold">
                Fourniture
              </TableHead>
              <TableHead className="text-center border-r border-b text-black font-semibold">
                Règlement
              </TableHead>
              <TableHead className="text-center border-r border-b text-black font-semibold">
                Retour
              </TableHead>
              <TableHead className="text-center border-b text-black font-semibold">
                Dette
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-gray-100 border-b font-semibold">
              <TableCell className="py-2 border-r">DETTE INITIALE</TableCell>
              <TableCell className="py-2 border-r" colSpan={showFournisseurCol ? 5 : 4} />
              <TableCell className="py-2 text-right font-semibold text-foreground">
                {formatCurrency(totaux.detteInitiale ?? 0)}
              </TableCell>
            </TableRow>
            {items.map((item, index) => (
              <TableRow
                key={`${item.itemType}-${item.reference}-${index}`}
                className="border-b"
              >
                <TableCell className="py-2 border-r">
                  {item.date ? formatDateString(item.date) : "—"}
                </TableCell>
                <TableCell
                  className="py-2 font-medium col-description border-r"
                  title={
                    item.itemType === "reglement"
                      ? descriptionReglement(item)
                      : item.reference
                  }
                >
                  {item.itemType === "reglement"
                    ? descriptionReglement(item)
                    : item.reference}
                </TableCell>
                {showFournisseurCol && (
                  <TableCell className="py-2 text-muted-foreground col-fournisseur border-r" title={item.fournisseurNom ?? "—"}>
                    {item.fournisseurNom ?? "—"}
                  </TableCell>
                )}
                <TableCell className="py-2 text-right border-r">
                  {item.itemType === "bl" && item.blType === "achats" ? (
                    <span className="text-foreground font-medium">
                      {formatCurrency(item.montant)}
                    </span>
                  ) : (
                    ""
                  )}
                </TableCell>
                <TableCell className="py-2 text-right border-r">
                  {item.itemType === "reglement" ? (
                    <span className="text-foreground font-medium">
                      {formatCurrency(Math.abs(item.montant || 0))}
                    </span>
                  ) : (
                    ""
                  )}
                </TableCell>
                <TableCell className="py-2 text-right border-r">
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
          </TableBody>
          <TableFooter className="bg-gray-50 table-footer-print">
            <TableRow className="border-b">
              <TableCell
                className="text-right text-xl font-bold border-r"
                colSpan={showFournisseurCol ? 3 : 2}
              >
                Total :
              </TableCell>
              <TableCell className="text-right text-xl font-bold border-r">
                {formatCurrency(totalFourniture)}
              </TableCell>
              <TableCell className="text-right text-xl font-bold border-r">
                {formatCurrency(totalReglement)}
              </TableCell>
              <TableCell className="text-right text-xl font-bold border-r">
                {formatCurrency(totalRetour)}
              </TableCell>
              <TableCell className="text-right text-xl font-bold">
                {formatCurrency(totaux.detteFinale ?? 0)}
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
        <Table className="border-collapse">
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="text-center border-r border-b text-black font-semibold">
                #
              </TableHead>
              <TableHead className="text-center col-fournisseur border-r border-b text-black font-semibold">
                Fournisseur
              </TableHead>
              <TableHead className="text-center border-r border-b text-black font-semibold">
                Montant des BL
              </TableHead>
              <TableHead className="text-center border-b text-black font-semibold">
                Reste à payer
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grouped.map((row, idx) => (
              <TableRow key={`${row.fournisseur}-${idx}`} className="border-b">
                <TableCell className="text-left px-4 py-2 font-medium border-r">
                  {idx + 1}
                </TableCell>
                <TableCell className="px-1 py-2 font-medium col-fournisseur border-r" title={row.fournisseur}>
                  {row.fournisseur}
                </TableCell>
                <TableCell className="px-1 py-2 text-right pr-4 text-foreground border-r">
                  {formatCurrency(row.total)}
                </TableCell>
                <TableCell className="px-1 py-2 text-right pr-4 font-medium text-foreground">
                  {formatCurrency(row.restAPayer)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-gray-50 table-footer-print">
            <TableRow className="border-b">
              <TableCell
                className="text-right text-xl font-bold border-r"
                colSpan={3}
              >
                Montant total :
              </TableCell>
              <TableCell className="text-right text-xl font-bold">
                {formatCurrency(bonLivraison?.montantTotal || 0)}
              </TableCell>
            </TableRow>
            <TableRow className="border-b">
              <TableCell
                className="text-right text-xl font-bold border-r"
                colSpan={3}
              >
                Montant payé :
              </TableCell>
              <TableCell className="text-right text-xl font-bold">
                {formatCurrency(bonLivraison?.montantPaye || 0)}
              </TableCell>
            </TableRow>
            <TableRow className="border-b">
              <TableCell
                className="text-right text-xl font-bold border-r"
                colSpan={3}
              >
                Reste à payer :
              </TableCell>
              <TableCell className="text-right text-xl font-bold">
                {formatCurrency(bonLivraison?.restAPaye || 0)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );
    }

    // Ancienne vue par transaction (dette initiale + transactions + dette finale)
    return (
      <Table className="border-collapse">
        <TableHeader>
          <TableRow className="border-b">
            <TableHead className="text-center border-r border-b text-black font-semibold">
              Date
            </TableHead>
            <TableHead className="text-center col-fournisseur border-r border-b text-black font-semibold">
              Fournisseur
            </TableHead>
            <TableHead className="text-center border-r border-b text-black font-semibold">
              Fourniture
            </TableHead>
            <TableHead className="text-center border-r border-b text-black font-semibold">
              Retour
            </TableHead>
            <TableHead className="text-center border-r border-b text-black font-semibold">
              Règlement
            </TableHead>
            <TableHead className="text-center border-b text-black font-semibold">
              Dette
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="bg-gray-100 border-b">
            <TableCell className="px-1 py-2 font-semibold border-r">
              DETTE INITIALE
            </TableCell>
            <TableCell className="px-1 py-2 border-r" colSpan={4}></TableCell>
            <TableCell className="px-1 py-2 text-right pr-4 font-semibold text-foreground">
              {formatCurrency(bonLivraison?.detteInitiale || 0)}
            </TableCell>
          </TableRow>
          {transactions.map((transaction, index) => (
            <TableRow
              key={`${transaction.type}-${transaction.id}-${index}`}
              className="border-b"
            >
              <TableCell className="px-1 py-2 border-r">
                {formatDateString(transaction.date)}
              </TableCell>
              <TableCell className="px-1 py-2 col-fournisseur border-r" title={transaction.fournisseur}>
                {transaction.fournisseur}
              </TableCell>
              <TableCell className="px-1 py-2 text-right pr-4 text-foreground border-r">
                {transaction.type === "bonLivraison" &&
                transaction.blType === "achats"
                  ? formatCurrency(transaction.montant)
                  : ""}
              </TableCell>
              <TableCell className="px-1 py-2 text-right pr-4 text-foreground border-r">
                {transaction.type === "bonLivraison" &&
                transaction.blType === "retour"
                  ? formatCurrency(transaction.montant)
                  : ""}
              </TableCell>
              <TableCell className="px-1 py-2 text-right pr-4 text-foreground border-r">
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
        <TableFooter className="bg-gray-50 table-footer-print">
          <TableRow className="border-b">
            <TableCell
              colSpan={5}
              className="text-right text-xl font-bold border-r"
            >
              Dette finale :
            </TableCell>
            <TableCell className="text-right text-xl font-bold">
              {formatCurrency(bonLivraison?.detteFinale || 0)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
  };

  return (
    <>
      <div className="container mx-auto p-8 w-[90vw] bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        <div id="print-area" className="space-y-3">
          <div className="print-block">
            <EnteteDevis />
          </div>

          <RapportEntete
            title="Rapport des achats"
            rightLabel="Date de création"
            rightValue={formatDate(new Date().toISOString())}
            stats={[
              {
                label: "Fournisseur",
                value: bonLivraison?.fournisseurNom || "Tous",
              },
              {
                label: "Période",
                value:
                  bonLivraison?.from && bonLivraison?.to
                    ? `${formatDateString(bonLivraison.from)} • ${formatDateString(
                        bonLivraison.to
                      )}`
                    : "—",
              },
              ...(bonLivraison?.typeLabel
                ? [{ label: "Type", value: bonLivraison.typeLabel }]
                : []),
              ...(bonLivraison?.statutPaiementLabel
                ? [
                    {
                      label: "Statut paiement",
                      value: bonLivraison.statutPaiementLabel,
                    },
                  ]
                : []),
              ...(bonLivraison?.modeAffichageLabel
                ? [
                    {
                      label: "Affichage",
                      value: bonLivraison.modeAffichageLabel,
                    },
                  ]
                : []),
              ...(bonLivraison?.modeAffichage === "parBL"
                ? [
                    {
                      label: "Fourniture",
                      value: formatCurrency(bonLivraison?.totalFourniture || 0),
                    },
                    {
                      label: "Règlement",
                      value: formatCurrency(bonLivraison?.totalReglement || 0),
                      valueClassName: "text-green-600",
                    },
                    {
                      label: "Retour",
                      value: formatCurrency(bonLivraison?.totalRetour || 0),
                      valueClassName: "text-red-600",
                    },
                  ]
                : [
                    {
                      label: "Montant total",
                      value: formatCurrency(bonLivraison?.montantTotal || 0),
                    },
                    {
                      label: "Montant payé",
                      value: formatCurrency(bonLivraison?.montantPaye || 0),
                      valueClassName: "text-green-600",
                    },
                    {
                      label: "Reste à payer",
                      value: formatCurrency(bonLivraison?.restAPaye || 0),
                      valueClassName: "text-amber-600",
                    },
                  ]),
            ]}
          />

            <div className="rounded-xl border shadow-sm overflow-x-auto main-table-container print-block">
              {bonLivraison ? renderTable() : null}
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
