"use client";

import { EnteteDevis } from "@/components/Entete-devis";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/functions";
import { Printer } from "lucide-react";

function formatDate(dateString) {
  return dateString?.split("T")[0].split("-").join("-");
}

export default function PreviewBonLivraisonDialog({
  bonLivraison,
  isOpen,
  onClose,
}) {
  const totalFournitureDevis = produits => {
    return produits?.reduce((acc, produit) => {
      return acc + produit.quantite * produit.prixUnite;
    }, 0);
  };

  const totalBL = group => {
    return group?.reduce((acc, order) => {
      return acc + totalFournitureDevis(order.produits);
    }, 0);
  };

  // Fonction pour grouper les produits par catégorie
  const groupProductsByCategory = produits => {
    if (!produits || produits.length === 0) return [];

    const grouped = produits.reduce((acc, product) => {
      const category = product.produit.categorieProduits?.categorie || "Sans catégorie";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {});

    return Object.entries(grouped).map(([category, products]) => ({
      category,
      products,
      total: products.reduce(
        (sum, product) => sum + product.prixUnite * product.quantite,
        0
      ),
    }));
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
                    Total du BL:
                  </h3>
                  <p className="font-semibold">
                    {formatCurrency(bonLivraison?.total)}
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-6">
                  {bonLivraison?.groups.map((group, index) => (
                    <div
                      key={group.id || index}
                      className="border print:bg-none rounded-xl shadow-sm "
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
                          <div>
                            {groupProductsByCategory(group.produits).map(
                              (categoryGroup, categoryIndex) => (
                                <div key={categoryIndex}>
                                  <Table>
                                    <TableBody>
                                      {categoryGroup.products.map(
                                        (product, productIndex) => (
                                          <TableRow
                                            key={product.id || productIndex}
                                            className="border-none"
                                          >
                                            <TableCell className="font-medium text-sm !py-1">
                                              {product.produit.designation}
                                            </TableCell>
                                            <TableCell className="text-right !py-1">
                                              {product.quantite} ×{" "}
                                              {product.prixUnite}
                                            </TableCell>
                                            <TableCell className="text-right !py-1">
                                              {formatCurrency(
                                                product.prixUnite *
                                                  product.quantite
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        )
                                      )}
                                    </TableBody>
                                    <div className="px-4 flex gap-3 ">
                                      <h3 className="p-2 text-right font-semibold text-lg text-purple-700">
                                        {categoryGroup.category} :
                                      </h3>
                                      <h3 className="p-2 text-right font-semibold text-lg text-purple-700">
                                        {formatCurrency(categoryGroup.total)}
                                      </h3>
                                    </div>
                                  </Table>
                                </div>
                              )
                            )}
                            <div className="px-4 pb-2 border-t">
                              <div className=" border-gray-300 pt-2">
                                <div className="flex justify-end">
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-gray-800">
                                      Total :{" "}
                                      {formatCurrency(
                                        totalFournitureDevis(group.produits)
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
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
