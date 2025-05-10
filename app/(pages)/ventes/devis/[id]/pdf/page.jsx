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
import PiedFacture from "@/components/pied-facture";
import LoadingDeviPdf from "@/components/loading-devi-pdf";

function formatPhoneNumber(phone) {
  return phone.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}
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

export default function DevisPDFPage() {
  const [devi, setDevi] = useState();
  useEffect(() => {
    const storedData = localStorage.getItem("devi");
    if (storedData) {
      setDevi(JSON.parse(storedData));
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  function formatDate(dateString) {
    return dateString.split("T")[0].split("-").reverse().join("-");
  }
  const modesPaiement = [
    {
      pourcentage: "50% à l'avance",
      montantHT: devi?.sousTotal * 0.5,
      tva: devi?.sousTotal * 0.5 * 0.2,
      montantTTC: devi?.sousTotal * 0.5 + devi?.sousTotal * 0.5 * 0.2,
    },
    {
      pourcentage: "25% à la livraison",
      montantHT: devi?.sousTotal * 0.25,
      tva: devi?.sousTotal * 0.25 * 0.2,
      montantTTC: devi?.sousTotal * 0.25 + devi?.sousTotal * 0.25 * 0.2,
    },
    {
      pourcentage: "25% à la récéption",
      montantHT: devi?.sousTotal * 0.25,
      tva: devi?.sousTotal * 0.25 * 0.2,
      montantTTC: devi?.sousTotal * 0.25 + devi?.sousTotal * 0.25 * 0.2,
    },
  ];
  return (
    <>
      {devi ? (
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
                  DEVIS N° : {devi?.numero}
                </h1>
                <div className="flex items-center gap-2 mt-2 ">
                  <Calendar className="h-3 w-3" />
                  <p className="font-medium text-sm">
                    <span>Date de création:</span> {formatDate(devi?.createdAt)}{" "}
                  </p>
                </div>
              </div>

              {/* Client Info */}
              <div className="col-span-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="font-bold text-lg text-gray-900">Client : </h2>
                  <p className="font-bold text-lg text-gray-900">
                    {devi?.client.civilite && devi?.client.civilite +". "}
                     {devi?.client.nom.toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ">
                  <Phone className="h-3 w-3" />
                  <p className="font-medium text-sm">
                    {formatPhoneNumber(devi?.client.telephone)}
                  </p>
                </div>
              </div>
            </div>
            {/* Items Table */}
            <div className="overflow-hidden rounded-md border border-black mt-0">
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
                      P.U
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
                  {devi?.articls?.map((articl) => (
                    <TableRow key={articl.id}>
                      <TableCell className=" p-1 text-left border-b border-black text-md font-semibold">
                        {articl.designation}{" "}
                      </TableCell>
                      <TableCell className="border-l border-b border-black p-1 text-center">
                        {articl.length}
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
                <TableFooter className="font-medium border-black ">
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="border-b border-black p-2 text-right font-bold"
                    >
                      Total H.T :
                    </TableCell>
                    <TableCell
                      colSpan={2}
                      className="border-l border-b border-black p-2 text-left font-bold"
                    >
                      {devi?.sousTotal.toFixed(2)} DH
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="border-b border-black p-2 text-right font-bold"
                    >
                      TVA :
                    </TableCell>
                    <TableCell
                      colSpan={2}
                      className="border-l border-b border-black p-2 text-left font-bold"
                    >
                      {devi?.tva.toFixed(2)} DH
                    </TableCell>
                  </TableRow>
                  {devi?.reduction > 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className=" border-b border-black p-2 text-right font-bold"
                      >
                        Réduction :
                      </TableCell>
                      <TableCell
                        colSpan={2}
                        className="border-l border-b border-black p-2 text-left font-bold"
                      >
                        {devi?.reduction} {devi?.typeReduction}
                      </TableCell>
                    </TableRow>
                  ) : (
                    ""
                  )}
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-lg text-gray-900 p-2 text-right font-extrabold"
                    >
                      Total TTC :
                    </TableCell>
                    <TableCell
                      colSpan={2}
                      className="border-l border-black p-2 text-lg text-gray-900 text-left font-extrabold"
                    >
                      {devi?.total.toFixed(2)} DH
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium mb-0">
                Arrêter le devis à :{" "}
                <span className="text-sm font-bold mb-0 ">
                  {nombreEnLettres(devi?.total)}{" "}
                </span>{" "}
                Dirhams TTC{" "}
              </h3>
              <h3 className="text-sm font-medium mb-0">
                Validité du devis : 30 jours{" "}
              </h3>
              <div className="print-block ">
                <h3 className="text-sm font-medium mb-0">
                  Modes de paiements :
                </h3>
                <div className="flex justify-center">
                  <div className="w-[70%] overflow-hidden rounded-md border border-black my-auto">
                    <Table className="w-full border-collapse">
                      <TableHeader className="text-[1rem] border-black">
                        <TableRow>
                          <TableHead className="text-sm text-black font-medium text-center p-0">
                            Paiements
                          </TableHead>
                          <TableHead className="text-sm text-black font-medium border-l text-center p-0">
                            Montant H.T
                          </TableHead>
                          <TableHead className="text-sm text-black font-medium border-l text-center p-0">
                            TVA 20%
                          </TableHead>
                          <TableHead className="text-sm text-black font-medium border-l text-center p-0">
                            Montant TTC
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {modesPaiement.map((mode) => (
                          <TableRow key={mode.pourcentage}>
                            <TableCell className="p-1 text-center border-b text-md font-semibold p-0">
                              {mode.pourcentage}
                            </TableCell>
                            <TableCell className="border-l border-b p-1 text-center p-0">
                              {mode.montantHT.toFixed(2)} DH
                            </TableCell>
                            <TableCell className="border-l border-b p-1 text-center p-0">
                              {mode.tva.toFixed(2)} DH
                            </TableCell>
                            <TableCell className="border-l border-b p-1 text-center p-0">
                              {mode.montantTTC.toFixed(2)} DH
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-0 italic underline">
                  En signant ce devis, le client confirme son accord et valide
                  une commande ferme et définitive.
                </h3>
              </div>
              <PiedFacture />
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
