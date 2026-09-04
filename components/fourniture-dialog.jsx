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
import { formatCurrency, formatDate } from "@/lib/functions";
import { Printer } from "lucide-react";

function totalBlFourniture(produits) {
  return (
    produits?.reduce((acc, produit) => {
      return acc + (produit.quantite || 0) * (produit.prixUnite || 0);
    }, 0) ?? 0
  );
}

function totalFourniture(groups) {
  return (
    groups?.reduce((acc, item) => {
      const type = item?.bonLivraison?.type;
      if (type === "achats") return acc + totalBlFourniture(item.produits);
      if (type === "retour") return acc - totalBlFourniture(item.produits);
      return acc;
    }, 0) ?? 0
  );
}

function calculateMargePercent(devis, fourniture) {
  if (!devis?.total || !fourniture) return 0;
  return ((devis.total - fourniture) / devis.total) * 100;
}

export default function FournitureDialog({ devis, isOpen, onClose, bLGroups }) {
  const fournitureTotal = totalFourniture(bLGroups);
  const marge = (devis?.total || 0) - fournitureTotal;

  const handlePrint = () => {
    localStorage.setItem("devi", JSON.stringify(devis));
    localStorage.setItem("bLGroups", JSON.stringify(bLGroups));
    window.open("/ventes/devis/imprimerFournitures", "_blank");
  };

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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Client:</h3>
                  <div className="text-sm text-gray-600">
                    <p>
                      {devis?.client?.titre ? `${devis.client.titre}. ` : ""}
                      {devis?.client?.nom?.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div>
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
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-semibold text-gray-900">
                      Total de Devis :{" "}
                    </span>
                    {formatCurrency(devis?.total)}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">
                      Total de fournitures :{" "}
                    </span>
                    {formatCurrency(fournitureTotal)}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Marge : </span>
                    {formatCurrency(marge)} (
                    {calculateMargePercent(devis, fournitureTotal).toFixed(2)}%)
                  </p>
                </div>
              </div>

              {bLGroups?.length > 0 ? (
                <div className="space-y-4">
                  {bLGroups.map((groupe, index) => (
                    <div key={groupe.id || index}>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 font-semibold">
                          <span>
                            {formatDate(groupe?.bonLivraison?.date)}
                          </span>
                          <span>•</span>
                          <span>
                            {groupe?.bonLivraison?.fournisseur?.nom || "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-semibold">
                          <span>{groupe?.bonLivraison?.numero}</span>
                          <span>•</span>
                          <span>
                            {(groupe?.bonLivraison?.type || "").toUpperCase()}
                          </span>
                        </div>
                      </div>
                      {groupe.produits?.length > 0 && (
                        <div className="overflow-hidden rounded-md border border-black mt-0">
                          <Table className="w-full border-collapse">
                            <TableHeader className="text-[1rem]">
                              <TableRow>
                                <TableHead className="text-black font-bold text-left border-b border-black p-1 pl-3">
                                  #
                                </TableHead>
                                <TableHead className="text-black font-bold text-left border-b border-l border-black p-1">
                                  Produit
                                </TableHead>
                                <TableHead className="text-black font-bold text-center border-b border-l border-black p-1">
                                  Qté
                                </TableHead>
                                <TableHead className="text-black font-bold text-right border-b border-l border-black p-1">
                                  Prix unitaire
                                </TableHead>
                                <TableHead className="text-black font-bold text-right border-b border-l border-black p-1">
                                  Montant
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {groupe.produits.map((produit, i) => (
                                <TableRow key={produit.id || i}>
                                  <TableCell className="p-1 pl-3 text-left border-b border-black font-semibold">
                                    {i + 1}
                                  </TableCell>
                                  <TableCell className="p-1 text-left border-b border-l border-black font-semibold">
                                    {produit.produit?.designation}
                                  </TableCell>
                                  <TableCell className="p-1 text-center border-b border-l border-black">
                                    {produit.quantite}
                                  </TableCell>
                                  <TableCell className="p-1 pr-2 text-right border-b border-l border-black">
                                    {formatCurrency(produit.prixUnite)}
                                  </TableCell>
                                  <TableCell className="p-1 pr-2 text-right border-b border-l border-black font-bold">
                                    {formatCurrency(
                                      (produit.quantite || 0) *
                                        (produit.prixUnite || 0)
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                            <TableFooter className="font-medium">
                              <TableRow>
                                <TableCell
                                  colSpan={4}
                                  className="p-2 text-right text-lg font-extrabold border-black"
                                >
                                  Total :
                                </TableCell>
                                <TableCell className="border-l border-black p-2 text-left text-lg font-extrabold">
                                  {formatCurrency(
                                    totalBlFourniture(groupe.produits)
                                  )}
                                </TableCell>
                              </TableRow>
                            </TableFooter>
                          </Table>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="w-full border rounded-xl font-semibold text-center text-xl text-gray-900 p-4">
                    Total de fournitures : {formatCurrency(fournitureTotal)}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-10">
                  Aucun BL de fourniture trouvé
                </div>
              )}
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
          {bLGroups?.length > 0 && (
            <Button
              className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
              variant="outline"
              onClick={handlePrint}
            >
              <Printer className="mr-2 h-4 w-4" /> Imprimer
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
