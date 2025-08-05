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

function formatDate(dateString) {
  return dateString?.split("T")[0].split("-").join("-");
}
export default function PreviewBonLivraisonDialog({
  bonLivraison,
  isOpen,
  onClose,
}) {
  const totalFournitureDevis = (produits) => {
    return produits?.reduce((acc, produit) => {
      return acc + produit.quantite * produit.prixUnite;
    }, 0);
  };
  const totalBL = (group) => {
    return group?.reduce((acc, order) => {
      return acc + totalFournitureDevis(order.produits);
    }, 0);
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
              <EnteteDevis />

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
                <div className="space-y-1 col-span-1">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Total :
                  </h3>
                  <p className="font-semibold">
                    {totalBL(bonLivraison?.groups)} DH
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-6">
                  {bonLivraison?.groups.map((group, index) => (
                    <div
                      key={group.id || index}
                      className="border print:bg-none rounded-xl shadow-sm"
                    >
                      <div className="p-4 pb-2 border-b">
                        <div className="flex justify-between items-center">
                          {group.devisNumero ? (
                            <>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-sm text-muted-foreground">
                                  Devis numéro :
                                </h3>
                                <p className="font-semibold">
                                  {group.devisNumero}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-sm text-muted-foreground">
                                  Client :
                                </h3>
                                <p className="font-semibold">
                                  {group.clientName}
                                </p>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-1">
                              <h3 className="font-medium text-sm text-muted-foreground">
                                Charge :
                              </h3>
                              <p className="font-semibold">
                                {group.charge || "Non spécifié"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        {group.produits && group.produits.length > 0 ? (
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
                              {group.produits.map((product, productIndex) => (
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
                            <TableFooter className="font-medium bg-none">
                              <TableRow>
                                <TableCell
                                  colSpan={2}
                                  className=" p-2 text-right font-bold text-lg"
                                >
                                  Total :
                                </TableCell>
                                <TableCell className="p-2 text-left font-bold text-lg">
                                  {totalFournitureDevis(group.produits)} DH
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
                    </div>
                  ))}

                  {bonLivraison?.groups.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      aucun produit trouvé
                    </div>
                  )}
                </div>
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
                window.open(`/achats/bonLivraison/imprimer`, "_blank");
                localStorage.setItem(
                  "bonLivraison",
                  JSON.stringify(bonLivraison)
                );
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
