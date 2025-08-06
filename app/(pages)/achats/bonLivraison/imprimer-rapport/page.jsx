"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EnteteDevis } from "@/components/Entete-devis";
import { formatMontant } from "@/lib/functions";
import { formatDate } from "@/lib/functions";


export default function ImprimerRapport() {
  const [bonLivraison, setBonLivraison] = useState();
  useEffect(() => {
    const storedData = localStorage.getItem("bonLivraison-rapport");
    if (storedData) {
      setBonLivraison(JSON.parse(storedData));
      console.log(
        "Bon de livraison data loaded from localStorage:",
        JSON.parse(storedData)
      );
    }
  }, []);
  const handlePrint = () => {
    window.print();
  };
  const fromDay = new Date(bonLivraison?.from);
  return (
    <>
      <div className="container mx-auto p-8 max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        {/* Document Content */}
        <div id="print-area" className="space-y-6">
          {/* Header */}
          <EnteteDevis />

          <div className="flex justify-between gap-8"></div>
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              {bonLivraison?.fournisseurNom && (
                <h1 className="text-xl font-semibold text-center">
                  Fournisseur : {bonLivraison?.fournisseurNom}
                </h1>
              )}

              {bonLivraison?.periode && (
                <h1 className="text-xl font-semibold text-center">
                  Période :du{" "}
                  {`${fromDay.getDate()}-${
                    fromDay.getMonth() + 1
                  }-${fromDay.getFullYear()}`}{" "}
                  au {formatDate(bonLivraison?.to)}
                </h1>
              )}
            </div>

            <div className="rounded-xl border shadow-sm overflow-x-auto">
              {bonLivraison?.fournisseurNom ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Montant Payé</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bonLivraison?.bons.map((bon, index) => (
                      <TableRow key={bon.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{formatDate(bon.date)}</TableCell>
                        <TableCell>{bon.reference}</TableCell>
                        <TableCell>{bon.fournisseur?.nom ?? "-"}</TableCell>
                        <TableCell>{bon.type}</TableCell>
                        <TableCell>{formatMontant(bon.total)} DH</TableCell>
                        <TableCell>{formatMontant(bon.totalPaye)} DH</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter className="bg-none">
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-right text-lg font-semibold p-2"
                      >
                        Total :
                      </TableCell>
                      <TableCell
                        colSpan={2}
                        className="text-left text-lg font-semibold p-2"
                      >
                        {formatMontant(bonLivraison?.total)} DH
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-t border-gray-200">
                      <TableCell
                        colSpan={5}
                        className="text-right text-lg font-semibold p-2"
                      >
                        Total Payé :
                      </TableCell>
                      <TableCell
                        colSpan={2}
                        className="text-left text-lg font-semibold p-2"
                      >
                        {formatMontant(bonLivraison?.totalPaye)} DH
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-t border-gray-200">
                      <TableCell
                        colSpan={5}
                        className="text-right text-lg font-semibold p-2"
                      >
                        Dette :
                      </TableCell>
                      <TableCell
                        colSpan={2}
                        className="text-left text-lg font-semibold p-2"
                      >
                        {formatMontant(bonLivraison?.rest)} DH
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>fourniseur</TableHead>
                      <TableHead className="px-1">Nbr BL</TableHead>
                      <TableHead className="px-1">Nbr Achats</TableHead>
                      <TableHead className="px-1">Nbr Retour</TableHead>
                      <TableHead>Achats</TableHead>
                      <TableHead>Retour</TableHead>
                      <TableHead>Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bonLivraison?.bons.map((element, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{element.fournisseur}</TableCell>
                        <TableCell>{element.NbrBL}</TableCell>
                        <TableCell>{element.NbrBLAchats} </TableCell>
                        <TableCell>{element.NbrBLRetour}</TableCell>
                        <TableCell>
                          {formatMontant(element.montantAchats)} DH
                        </TableCell>
                        <TableCell>
                          {formatMontant(element.montantRetour)} DH
                        </TableCell>
                        <TableCell>{formatMontant(element.total)} DH</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter className="bg-none">
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-right text-lg font-semibold p-2"
                      >
                        Total :
                      </TableCell>
                      <TableCell
                        colSpan={2}
                        className="text-left text-lg font-semibold p-2"
                      >
                        {formatMontant(bonLivraison?.total)} DH
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-t border-gray-200">
                      <TableCell
                        colSpan={6}
                        className="text-right text-lg font-semibold p-2"
                      >
                        Total Payé :
                      </TableCell>
                      <TableCell
                        colSpan={2}
                        className="text-left text-lg font-semibold p-2"
                      >
                        {formatMontant(bonLivraison?.totalPaye)} DH
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-t border-gray-200">
                      <TableCell
                        colSpan={6}
                        className="text-right text-lg font-semibold p-2"
                      >
                        Dette :
                      </TableCell>
                      <TableCell
                        colSpan={2}
                        className="text-left text-lg font-semibold p-2"
                      >
                        {formatMontant(bonLivraison?.rest)} DH
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
            </div>
          </div>
        </div>
        <div
          className="flex items-center justify-end print:hidden
print:hidden mt-5"
        >
          <Button
            className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
            variant="outline"
            onClick={handlePrint}
          >
            <Printer className="mr-2 h-4 w-4" /> Imprimer
          </Button>
        </div>
      </div>
    </>
  );
}
