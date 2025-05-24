"use client";

import { useState, useEffect } from "react";
import { Printer, PrinterIcon } from "lucide-react";

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

function regrouperProduitsParQuantite(groups) {
  const produitMap = new Map();

  for (const group of groups) {
    for (const item of group.produits) {
      const id = item.produitId;

      if (produitMap.has(id)) {
        // Ajouter la quantité à l'existant
        produitMap.get(id).quantite += item.quantite;
      } else {
        // Cloner l'objet produit pour éviter les effets de bord
        produitMap.set(id, {
          ...item,
          quantite: item.quantite,
        });
      }
    }
  }

  // Retourner une liste de produits avec les quantités cumulées
  return Array.from(produitMap.values());
}

export default function PrintCommandeFournitureDialog({ commande }) {
  const [open, setOpen] = useState(false);
  const [print, setPrint] = useState(false);

  // Extract order data
  const { fournisseur, groups, numero } = commande;
  console.log("groups", groups);
  console.log("listProduits : ", regrouperProduitsParQuantite(groups));
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-8 w-8 rounded-full hover:bg-green-100 hover:text-green-600"
      >
        <PrinterIcon className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none print:overflow-visible">
          <DialogHeader>
            <DialogTitle></DialogTitle>
          </DialogHeader>
          <div className="container mx-auto max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none ">
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
                  <p className="font-semibold">{commande?.numero}</p>
                </div>
              </div>

              <div className="space-y-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead className="text-center">Quantité</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {regrouperProduitsParQuantite(groups)?.map(
                      (produit, index) => (
                        <TableRow key={produit.id || index}>
                          <TableCell>{produit.produit.designation}</TableCell>
                          <TableCell className="text-center">
                            {produit.quantite}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-6 print:hidden">
            <Button
              className="rounded-full hover:bg-emerald-400 hover:text-green-900 "
              variant="outline"
              onClick={() => {
                handlePrint();
              }}
            >
              <Printer className="mr-2 h-4 w-4" /> Imprimer
            </Button>
            <Button
              className="rounded-full hover:bg-red-400 hover:text-red-900 !border-red"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
