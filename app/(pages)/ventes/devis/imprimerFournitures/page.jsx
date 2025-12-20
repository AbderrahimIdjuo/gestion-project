"use client";

import { EnteteDevis } from "@/components/Entete-devis";
import { Label } from "@/components/ui/label";
import { DirectPrintButton } from "@/components/ui/print-button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/functions";
import { useEffect, useState } from "react";

export default function DevisPDFPage() {
  const [devis, setDevis] = useState();
  const [bLGroups, setBLGroups] = useState();
  const [infosVisibilite, setInfosVisibilite] = useState(false);

  useEffect(() => {
    const storedDevis = localStorage.getItem("devi");
    const storedBLGroups = localStorage.getItem("bLGroups");
    if (storedDevis) {
      setDevis(JSON.parse(storedDevis));
      console.log("Devis:", JSON.parse(storedDevis));
    }
    if (storedBLGroups) {
      setBLGroups(JSON.parse(storedBLGroups));
      console.log("BLGroups:", JSON.parse(storedBLGroups));
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const totalFourniture = group => {
    return group?.reduce((acc, item) => {
      const type = item?.bonLivraison?.type;

      if (type === "achats") {
        return acc + totalBlFourniture(item.produits);
      } else if (type === "retour") {
        return acc - totalBlFourniture(item.produits);
      }

      return acc; // si type inconnu
    }, 0);
  };

  const totalBlFourniture = produits => {
    return produits?.reduce((acc, produit) => {
      return acc + produit.quantite * produit.prixUnite;
    }, 0);
  };

  const calculateMargePercent = (devis, totalFourniture) => {
    if (
      totalFourniture === null ||
      totalFourniture === undefined ||
      devis?.total === 0 ||
      totalFourniture === 0
    ) {
      return 0;
    }
    const marge = devis?.total - totalFourniture;
    const percent = (marge / devis?.total) * 100;
    return percent;
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
                <div className="grid grid-flow-col auto-cols-max justify-between">
                  <div id="1st-col">
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

                  <div id="2nd-col" className="flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Client:
                      </h3>
                      <div className="text-sm text-gray-600">
                        <p>
                          {devis?.client.titre && devis?.client.titre + ". "}
                          {devis?.client.nom.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-1 ">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Devis N° :{" "}
                        <span className="font-normal text-gray-600 mb-2">
                          {devis?.numero}{" "}
                        </span>
                      </h3>

                      <h3 className="font-semibold text-gray-900 mb-1">
                        Date :
                        <span className="font-normal text-gray-600 mb-2">
                          {" "}
                          {formatDate(devis?.createdAt)}{" "}
                        </span>
                      </h3>
                    </div>
                  </div>
                  <div id="3rd-col" className="flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Total de Devis :{" "}
                        <span className="font-normal text-gray-600 mb-2">
                          {formatCurrency(devis?.total)}
                        </span>
                      </h3>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Total de fournitures :
                        <span className="font-normal text-gray-600 mb-2">
                          {formatCurrency(totalFourniture(bLGroups))}
                        </span>
                      </h3>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Marge :
                        <span className="font-normal text-gray-600 mb-2">
                          {formatCurrency(
                            devis?.total - totalFourniture(bLGroups)
                          )}{" "}
                          (
                          {calculateMargePercent(
                            devis,
                            totalFourniture(bLGroups)
                          ).toFixed(2)}
                          %)
                        </span>
                      </h3>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 auto-cols-max justify-between">
                  <div id="1st-col">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Client:
                    </h3>
                    <div className="text-sm text-gray-600">
                      <p>
                        {devis?.client.titre && devis?.client.titre + ". "}
                        {devis?.client.nom.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div id="2nd-col">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Devis N° :{" "}
                      <span className="font-normal text-gray-600 mb-2">
                        {devis?.numero}{" "}
                      </span>
                    </h3>

                    <h3 className="font-semibold text-gray-900 mb-1">
                      Date :
                      <span className="font-normal text-gray-600 mb-2">
                        {" "}
                        {formatDate(devis?.createdAt)}{" "}
                      </span>
                    </h3>
                  </div>
                  <div id="3rd-col" className="flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Total de Devis :{" "}
                        <span className="font-normal text-gray-600 mb-2">
                          {formatCurrency(devis?.total)}
                        </span>
                      </h3>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Total de fournitures :
                        <span className="font-normal text-gray-600 mb-2">
                          {formatCurrency(totalFourniture(bLGroups))}
                        </span>
                      </h3>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Marge :
                        <span className="font-normal text-gray-600 mb-2">
                          {formatCurrency(
                            devis?.total - totalFourniture(bLGroups)
                          )}{" "}
                          (
                          {calculateMargePercent(
                            devis,
                            totalFourniture(bLGroups)
                          ).toFixed(2)}
                          %)
                        </span>
                      </h3>
                    </div>
                  </div>
                </div>
              )}
              {bLGroups?.length > 0 ? (
                <div className="space-y-2 ">
                  {bLGroups?.map((groupe, index) => (
                    <div
                      key={groupe.id || index}
                      className="print-block print:bg-non"
                    >
                      <div className="flex items center justify-between gap-8 mb-1">
                        {/* commande Info */}
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-semibold">
                              {formatDate(groupe?.bonLivraison?.date)}
                            </p>
                          </div>
                          <span> • </span>
                          <div>
                            <p className="font-semibold">
                              {groupe?.bonLivraison?.fournisseur.nom}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-semibold">
                              {groupe?.bonLivraison?.numero}
                            </p>
                          </div>
                          <span> • </span>
                          <div>
                            <p className="font-semibold">
                              {groupe?.bonLivraison?.type.toUpperCase()}
                            </p>
                          </div>
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
                                <TableHead className="text-sm  border-b border-zinc-500 text-black font-medium  text-right !py-0">
                                  Prix unitaire
                                </TableHead>
                                <TableHead className="text-sm  border-b border-zinc-500 text-black font-medium  text-right !py-0">
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
                                  <TableCell className="  border-t border-zinc-500  p-1 text-right p-0 pr-2">
                                    {formatCurrency(produit.prixUnite)}
                                  </TableCell>
                                  <TableCell className="  border-t border-zinc-500  p-1 text-right p-0 pr-2">
                                    {formatCurrency(
                                      produit.quantite * produit.prixUnite
                                    )}
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
                                  {formatCurrency(
                                    totalBlFourniture(groupe.produits)
                                  )}
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
                  aucun BL trouvé
                </div>
              )}
            </div>
            <div>
              <h3 className=" w-full border rounded-xl font-semibold text-center text-xl text-gray-900 mb-2 p-4 my-2">
                Total de fournitures :{" "}
                {formatCurrency(totalFourniture(bLGroups))}
              </h3>
            </div>
            <div
              className="flex items-center justify-between 
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
              <DirectPrintButton className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full">
                Imprimer
              </DirectPrintButton>
            </div>
          </div>
        </>
      )}
    </>
  );
}
