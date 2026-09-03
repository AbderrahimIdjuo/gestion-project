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
import { formatCurrency } from "@/lib/functions";
import { useEffect, useState } from "react";
import "@/styles/print-rapport.css";

export default function ImprimerProduits() {
  const [fournisseur, setFournisseur] = useState(null);
  const [produits, setProduits] = useState([]);
  const [periode, setPeriode] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [sortKey, setSortKey] = useState("montant");

  useEffect(() => {
    const storedData = localStorage.getItem("fournisseur-produits-rapport");
    if (storedData) {
      const data = JSON.parse(storedData);
      setFournisseur(data.fournisseur);
      setProduits(data.produits || []);
      setPeriode(data.periode || "");
      setStartDate(data.startDate || null);
      setEndDate(data.endDate || null);
      setSortKey(data.sortKey || "montant");
      console.log("Données produits chargées depuis localStorage:", data);
    }
  }, []);

  // Calcul du total des quantités et montants
  const totalQuantite = produits?.reduce((sum, p) => sum + (p.quantite || 0), 0) || 0;
  const totalMontant = produits?.reduce((sum, p) => sum + (p.montant || 0), 0) || 0;

  // Fonction pour formater la période
  const formatPeriode = () => {
    if (periode === "personnalisee") {
      if (startDate && endDate) {
        const start = new Date(startDate).toLocaleDateString("fr-FR");
        const end = new Date(endDate).toLocaleDateString("fr-FR");
        return `Du ${start} au ${end}`;
      }
      return "Période personnalisée";
    }
    const periodeLabels = {
      "aujourd'hui": "Aujourd'hui",
      "ce-mois": "Ce mois",
      "mois-dernier": "Le mois dernier",
      "trimestre-actuel": "Trimestre actuel",
      "trimestre-precedent": "Trimestre précédent",
      "cette-annee": "Cette année",
      "annee-derniere": "L'année dernière",
    };
    return periodeLabels[periode] || periode;
  };

  return (
    <>
      <div className="container mx-auto p-8 w-[90vw] bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        {/* Document Content */}
        <div id="print-area" className="space-y-4">
          {/* Header */}
          <div className="print-block">
            <EnteteDevis />
          </div>

          <RapportEntete
            title="Liste des Produits Achetés"
            leftLabel="Fournisseur"
            leftValue={fournisseur?.nom || "—"}
            rightValue={periode ? formatPeriode() : undefined}
            extraItems={[
              ...(fournisseur?.ice
                ? [{ label: "ICE", value: fournisseur.ice }]
                : []),
              ...(fournisseur?.telephone
                ? [{ label: "Téléphone", value: fournisseur.telephone }]
                : []),
              {
                label: "Tri par",
                value: sortKey === "montant" ? "Montant" : "Quantité",
              },
            ]}
            stats={[
              { label: "Quantité", value: totalQuantite },
              {
                label: "Montant",
                value: formatCurrency(totalMontant),
              },
            ]}
          />

            {/* Tableau des produits */}
            <div className="rounded-xl border shadow-sm overflow-x-auto main-table-container print-block">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="border-r border-b">#</TableHead>
                    <TableHead className="border-r border-b">Produit</TableHead>
                    <TableHead className="text-center border-r border-b">Quantité</TableHead>
                    <TableHead className="text-right border-b">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produits?.length > 0 ? (
                    produits.map((produit, index) => (
                      <TableRow key={produit.produitId || index} className="border-b">
                        <TableCell className="border-r">{index + 1}</TableCell>
                        <TableCell className="font-medium border-r">
                          {produit.designation}
                        </TableCell>
                        <TableCell className="text-center border-r">
                          {produit.quantite || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(produit.montant || 0)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-6 text-gray-500"
                      >
                        Aucun produit trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter className="bg-gray-50 table-footer-print">
                  <TableRow className="border-b">
                    <TableCell
                      colSpan={2}
                      className="text-right text-lg font-semibold p-2 border-r"
                    >
                      Total :
                    </TableCell>
                    <TableCell className="text-center text-lg font-semibold p-2 border-r">
                      {totalQuantite}
                    </TableCell>
                    <TableCell className="text-right text-lg font-semibold p-2">
                      {formatCurrency(totalMontant)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
        </div>

        {/* Bouton d'impression (caché à l'impression) */}
        <div className="fixed bottom-4 right-4 z-50 print:hidden">
          <DirectPrintButton className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full shadow-lg">
            Imprimer
          </DirectPrintButton>
        </div>
      </div>
    </>
  );
}
