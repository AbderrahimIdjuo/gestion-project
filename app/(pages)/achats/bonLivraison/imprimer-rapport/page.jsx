"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

function formatDate(dateString) {
  return dateString?.split("T")[0].split("-").reverse().join("-");
}
export default function DevisPDFPage() {
  const [bonLivraison, setBonLivraison] = useState();
  const [infosVisibilite, setInfosVisibilite] = useState(false);
  useEffect(() => {
    const storedData = localStorage.getItem("bonLivraison-rapport");
    if (storedData) {
      setBonLivraison(JSON.parse(storedData));
    }
  }, []);
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="container mx-auto p-8 max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        {/* Document Content */}
        <div id="print-area" className="space-y-6">
          {/* Header */}
          <EnteteDevis />

          <div className="flex justify-between gap-8"></div>
          <div className="space-y-6">
            <div className="rounded-xl border shadow-sm overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Montant Payé</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bonLivraison?.bons.map((bon) => (
                    <TableRow key={bon.id}>
                      <TableCell>{formatDate(bon.date)}</TableCell>
                      <TableCell>{bon.reference}</TableCell>
                      <TableCell>{bon.fournisseur?.nom ?? "-"}</TableCell>
                      <TableCell>{bon.type}</TableCell>
                      <TableCell>{bon.total?.toFixed(2)} DH</TableCell>
                      <TableCell>{bon.totalPaye?.toFixed(2)} DH</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="bg-none">
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-right text-lg font-semibold p-2"
                    >
                      Total :
                    </TableCell>
                    <TableCell
                      colSpan={2}
                      className="text-left text-lg font-semibold p-2"
                    >
                      {bonLivraison?.total} DH
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-t border-gray-200">
                    <TableCell
                      colSpan={4}
                      className="text-right text-lg font-semibold p-2"
                    >
                      Total Payé :
                    </TableCell>
                    <TableCell
                      colSpan={2}
                      className="text-left text-lg font-semibold p-2"
                    >
                      {bonLivraison?.totalPaye} DH
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-t border-gray-200">
                    <TableCell
                      colSpan={4}
                      className="text-right text-lg font-semibold p-2"
                    >
                      Dette :
                    </TableCell>
                    <TableCell
                      colSpan={2}
                      className="text-left text-lg font-semibold p-2"
                    >
                      {bonLivraison?.rest} DH
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        </div>
        <div
          className="flex items-center justify-end print:hidden
print:hidden mt-5"
        >
          {/* <div className="flex items-center space-x-2 ">
            <Switch
              id="switch"
              checked={infosVisibilite}
              onCheckedChange={setInfosVisibilite}
            />
            <Label htmlFor="switch">
              {infosVisibilite
                ? "Informations de la société visibles"
                : "Les informations de la société sont masquées"}
            </Label>
          </div> */}
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
