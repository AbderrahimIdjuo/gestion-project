"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
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
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";

function formatDate(dateString) {
  return dateString?.split("T")[0].split("-").reverse().join("-");
}
export default function PreviewBonLivraisonDialog({
  bonLivraison,
  isOpen,
  onClose,
}) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none print:overflow-visible">
          <DialogHeader>
            <DialogTitle></DialogTitle>
          </DialogHeader>
          <div className="container mx-auto p-8 max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none mb-10">
            {/* Document Content */}
            <div id="print-area" className="space-y-6 print:mt-10">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-[#228B8B] pb-1">
                <img src="/images/LOGO-tete.jpg" alt="Logo" width={300} />
                <img src="/images/LOGO-OUDAOUD.jpg" className="h-24 w-24" />
              </div>

              <div className="flex justify-between gap-8">
                {/* BL Info */}
                <div className="space-y-1 col-span-1">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Date
                  </h3>
                  <p className="font-semibold">
                    {formatDate(bonLivraison?.date)}
                  </p>
                </div>
                <div className="col-span-1">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Numéro
                  </h3>
                  <p className="font-semibold">{bonLivraison?.numero}</p>
                </div>

                <div className="space-y-1 col-span-1">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Référence
                  </h3>
                  <p className="font-semibold">{bonLivraison?.reference}</p>
                </div>
                <div className="space-y-1 col-span-1">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Fournisseur
                  </h3>
                  <p className="font-semibold">{bonLivraison?.fournisseur}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="border rounded-lg">
                  {bonLivraison?.produits &&
                  bonLivraison?.produits.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produit</TableHead>
                          <TableHead className="text-center !py-2">
                            Qté
                          </TableHead>
                          <TableHead className="text-center !py-2">
                            Prix
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bonLivraison?.produits.map((product, productIndex) => (
                          <TableRow key={product.id || productIndex}>
                            <TableCell className=" font-semibold !py-2">
                              {product.produit.designation}
                            </TableCell>
                            <TableCell className="text-center !py-2">
                              {product.quantite}
                            </TableCell>
                            <TableCell className="text-center !py-2">
                              {product.prixUnite} DH
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter className="font-medium ">
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className=" p-4 text-right px-1 font-bold  text-xl"
                          >
                            Total :
                          </TableCell>
                          <TableCell
                            colSpan={2}
                            className=" border-zinc-500  px-1 text-left font-bold text-xl "
                          >
                            {bonLivraison?.total} DH
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      aucun produit ajouter
                    </p>
                  )}
                </div>

                {bonLivraison?.produits.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    aucun produit trouvé
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 print:hidden">
            <Button
              className="rounded-full"
              variant="outline"
              onClick={() => onClose()}
            >
              Fermer
            </Button>
            <Button
              className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
              variant="outline"
              onClick={() => {
                handlePrint();
              }}
            >
              <Printer className="mr-2 h-4 w-4" /> Imprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
