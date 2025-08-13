"use client";

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
import { EnteteDevis } from "@/components/Entete-devis";
import { formatCurrency} from "@/lib/functions";


export default function FournitureDialog({
  devis,
  isOpen,
  onClose,
  orderGroups,
}) {
  const handlePrint = () => {
    window.print();
  };
  const totalBlFourniture = (produits) => {
    return produits?.reduce((acc, produit) => {
      return acc + produit.quantite * produit.prixUnite;
    }, 0);
  };
  const totalFourniture = (group) => {
    return group?.reduce((acc, order) => {
      return acc + totalBlFourniture(order.produits);
    }, 0);
  };
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none print:overflow-visible">
          <DialogHeader>
            <DialogTitle></DialogTitle>
          </DialogHeader>
          <div className="container mx-auto p-8 max-w-4xl bg-white print:min-h-screen print:p-0 print:max-w-none mb-10">
            {/* Document Content */}
            <div id="print-area" className="space-y-6 print:mt-10">
              {/* Header */}
              <EnteteDevis />
              {/* Company and Client Info */}
              <div className="flex justify-between gap-8 mb-4">
                <div className="space-y-1 col-span-1">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Devis N° :
                  </h3>
                  <p className="font-semibold">{devis.numero} </p>
                </div>
                <div className="space-y-1 col-span-1">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Client :
                  </h3>
                  <p className="font-semibold">{devis.client.nom} </p>
                </div>
                {orderGroups?.length > 0 && (
                  <div className="space-y-1 col-span-1">
                    <h3 className="font-medium text-sm text-muted-foreground">
                      Total :
                    </h3>
                    <p className="font-semibold">
                      {totalFourniture(orderGroups)} DH
                    </p>
                  </div>
                )}
              </div>
              {orderGroups?.length > 0 ? (
                <div className="space-y-6">
                  {orderGroups?.map((groupe, index) => (
                    <div
                      key={groupe.id || index}
                      className="border border-zinc-300 print:bg-none rounded-xl shadow-sm p-4"
                    >
                      <div className="flex justify-between gap-8 mb-4">
                        {/* commande Info */}

                        <div className="space-y-1 col-span-1">
                          <h3 className="font-medium text-sm text-muted-foreground">
                            Fournisseur
                          </h3>
                          <p className="font-semibold">
                            {" "}
                            {groupe?.bonLivraison?.fournisseur.nom}
                          </p>
                        </div>
                        <div className="col-span-1">
                          <h3 className="font-medium text-sm text-muted-foreground">
                            bon de livraison N°
                          </h3>
                          <p className="font-semibold">
                            {groupe?.bonLivraison?.numero}
                          </p>
                        </div>
                      </div>
                      {groupe.produits.length > 0 && (
                        <div className="overflow-hidden rounded-md border border-zinc-500 mt-0">
                          <Table className="w-full border-collapse">
                            <TableHeader className="text-[1rem] border-none">
                              <TableRow className="!py-0">
                                <TableHead className="text-sm  border-b border-zinc-500 text-black font-medium text-left !py-0">
                                  #
                                </TableHead>
                                <TableHead className="text-sm  border-b border-zinc-500 text-black font-medium text-left !py-0">
                                  Produit
                                </TableHead>
                                <TableHead className="text-sm  border-b border-zinc-500 text-black font-medium  text-center !py-0">
                                  Qté
                                </TableHead>
                                <TableHead className="text-sm  border-b border-zinc-500 text-black font-medium  text-center !py-0">
                                  Prix unitaire
                                </TableHead>
                                <TableHead className="text-sm  border-b border-zinc-500 text-black font-medium  text-center !py-0">
                                  Montant
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {groupe.produits.map((produit, index) => (
                                <TableRow
                                  key={produit.id || index}
                                  className="border-none"
                                >
                                  <TableCell className="p-1 text-left  border-t border-zinc-500 text-md font-semibold pl-4">
                                    {index + 1}
                                  </TableCell>
                                  <TableCell className="p-1 text-left  border-t border-zinc-500 text-md font-semibold p-0">
                                    {produit.produit.designation}
                                  </TableCell>
                                  <TableCell className=" p-1  border-t border-zinc-500 text-center p-0">
                                    {produit.quantite}
                                  </TableCell>
                                  <TableCell className="  border-t border-zinc-500  p-1 text-center p-0">
                                    {produit.prixUnite} DH{" "}
                                  </TableCell>
                                  <TableCell className="  border-t border-zinc-500  p-1 text-center p-0">
                                    {produit.quantite * produit.prixUnite} DH{" "}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                            <TableFooter className="font-medium border-zinc-500  ">
                              <TableRow>
                                <TableCell
                                  colSpan={4}
                                  className=" p-2 text-right font-bold"
                                >
                                  sousTotal :
                                </TableCell>
                                <TableCell className=" border-zinc-500  p-2 text-left font-bold">
                                  {formatCurrency(totalBlFourniture(groupe.produits))} DH
                                </TableCell>
                              </TableRow>
                            </TableFooter>
                          </Table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 mt-6">
                  aucune commande trouvé
                </div>
              )}
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
