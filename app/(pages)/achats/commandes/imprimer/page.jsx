"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EnteteDevis } from "@/components/Entete-devis";

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
  const [infosVisibilite, setInfosVisibilite] = useState(false);
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
      {commande && (
        <div className="container mx-auto p-4 max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none mb-10">
          {/* Document Content */}
          <div id="print-area" className="space-y-3">
            {/* Header */}
            <EnteteDevis />

            {/* Company and Client Info */}

            {infosVisibilite ? (
              <div className="flex justify-between px-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    STE OUDAOUDOX SARL
                  </h3>
                  <div className="text-sm text-gray-600">
                    <p>Avenue Jaber Ben Hayane</p>
                    <p>Bloc A N°01 Hay El Houda • Agadir</p>
                    <p>Gsm : 06 61 58 53 08 • 06 63 63 72 44</p>
                    <p>E-mail : inoxoudaoud@gmail.com</p>
                    <p>RC : 53805 • TP : 67504461</p>
                    <p>IF : 53290482 • ICE : 003172063000061</p>
                  </div>
                </div>
                <div className="grid grid-rows-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Fournisseur :
                    </h3>
                    <div className="text-sm text-gray-600">
                      <p>{commande?.fournisseur?.nom.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      commande N° : {commande?.numero}
                    </h3>
                    <div className="text-sm text-gray-600">
                      <p>Date : {formatDate(commande?.createdAt)} </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2  gap-4">
                <div className="col-span-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    commande N° : {commande?.numero}
                  </h3>
                  {commande?.echeance && (
                    <div className="text-sm text-gray-600">
                      <p>Écheance: : {formatDate(commande?.echeance)} </p>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Fournisseur :
                  </h3>
                  <div className="text-sm text-gray-600">
                    <p>{commande?.fournisseur?.nom.toUpperCase()}</p>
                  </div>
                </div>
              </div>
            )}

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
                        <TableCell className=" p-1 text-left border-t border-black text-md font-semibold">
                          {articl.produit.designation}
                        </TableCell>
                        <TableCell className="border-l border-t border-black p-1 text-center">
                          {articl.quantite}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <div
            className="flex items-center justify-between print:hidden
print:hidden mt-5"
          >
            <div className="flex items-center space-x-2 ">
              <Switch
                id="switch"
                checked={infosVisibilite}
                onCheckedChange={setInfosVisibilite}
              />
              <Label htmlFor="switch">
                {infosVisibilite
                  ? "Informations de la société visibles"
                  : "Les informations de la société sont masquées"}
              </Label>
            </div>
            <Button
              className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
              variant="outline"
              onClick={handlePrint}
            >
              <Printer className="mr-2 h-4 w-4" /> Imprimer
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
