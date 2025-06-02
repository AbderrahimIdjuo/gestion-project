"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Phone, Calendar } from "lucide-react";
import PiedDevis from "@/components/pied-devis";
import LoadingDeviPdf from "@/components/loading-devi-pdf";

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
export default function DevisPDFPage() {
  const [commande, setCommande] = useState();
  useEffect(() => {
    const storedData = localStorage.getItem("commandeFournitures");
    if (storedData) {
      setCommande(JSON.parse(storedData));
    }
    console.log("commandeFourniture", JSON.parse(storedData));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  function formatDate(dateString) {
    return dateString?.split("T")[0].split("-").reverse().join("-");
  }

  return (
    <>
      {commande ? (
        <div className="container mx-auto p-4 max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none mb-10">
          {/* Document Content */}
          <div id="print-area" className="space-y-3">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#228B8B] pb-1">
              <img src="/images/LOGO-tete.jpg" alt="Logo" width={300} />
              <img src="/images/LOGO-OUDAOUD.jpg" className="h-24 w-24" />
            </div>

            {/* Company and Client Info */}
            <div className="grid grid-cols-2 gap-8">
              {/* Devis Info */}
              <div className="col-span-1">
                <h1 className="font-bold text-lg text-gray-900">
                  Commande N° : {commande?.numero}
                </h1>
                {commande?.echeance && (
                  <div className="flex items-center gap-2 mt-2 ">
                    <Calendar className="h-3 w-3" />
                    <p className="font-medium text-sm">
                      <span>Écheance:</span> {formatDate(commande?.echeance)}{" "}
                    </p>
                  </div>
                )}
              </div>

              {/* Client Info */}
              <div className="col-span-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="font-bold text-lg text-gray-900">
                    Fournisseur :{" "}
                  </h2>
                  <p className="font-bold text-lg text-gray-900">
                    {commande?.fournisseur?.nom.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
            {/* Items Table */}
            <div className="overflow-hidden rounded-md border border-black mt-0">
              <Table className="w-full border-collapse print:w-full print:min-w-full">
                <TableHeader className="text-[1rem] border-black">
                  <TableRow>
                    <TableHead className="w-[90%] max-w-[90%] text-black font-bold text-center border-b border-black">
                      Désignation
                    </TableHead>
                    <TableHead className="text-black font-bold border-l border-b border-black text-center p-1">
                      Qté
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regrouperProduitsParQuantite(commande?.groups)?.map(
                    (articl) => (
                      <TableRow key={articl.id}>
                        <TableCell className=" p-1 text-left border-b border-black text-md font-semibold">
                          {articl.produit.designation}
                        </TableCell>
                        <TableCell className="border-l border-b border-black p-1 text-center">
                          {articl.quantite}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-2">
              <PiedDevis />
            </div>
          </div>
          <div className="print:hidden mt-8 flex justify-end">
            <Button
              onClick={handlePrint}
              className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 rounded-full hover:bg-purple-600 hover:scale-105 text-white font-semibold transition-all duration-300 transform"
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
          </div>
        </div>
      ) : (
        <LoadingDeviPdf />
      )}
    </>
  );
}
