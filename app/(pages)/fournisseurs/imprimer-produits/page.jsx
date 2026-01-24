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
import { formatCurrency } from "@/lib/functions";
import { useEffect, useState } from "react";

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
      <div className="container mx-auto max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none mb-10 p-6">
        {/* Document Content */}
        <div id="print-area" className="space-y-4">
          {/* Header */}
          <EnteteDevis />

          <div className="space-y-3">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-gray-900 mb-3">
                Liste des Produits Achetés
              </h3>

              {/* Informations du fournisseur */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex gap-2 items-center">
                  <h4 className="font-semibold text-gray-900">Fournisseur :</h4>
                  <p className="text-sm text-gray-600">{fournisseur?.nom}</p>
                </div>
                {fournisseur?.ice && (
                  <div className="flex gap-2 items-center">
                    <h4 className="font-semibold text-gray-900">ICE :</h4>
                    <p className="text-sm text-gray-600">{fournisseur.ice}</p>
                  </div>
                )}
                {fournisseur?.telephone && (
                  <div className="flex gap-2 items-center">
                    <h4 className="font-semibold text-gray-900">Téléphone :</h4>
                    <p className="text-sm text-gray-600">
                      {fournisseur.telephone}
                    </p>
                  </div>
                )}
                {periode && (
                  <div className="flex gap-2 items-center">
                    <h4 className="font-semibold text-gray-900">Période :</h4>
                    <p className="text-sm text-gray-600">{formatPeriode()}</p>
                  </div>
                )}
                <div className="flex gap-2 items-center">
                  <h4 className="font-semibold text-gray-900">Tri par :</h4>
                  <p className="text-sm text-gray-600">
                    {sortKey === "montant" ? "Montant" : "Quantité"}
                  </p>
                </div>
              </div>
            </div>

            {/* Tableau des produits */}
            <div className="rounded-xl border shadow-sm overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-center">Quantité</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produits?.length > 0 ? (
                    produits.map((produit, index) => (
                      <TableRow key={produit.produitId || index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {produit.designation}
                        </TableCell>
                        <TableCell className="text-center">
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
                <TableFooter className="bg-none">
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-right text-lg font-semibold p-2"
                    >
                      Total :
                    </TableCell>
                    <TableCell className="text-center text-lg font-semibold p-2">
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
        </div>

        {/* Bouton d'impression (caché à l'impression) */}
        <div className="flex items-center justify-end print:hidden mt-4">
          <DirectPrintButton className="bg-blue-500 hover:bg-blue-600 !text-white rounded-full">
            Imprimer
          </DirectPrintButton>
        </div>
      </div>
    </>
  );
}

