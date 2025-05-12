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
import { useQuery } from "@tanstack/react-query";
import { Phone, Calendar } from "lucide-react";
import LoadingCommandePdf from "@/components/loading-commande-pdf";
import axios from "axios";

function formatDate(dateString) {
  return dateString?.split("T")[0].split("-").reverse().join("-");
}

function formatPhoneNumber(phone) {
  return phone.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

export default function CommandesPDFPage() {
  const [commande, setCommande] = useState();
  const handlePrint = () => {
    window.print();
  };
  useEffect(() => {
    const storedData = localStorage.getItem("commande");
    console.log("storedData", JSON.parse(storedData));
    if (storedData) {
      setCommande(JSON.parse(storedData));
    }
  }, []);
  const info = useQuery({
    queryKey: ["infoEntreprise"],
    queryFn: async () => {
      const response = await axios.get("/api/infoEntreprise");
      const infoEntreprise = response.data.infoEntreprise;
      return infoEntreprise;
    },
  });
  return (
    <>
      {commande ? (
        <div className="container mx-auto p-8 max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none mb-10">
          {/* Document Content */}
          <div id="print-area" className="space-y-6">
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
                      <span>Date limite de livraison:</span>{" "}
                      {formatDate(commande?.echeance)}{" "}
                    </p>
                  </div>
                )}
              </div>

              {/* Client Info */}
              <div className="col-span-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="font-bold text-lg text-gray-900">Client : </h2>
                  <p className="font-bold text-lg text-gray-900">
                    {commande?.client.titre && commande?.client.titre + ". "}
                    {commande?.client.nom.toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ">
                  <Phone className="h-3 w-3" />
                  <p className="font-medium text-sm">
                    {formatPhoneNumber(commande?.client.telephone)}
                  </p>
                </div>
              </div>
            </div>
            {/* Items Table */}
            <div className="overflow-hidden rounded-lg border border-black">
              <Table className="w-full border-collapse">
                <TableHeader className="text-[1rem] border-black">
                  <TableRow>
                    <TableHead className="text-black font-bold text-center border-b border-black w-[50%]">
                      Désignation
                    </TableHead>
                    <TableHead className="text-black font-bold border-l border-b border-black text-center ">
                      Qté
                    </TableHead>
                    <TableHead className="text-black font-bold border-l border-b border-black text-center">
                      Prix unitaire
                    </TableHead>
                    <TableHead className="text-black font-bold border-l border-b border-black p-2 text-center">
                      Montant
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commande?.commandeProduits.map((articl) => (
                    <TableRow key={articl.id}>
                      <TableCell className=" p-1 text-left border-b border-black text-md font-semibold">
                        {articl.produit.designation}{" "}
                      </TableCell>
                      <TableCell className="border-l border-b border-black p-2 text-center">
                        {articl.quantite}
                      </TableCell>
                      <TableCell className="border-l border-b border-black p-2 text-center">
                        {articl.prixUnite} DH
                      </TableCell>
                      <TableCell className="border-l border-b border-black p-2 text-center font-bold">
                        {articl.montant} DH
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="font-medium">
                  {!commande?.sousTotal === commande?.total && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="border-b border-black p-2 text-right font-bold"
                      >
                        Sous-total :
                      </TableCell>
                      <TableCell className="border-l border-b border-black p-2 text-right font-bold">
                        {commande?.sousTotal} DH
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className=" border-b border-black p-2 text-right font-bold"
                    >
                      Coût de production :
                    </TableCell>
                    <TableCell className="border-l border-b border-black p-2 text-center font-bold">
                      {commande?.total} DH
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className=" border-b border-black p-2 text-right font-bold"
                    >
                      Montant à payer :
                    </TableCell>
                    <TableCell className="border-l border-b border-black p-2 text-center font-bold">
                      {commande?.totalDevi} DH
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-xl text-gray-900 p-2 text-right font-extrabold"
                    >
                      Reste à payer :
                    </TableCell>
                    <TableCell className="border-l border-black p-2 text-xl text-gray-900 text-center font-extrabold">
                      {(commande?.totalDevi - commande?.totalPaye).toFixed(2)}{" "}
                      DH
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            <div className="flex justify-between text-sm text-gray-600 pt-4">
              <div>
                {" "}
                {new Date().toLocaleString("fr-FR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
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
        <LoadingCommandePdf />
      )}
    </>
  );
}
