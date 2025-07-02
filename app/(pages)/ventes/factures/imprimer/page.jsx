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

function nombreEnLettres(n) {
  const unites = [
    "",
    "un",
    "deux",
    "trois",
    "quatre",
    "cinq",
    "six",
    "sept",
    "huit",
    "neuf",
  ];
  const dizaines = [
    "",
    "dix",
    "vingt",
    "trente",
    "quarante",
    "cinquante",
    "soixante",
  ];
  const dizainesSpeciales = [
    "dix",
    "onze",
    "douze",
    "treize",
    "quatorze",
    "quinze",
    "seize",
  ];

  function convertMoinsDeCent(n) {
    if (n < 10) return unites[n];
    if (n < 17) return dizainesSpeciales[n - 10];
    if (n < 20) return "dix-" + unites[n - 10];
    if (n < 70) {
      const dizaine = Math.floor(n / 10);
      const unite = n % 10;
      return (
        dizaines[dizaine] +
        (unite === 1 ? "-et-un" : unite > 0 ? "-" + unites[unite] : "")
      );
    }
    if (n < 80) return "soixante-" + convertMoinsDeCent(n - 60);
    if (n < 100)
      return (
        "quatre-vingt" + (n === 80 ? "s" : "-" + convertMoinsDeCent(n - 80))
      );
  }

  function convertMoinsDeMille(n) {
    if (n < 100) return convertMoinsDeCent(n);
    const centaine = Math.floor(n / 100);
    const reste = n % 100;
    return (
      (centaine === 1
        ? "cent"
        : unites[centaine] + " cent" + (reste === 0 ? "s" : "")) +
      (reste > 0 ? " " + convertMoinsDeCent(reste) : "")
    );
  }

  function convertir(n) {
    if (n === 0) return "zéro";
    if (n < 1000) return convertMoinsDeMille(n);
    const mille = Math.floor(n / 1000);
    const reste = n % 1000;
    return (
      (mille === 1 ? "mille" : convertMoinsDeMille(mille) + " mille") +
      (reste > 0 ? " " + convertMoinsDeMille(reste) : "")
    );
  }

  return convertir(n).trim();
}
function formatDate(dateString) {
  return dateString?.split("T")[0].split("-").reverse().join("-");
}
export default function DevisPDFPage() {
  const [facture, setFacture] = useState();
  const [infosVisibilite, setInfosVisibilite] = useState(false);
  useEffect(() => {
    const storedData = localStorage.getItem("facture");
    if (storedData) {
      setFacture(JSON.parse(storedData));
    }
    console.log("devi", JSON.parse(storedData));
  }, []);
  const { devis, date, numero } = facture ? facture : {};
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="container mx-auto p-4 max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        {/* Document Content */}
        <div id="print-area" className="space-y-3">
          {/* Header */}
          <EnteteDevis />

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
                  <h3 className="font-semibold text-gray-900 mb-2">Client:</h3>
                  <div className="text-sm text-gray-600">
                    <p>
                      {devis?.client.titre && devis?.client.titre + ". "}
                      {devis?.client.nom.toUpperCase()}
                    </p>
                    {devis?.client.ice && (
                      <div className="flex items-center gap-2 ">
                        <p className="font-medium text-sm">
                          ICE : {devis?.client.ice}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-span-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Facture N° : {numero}
                  </h3>
                  <div className="text-sm text-gray-600">
                    <p>Date : {formatDate(date)} </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2  gap-4">
              <div className="col-span-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Facture N° : {numero}
                </h3>
                <div className="text-sm text-gray-600">
                  <p>Date : {formatDate(date)} </p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Client:</h3>
                <div className="text-sm text-gray-600">
                  <p>
                    {devis?.client.titre && devis?.client.titre + ". "}
                    {devis?.client.nom.toUpperCase()}
                  </p>
                  {devis?.client.ice && (
                    <div className="flex items-center gap-2 ">
                      <p className="font-medium text-sm">
                        ICE : {devis?.client.ice}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="overflow-hidden rounded-md border border-black mt-0 main-table-container">
            <Table className="w-full border-collapse print:w-full print:min-w-full">
              <TableHeader className="text-[1rem] border-black">
                <TableRow>
                  <TableHead
                    rowSpan="2"
                    className="w-[40%] max-w-[45%] text-black font-bold text-center border-b border-black"
                  >
                    Désignation
                  </TableHead>
                  <TableHead
                    colSpan="2"
                    className="text-black font-bold border-l border-b border-black text-center p-1"
                  >
                    Dimension
                  </TableHead>
                  <TableHead
                    rowSpan="2"
                    className="text-black font-bold border-l border-b border-black text-center p-1"
                  >
                    U
                  </TableHead>
                  <TableHead
                    rowSpan="2"
                    className="text-black font-bold border-l border-b border-black text-center p-1"
                  >
                    Qté
                  </TableHead>
                  <TableHead
                    rowSpan="2"
                    className="text-black font-bold border-l border-b border-black p-2 text-center p-1"
                  >
                    P.U/m²
                  </TableHead>
                  <TableHead
                    rowSpan="2"
                    className="text-black font-bold border-l border-b border-black p-2 text-center"
                  >
                    Montant
                  </TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-black font-semibold text-center border-b border-l border-black p-1">
                    Longueur
                  </TableHead>
                  <TableHead className="text-black font-semibold border-l border-b border-black text-center p-1">
                    Largeur
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devis?.articls?.map((articl) => (
                  <TableRow key={articl.id}>
                    <TableCell className=" p-1 text-left border-b border-black text-md font-semibold">
                      {articl.designation}{" "}
                    </TableCell>
                    <TableCell className="border-l border-b border-black p-1 text-center">
                      {articl.length === 0 ? "-" : articl.length}
                    </TableCell>
                    <TableCell className="border-l border-b border-black p-1 text-center">
                      {articl.width === 0 ? "-" : articl.width}
                    </TableCell>
                    <TableCell className="border-l border-b border-black p-1 text-center">
                      {articl.unite}
                    </TableCell>
                    <TableCell className="border-l border-b border-black p-1 text-center">
                      {articl.quantite}
                    </TableCell>
                    <TableCell className="border-l border-b  border-black p-1 text-center">
                      {articl.prixUnite} DH
                    </TableCell>
                    <TableCell className="border-l border-b border-black p-1 text-center font-bold">
                      {articl.montant} DH
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter className="font-medium border-black">
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className=" p-2 text-right text-lg font-bold"
                  >
                    Total H.T :
                  </TableCell>
                  <TableCell
                    colSpan={2}
                    className="border-l border-black p-2 text-left text-lg font-bold"
                  >
                    {devis?.sousTotal.toFixed(2)} DH
                  </TableCell>
                </TableRow>

                {devis?.reduction > 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className=" border-t border-black p-2 text-right text-lg font-bold"
                    >
                      Réduction :
                    </TableCell>
                    <TableCell
                      colSpan={2}
                      className="border-l border-t border-black p-2 text-lg text-left font-bold"
                    >
                      {devis?.reduction} {devis?.typeReduction}
                    </TableCell>
                  </TableRow>
                ) : (
                  ""
                )}
                {devis?.tva > 0 ? (
                  <>
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="border-t border-black p-2 text-right text-lg font-bold"
                      >
                        TVA :
                      </TableCell>
                      <TableCell
                        colSpan={2}
                        className="border-l border-t border-black p-2 text-lg text-left font-bold"
                      >
                        {devis?.tva.toFixed(2)} DH
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className=" text-gray-900 border-t border-black  text-xl p-2 text-right font-extrabold"
                      >
                        Total TTC :
                      </TableCell>
                      <TableCell
                        colSpan={2}
                        className="border-l border-t border-black p-2 text-xl text-gray-900 text-left font-extrabold"
                      >
                        {devis?.total.toFixed(2)} DH
                      </TableCell>
                    </TableRow>
                  </>
                ) : (
                  ""
                )}
              </TableFooter>
            </Table>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium mb-0">
              Arrêtée la présente facture à la somme de :{" "}
              <span className="text-sm font-bold mb-0 ">
                {nombreEnLettres(devis?.total)}{" "}
              </span>{" "}
              Dirhams 
            </h3>
            {/* {infosVisibilite && <PiedFactureStyle2 />} */}
          </div>
        </div>
        <div
          className="flex items-center justify-between print:hidden
print:hidden"
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
  );
}
