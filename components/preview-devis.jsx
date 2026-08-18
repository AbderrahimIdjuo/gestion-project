"use client";

import { EnteteDevis } from "@/components/Entete-devis";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer } from "lucide-react";

function formatDate(dateString) {
  return dateString?.split("T")[0].split("-").reverse().join("-");
}

export default function PreviewDevisDialog({ devis, isOpen, onClose }) {
  const hasHeight = !!devis?.articls?.some(a => {
    const h = a?.height;
    return (
      h !== undefined &&
      h !== null &&
      String(h).trim() !== "" &&
      Number(h) !== 0
    );
  });

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose?.()}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col overflow-hidden print:shadow-none print:max-h-none print:overflow-visible">
        <DialogHeader className="shrink-0">
          <DialogTitle></DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto print:overflow-visible">
          <div className="container mx-auto px-4 py-2 max-w-6xl bg-white print:p-0 print:max-w-none">
            <div id="print-area" className="space-y-3">
              <EnteteDevis />

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Devis N° : {devis?.numero}
                  </h3>
                  <div className="text-sm text-gray-600">
                    <p>
                      Date :{" "}
                      {formatDate(devis?.date) || formatDate(devis?.createdAt)}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Client:</h3>
                  <div className="text-sm text-gray-600">
                    <p>
                      {devis?.client?.titre && devis?.client.titre + ". "}
                      {devis?.client?.nom?.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-md border border-black mt-0">
                <Table className="w-full border-collapse">
                  <TableHeader className="text-[1rem] border-black">
                    <TableRow>
                      <TableHead
                        rowSpan="2"
                        className="w-[40%] max-w-[45%] text-black font-bold text-center border-b border-black"
                      >
                        Désignation
                      </TableHead>
                      <TableHead
                        colSpan={hasHeight ? 3 : 2}
                        className="text-black font-bold border-l border-b border-black text-center p-1"
                      >
                        Dimension
                      </TableHead>
                      <TableHead
                        rowSpan="2"
                        className="text-black font-bold border-l border-b border-black text-center p-1"
                      >
                        U
                      </TableHead>
                      <TableHead
                        rowSpan="2"
                        className="text-black font-bold border-l border-b border-black text-center p-1"
                      >
                        Qté
                      </TableHead>
                      <TableHead
                        rowSpan="2"
                        className="text-black font-bold border-l border-b border-black p-2 text-center"
                      >
                        P.U/m²
                      </TableHead>
                      <TableHead
                        rowSpan="2"
                        className="text-black font-bold border-l border-b border-black p-2 text-center"
                      >
                        Montant
                      </TableHead>
                    </TableRow>
                    <TableRow>
                      {hasHeight && (
                        <TableHead className="text-black font-semibold text-center border-b border-l border-black p-1">
                          Hauteur
                        </TableHead>
                      )}
                      <TableHead className="text-black font-semibold text-center border-b border-l border-black p-1">
                        Longueur
                      </TableHead>
                      <TableHead className="text-black font-semibold border-l border-b border-black text-center p-1">
                        Largeur
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devis?.articls?.map(articl => (
                      <TableRow key={articl.id}>
                        <TableCell className="p-1 text-left border-b border-black text-md font-semibold">
                          {articl.designation}{" "}
                        </TableCell>
                        {hasHeight && (
                          <TableCell className="border-l border-b border-black p-1 text-center">
                            {!articl.height ? "-" : articl.height}
                          </TableCell>
                        )}
                        <TableCell className="border-l border-b border-black p-1 text-center">
                          {!articl.length ? "-" : articl.length}
                        </TableCell>
                        <TableCell className="border-l border-b border-black p-1 text-center">
                          {!articl.width ? "-" : articl.width}
                        </TableCell>
                        <TableCell className="border-l border-b border-black p-1 text-center">
                          {articl.unite}
                        </TableCell>
                        <TableCell className="border-l border-b border-black p-1 text-center">
                          {articl.quantite}
                        </TableCell>
                        <TableCell className="border-l border-b border-black p-1 text-center">
                          {articl.prixUnite} DH
                        </TableCell>
                        <TableCell className="border-l border-b border-black p-1 text-center font-bold">
                          {articl.montant} DH
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter className="font-medium border-black">
                    <TableRow>
                      <TableCell
                        colSpan={hasHeight ? 6 : 5}
                        className="border-black p-2 text-right text-lg font-extrabold"
                      >
                        Total H.T :
                      </TableCell>
                      <TableCell
                        colSpan={2}
                        className="border-l border-black p-2 text-left text-lg font-extrabold"
                      >
                        {Number(devis?.sousTotal || 0).toFixed(2)} DH
                      </TableCell>
                    </TableRow>
                    {devis?.reduction > 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={hasHeight ? 6 : 5}
                          className="border-t border-black p-2 text-right font-bold"
                        >
                          Réduction :
                        </TableCell>
                        <TableCell
                          colSpan={2}
                          className="border-l border-t border-black p-2 text-left font-bold"
                        >
                          {devis?.reduction} {devis?.typeReduction}
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {devis?.tva > 0 ? (
                      <>
                        <TableRow>
                          <TableCell
                            colSpan={hasHeight ? 6 : 5}
                            className="border-t border-black p-2 text-right font-bold"
                          >
                            TVA :
                          </TableCell>
                          <TableCell
                            colSpan={2}
                            className="border-l border-t border-black p-2 text-left font-bold"
                          >
                            {Number(devis?.tva || 0).toFixed(2)} DH
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell
                            colSpan={hasHeight ? 6 : 5}
                            className="text-lg border-t border-black text-gray-900 p-2 text-right font-extrabold"
                          >
                            Total TTC :
                          </TableCell>
                          <TableCell
                            colSpan={2}
                            className="border-l border-t border-black p-2 text-lg text-gray-900 text-left font-extrabold"
                          >
                            {Number(devis?.total || 0).toFixed(2)} DH
                          </TableCell>
                        </TableRow>
                      </>
                    ) : null}
                  </TableFooter>
                </Table>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 shrink-0 print:hidden">
          <Button
            className="rounded-full"
            variant="outline"
            onClick={() => onClose?.()}
          >
            Fermer
          </Button>
          <Button
            className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
            variant="outline"
            onClick={() => {
              localStorage.setItem("devi", JSON.stringify(devis));
              window.open(`/ventes/devis/${devis.id}/pdf`, "_blank");
            }}
          >
            <Printer className="mr-2 h-4 w-4" /> Imprimer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
