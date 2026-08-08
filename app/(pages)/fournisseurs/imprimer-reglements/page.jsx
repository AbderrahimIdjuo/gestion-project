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
import "@/styles/print-rapport.css";

export default function ImprimerReglements() {
  const [fournisseur, setFournisseur] = useState(null);
  const [reglements, setReglements] = useState([]);
  const [bonLivraisons, setBonLivraisons] = useState([]);
  const [periode, setPeriode] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    const storedData = localStorage.getItem("fournisseur-reglements-rapport");
    if (storedData) {
      const data = JSON.parse(storedData);
      setFournisseur(data.fournisseur);
      setReglements(data.reglements || data.transactions || []);
      setBonLivraisons(data.bonLivraisons);
      setPeriode(data.periode || "");
      setStartDate(data.startDate || null);
      setEndDate(data.endDate || null);
      console.log("Données fournisseur chargées depuis localStorage:", data);
    }
  }, []);

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

  // Suppression de la fonction handlePrint qui n'est plus nécessaire

  // Calcul du total des règlements pour le tableau
  const totalReglements =
    reglements?.reduce((sum, r) => sum + (r.montant || 0), 0) || 0;

  return (
    <>
      <div className="container mx-auto p-8 w-[90vw] bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        {/* Document Content */}
        <div id="print-area" className="space-y-4">
          {/* Header */}
          <div className="print-block">
            <EnteteDevis />
          </div>

          <div className="space-y-3">
            <div className="space-y-2 print-block">
              <h3 className="font-semibold text-lg text-gray-900 mb-3">
                Règlements du Fournisseur
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
              </div>

              {/* Section des cartes d'information financière supprimée */}
            </div>

            {/* Tableau des règlements */}
            <div className="rounded-xl border shadow-sm overflow-x-auto main-table-container print-block">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="border-r border-b">#</TableHead>
                    <TableHead className="border-r border-b">Date</TableHead>
                    <TableHead className="border-r border-b">Compte</TableHead>
                    <TableHead className="border-r border-b">Méthode de Paiement</TableHead>
                    <TableHead className="text-right border-b">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reglements?.length > 0 ? (
                    reglements.map((reglement, index) => (
                      <TableRow key={reglement.id || index} className="border-b">
                        <TableCell className="border-r">{index + 1}</TableCell>
                        <TableCell className="border-r">
                          {formatDate(reglement.dateReglement || reglement.date)}
                        </TableCell>
                        <TableCell className="border-r">
                          {reglement.compte?.replace("compte ", "")}
                        </TableCell>
                        <TableCell className="border-r">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium`}
                          >
                            {reglement.methodePaiement === "espece"
                              ? "Espèce"
                              : reglement.methodePaiement === "cheque"
                              ? "Chèque"
                              : reglement.methodePaiement === "versement"
                              ? "Versement"
                              : reglement.methodePaiement === "traite"
                              ? "Traite"
                              : reglement.methodePaiement}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(reglement.montant || 0)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-6 text-gray-500"
                      >
                        Aucun règlement trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter className="bg-gray-50 table-footer-print">
                  <TableRow className="border-b">
                    <TableCell
                      colSpan={4}
                      className="text-right text-lg font-semibold p-2 border-r"
                    >
                      Total des Règlements :
                    </TableCell>
                    <TableCell className="text-right text-lg font-semibold p-2">
                      {formatCurrency(totalReglements)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
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
