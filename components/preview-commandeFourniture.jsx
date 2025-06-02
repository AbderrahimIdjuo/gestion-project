"use client";

import { useState } from "react";
import { Printer, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
} from "@/components/ui/table";
import CustomTooltip from "@/components/customUi/customTooltip";
function formatDate(dateString) {
  return dateString?.split("T")[0].split("-").reverse().join("-");
}
export default function PreviewCommandeFournitureDialog({ commande }) {
  const [open, setOpen] = useState(false);

  // Extract order data
  const { echeance, fournisseur, groups, numero } = commande;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <CustomTooltip message="Visualiser">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className="h-8 w-8 rounded-full hover:bg-blue-100 hover:text-blue-600"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </CustomTooltip>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none print:overflow-visible">
          <DialogHeader>
            <DialogTitle></DialogTitle>
          </DialogHeader>
          {/* <div className="container mx-auto max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none ">
            <div id="print-area" className="print:mt-10">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div className="space-y-1">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Fournisseur
                  </h3>
                  <p className="font-semibold">{fournisseur?.nom}</p>
                </div>
                <div className="space-y-1 text-right">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Commande numéro
                  </h3>
                  <p className="font-semibold">{numero}</p>
                </div>
              </div>

              <div className="space-y-6">
                {groups?.map((group, index) => (
                  <Card
                    key={group.id || index}
                    className="border print:bg-none"
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-center">
                        {group.devisNumero ? (
                          <>
                            <div className="space-y-1">
                              <h3 className="font-medium text-sm text-muted-foreground">
                                Numéro de la commande client :
                              </h3>
                              <p className="font-semibold">
                                {group.devisNumero}
                              </p>
                            </div>
                            <div className="space-y-1 text-left">
                              <h3 className="font-medium text-sm text-muted-foreground">
                                Client
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
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      {group.produits && group.produits.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produit</TableHead>
                              <TableHead className="text-center">
                                Quantité
                              </TableHead>
                              <TableHead className="text-center">
                                Prix
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.produits.map((product, productIndex) => (
                              <TableRow key={product.id || productIndex}>
                                <TableCell>
                                  {product.produit.designation}
                                </TableCell>
                                <TableCell className="text-center">
                                  {product.quantite}
                                </TableCell>
                                <TableCell className="text-center">
                                  {product.produit.prixAchat} DH
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          aucun produit ajouter
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {groups.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    aucun produit trouvé
                  </div>
                )}
              </div>
            </div>
          </div> */}
          <div className="container mx-auto p-8 max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none mb-10">
            {/* Document Content */}
            <div id="print-area" className="space-y-6 print:mt-10">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-[#228B8B] pb-1">
                <img src="/images/LOGO-tete.jpg" alt="Logo" width={300} />
                <img src="/images/LOGO-OUDAOUD.jpg" className="h-24 w-24" />
              </div>
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
                            <div className="space-y-1">
                              <h3 className="font-medium text-sm text-muted-foreground">
                                Devis numéro :
                              </h3>
                              <p className="font-semibold">
                                {group.devisNumero}
                              </p>
                            </div>
                            <div className="space-y-1 text-left">
                              <h3 className="font-medium text-sm text-muted-foreground">
                                Client
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
                                  {product.produit.prixAchat} DH
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          aucun produit ajouter
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {groups.length === 0 && (
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
              onClick={() => setOpen(false)}
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
