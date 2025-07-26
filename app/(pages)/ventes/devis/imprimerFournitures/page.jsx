"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EnteteDevis } from "@/components/Entete-devis";

function formatDate(dateString) {
  return dateString.split("T")[0].split("-").reverse().join("-");
}

export default function DevisPDFPage() {
  const [devis, setDevis] = useState();
  const [bLGroups, setBLGroups] = useState();
  const [infosVisibilite, setInfosVisibilite] = useState(false);

  useEffect(() => {
    const storedDevis = localStorage.getItem("devi");
    const storedBLGroups = localStorage.getItem("bLGroups");
    if (storedDevis) {
      setDevis(JSON.parse(storedDevis));
    }
    if (storedBLGroups) {
      setBLGroups(JSON.parse(storedBLGroups));
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const totalCommandeFourniture = (produits) => {
    return produits?.reduce((acc, produit) => {
      return acc + produit.quantite * produit.prixUnite;
    }, 0);
  };
  const totalFourniture = (group) => {
    return group?.reduce((acc, order) => {
      return acc + totalCommandeFourniture(order.produits);
    }, 0);
  };
  return (
    <>
      {devis && (
        <>
          <div className="container mx-auto px-8 pt-2 max-w-4xl bg-white print:min-h-screen print:p-0 print:max-w-none pb-10">
            {/* Document Content */}
            <div id="print-area" className="space-y-6 ">
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
                    </div>
                  </div>
                  <div className="grid grid-rows-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Client:
                      </h3>
                      <div className="text-sm text-gray-600">
                        <p>
                          {devis?.client.titre && devis?.client.titre + ". "}
                          {devis?.client.nom.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Devis N° : {devis?.numero}
                      </h3>
                      <div className="text-sm text-gray-600">
                        <p>Date : {formatDate(devis?.createdAt)} </p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Total de fournitures :
                      </h3>
                      <div className="text-sm text-gray-600">
                        <p>{totalFourniture(bLGroups)} DH</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between  gap-4">
                  <div className="col-span-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Devis N° : {devis?.numero}
                    </h3>
                    <div className="text-sm text-gray-600">
                      <p>Date : {formatDate(devis?.createdAt)} </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Total de fournitures :
                    </h3>
                    <div className="text-sm text-gray-600">
                      <p>{totalFourniture(bLGroups)} DH</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Client:
                    </h3>
                    <div className="text-sm text-gray-600">
                      <p>
                        {devis?.client.titre && devis?.client.titre + ". "}
                        {devis?.client.nom.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {bLGroups?.length > 0 ? (
                <div className="space-y-2">
                  {bLGroups?.map((groupe, index) => (
                    <div key={groupe.id || index} className=" print:bg-non">
                      <div className="flex justify-between gap-8 mb-1">
                        {/* commande Info */}

                        <div>
                          <p className="font-semibold">
                            {groupe?.bonLivraison?.fournisseur.nom}
                          </p>
                        </div>
                        <div>
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
                                  className=" p-1 text-right text-lg font-bold"
                                >
                                  Total :
                                </TableCell>
                                <TableCell className=" border-zinc-500 text-lg  p-1 text-left font-bold">
                                  {totalCommandeFourniture(groupe.produits)} DH
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

              {/* {listProduits.length > 0 && (
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
                      {listProduits.map((produit, index) => (
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
                          className=" p-1 text-right text-lg font-bold"
                        >
                          Total :
                        </TableCell>
                        <TableCell className=" border-zinc-500 text-lg  p-1 text-left font-bold">
                          {totalCommandeFourniture(listProduits)} DH
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              )} */}
            </div>
            <div>
              <h3 className=" w-full border rounded-xl font-semibold text-end text-xl text-gray-900 mb-2 p-4 my-2">
                Total de fournitures : {totalFourniture(bLGroups)} DH
              </h3>
            </div>
            <div
              className="flex items-center justify-between print:hidden
    print:hidden my-5"
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
        </>
      )}
    </>
  );
}
