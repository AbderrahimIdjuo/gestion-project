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

export default function ImprimerReglements() {
  const [fournisseur, setFournisseur] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [bonLivraisons, setBonLivraisons] = useState([]);

  useEffect(() => {
    const storedData = localStorage.getItem("fournisseur-reglements-rapport");
    if (storedData) {
      const data = JSON.parse(storedData);
      setFournisseur(data.fournisseur);
      setTransactions(data.transactions);
      setBonLivraisons(data.bonLivraisons);
      console.log("Données fournisseur chargées depuis localStorage:", data);
    }
  }, []);

  // Suppression de la fonction handlePrint qui n'est plus nécessaire

  // Calcul du total des règlements pour le tableau
  const totalReglements =
    transactions?.reduce((sum, t) => sum + t.montant, 0) || 0;

  return (
    <>
      <div className="container mx-auto p-6 max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        {/* Document Content */}
        <div id="print-area" className="space-y-4">
          {/* Header */}
          <EnteteDevis />

          <div className="space-y-3">
            <div className="space-y-2">
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
              </div>

              {/* Section des cartes d'information financière supprimée */}
            </div>

            {/* Tableau des règlements */}
            <div className="rounded-xl border shadow-sm overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Compte</TableHead>
                    <TableHead>Méthode de Paiement</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.length > 0 ? (
                    transactions.map((reglement, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{formatDate(reglement.date)}</TableCell>
                        <TableCell>
                          {reglement.compte?.replace("compte ", "")}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium`}
                          >
                            {reglement.methodePaiement === "espece"
                              ? "Espèce"
                              : reglement.methodePaiement === "cheque"
                              ? "Chèque"
                              : reglement.methodePaiement}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(reglement.montant)}
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
                <TableFooter className="bg-none">
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-right text-lg font-semibold p-2"
                    >
                      Total des Règlements :
                    </TableCell>
                    <TableCell className="text-left text-lg font-semibold p-2">
                      {formatCurrency(totalReglements)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        </div>

        {/* Bouton d'impression (caché à l'impression) */}
        <div className="flex items-center justify-end print:hidden mt-4">
          <DirectPrintButton className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full">
            Imprimer
          </DirectPrintButton>
        </div>
      </div>
    </>
  );
}
