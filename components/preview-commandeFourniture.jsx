"use client";

import { useState } from "react";
import { Printer, Eye } from "lucide-react";
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
import CustomTooltip from "@/components/customUi/customTooltip";
import { EnteteDevis } from "@/components/Entete-devis";

function formatDate(dateString) {
  return dateString?.split("T")[0].split("-").reverse().join("-");
}
export default function PreviewCommandeFournitureDialog({
  commande,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? onOpenChange : setUncontrolledOpen;

  if (!commande || typeof commande !== "object") return null;

  // Extract order data
  const { echeance, fournisseur, groups, numero } = commande;

  function calculerTotalProduits(produits) {
    return produits.reduce((total, produit) => {
      return total + produit.quantite * produit.prixUnite;
    }, 0);
  }

  return (
    <>
      {!hideTrigger && (
        <CustomTooltip message="Aperçu">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            className="h-8 w-8 rounded-full hover:bg-blue-100 hover:text-blue-600"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </CustomTooltip>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col overflow-hidden print:shadow-none print:max-h-none print:overflow-visible">
          <DialogHeader className="shrink-0">
            <DialogTitle></DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto print:overflow-visible">
          <div className="container mx-auto px-4 py-2 max-w-6xl bg-white print:p-0 print:max-w-none">
            {/* Document Content */}
            <div id="print-area" className="space-y-6 print:mt-10">
              {/* Header */}
              <EnteteDevis />
              {/* Company and Client Info */}
              <div className="flex justify-between gap-8">
                {/* commande Info */}
                <div className="space-y-1 col-span-1">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Fournisseur
                  </h3>
                  <p className="font-semibold">{fournisseur?.nom}</p>
                </div>
                {echeance && (
                  <div className="space-y-1 col-span-1">
                    <h3 className="font-medium text-sm text-muted-foreground">
                      Écheance
                    </h3>
                    <p className="font-semibold">{formatDate(echeance)}</p>
                  </div>
                )}
                <div className="col-span-1">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Commande fournitures N°
                  </h3>
                  <p className="font-semibold">{numero}</p>
                </div>
              </div>
              <div className="space-y-6">
                {groups?.map((group, index) => (
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
                          <p className="font-semibold">Atelier</p>
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
                          <TableFooter className="bg-none">
                            <TableRow>
                              <TableCell
                                className="font-bold text-right text-lg"
                                colSpan={2}
                              >
                                Total :
                              </TableCell>
                              <TableCell className="text-left font-bold text-lg">
                                {calculerTotalProduits(group.produits)} DH
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

                {(!groups || groups.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    aucun produit trouvé
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 shrink-0 print:hidden">
            <Button
              className="rounded-full"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Fermer
            </Button>
            <Button
              className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
              variant="outline"
              onClick={() => {
                localStorage.setItem(
                  "commandeFournitures",
                  JSON.stringify(commande)
                );
                window.open(`/achats/commandes/imprimer`, "_blank");
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
