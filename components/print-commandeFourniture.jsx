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
import CustomTooltip from "@/components/customUi/customTooltip";

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

  // Extract order data
  const { fournisseur, groups, numero } = commande;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <CustomTooltip message="Imprimer">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className="h-8 w-8 rounded-full hover:bg-green-100 hover:text-green-600"
        >
          <PrinterIcon className="h-4 w-4" />
        </Button>
      </CustomTooltip>
      <Dialog open={open} onOpenChange={setOpen}>
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
              {/* Company and Client Info */}
              <div className="grid grid-cols-3 gap-8">
                {/* commande Info */}
                <div className="space-y-1 col-span-2">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Fournisseur
                  </h3>
                  <p className="font-semibold">{fournisseur?.nom}</p>
                </div>
                <div className="col-span-1">
                       <h3 className="font-medium text-sm text-muted-foreground">
                    Numéro de la commande
                  </h3>
                  <p className="font-semibold">{numero}</p>
                </div>
              </div>
              {/* Items Table */}
              <div className="overflow-hidden rounded-lg border border-black">
                <Table className="w-full border-collapse">
                  <TableHeader className="text-[1rem] border-black">
                    <TableRow>
                      <TableHead className="text-black font-bold text-center border-b border-black w-[90%]">Produit</TableHead>
                      <TableHead className="text-black font-bold border-l border-b border-black text-center ">Qté</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {regrouperProduitsParQuantite(groups)?.map(
                      (produit, index) => (
                        <TableRow key={produit.id || index}>
                          <TableCell className=" p-1 text-left  border-black text-md font-semibold">{produit.produit.designation}</TableCell>
                          <TableCell className="border-l  border-black p-2 text-center">
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
