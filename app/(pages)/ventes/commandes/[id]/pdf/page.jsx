"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useState } from "react";
import { Table, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Phone, MapPin } from "lucide-react";
import LoadingCommandePdf from "@/components/loading-commande-pdf";

function formatDate(dateString) {
  return dateString?.split("T")[0].split("-").reverse().join("-");
}

export default function DevisPDFPage() {
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
  return (
    <>
      {commande ? (
        <div className="container mx-auto p-8 max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none mb-10">
          {/* Document Content */}
          <div id="print-area" className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start text-sm text-gray-600">
              <div>
                {new Date().toLocaleString("fr-FR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div>Statut : {commande?.statut}</div>
            </div>
            <div className="border-b border-purple-500 pb-4">
              <h1 className="text-3xl font-bold text-purple-600">
                COMMANDE N° : {commande?.numero}
              </h1>
            </div>
            {/* Title */}

            {/* Company and Client Info */}
            <div className="grid grid-cols-2 gap-8">
              {/* Company Info */}
              <div className="space-y-1">
                <h2 className="font-bold text-xl text-gray-900">OUDAOUDOX</h2>
                <p className="font-small font-bold text-slate-700 text-sm">
                  DECORATION-MENUISERIE-TRAVAUX DIVERS
                </p>
                <div className="flex items-center gap-2 ">
                  <MapPin className="h-4 w-4" />
                  <p>Dcheira Rue 1630 N° 01, Inzegan</p>
                </div>
                <div className="flex items-center gap-2 ">
                  <Phone className="h-4 w-4" />
                  <p>0654788963</p>
                </div>
              </div>

              {/* Client Info */}
              <div className="space-y-1">
                <h2 className="font-bold text-xl text-gray-900">Client</h2>
                <p>{commande?.client.nom.toUpperCase()}</p>
                <div className="flex items-center gap-2 ">
                  <MapPin className="h-4 w-4" />
                  <p>{commande?.client.adresse}</p>
                </div>
                <div className="flex items-center gap-2 ">
                  <Phone className="h-4 w-4" />
                  <p>{commande?.client.telephone}</p>
                </div>
              </div>
            </div>

            {/* Quote Details */}
            <div className="space-y-1">
              <p>
                <span className="font-medium">Date de création:</span>{" "}
                {formatDate(commande?.createdAt)}{" "}
              </p>
              <p>
                <span className="font-medium">Date limite de livraison :</span>{" "}
                {formatDate(commande?.echeance)}
              </p>
              <p>
                <span className="font-medium">Émis par:</span> Commerçant 1
              </p>
            </div>

            {/* Items Table */}
            <div className="border rounded-md">
              <Table>
                <thead className="text-zinc-700 text-[1rem]">
                  <TableRow>
                    <TableHead className=" text-left">Désignation</TableHead>
                    <TableHead className="border-l text-left">
                      Quantité
                    </TableHead>
                    <TableHead className="border-l p-2 text-left">
                      Prix unitaire
                    </TableHead>
                    <TableHead className="border-l p-2 text-right">
                      Montant
                    </TableHead>
                  </TableRow>
                </thead>
                <tbody>
                  {commande?.commandeProduits.map((articl) => (
                    <TableRow key={articl.id}>
                      <TableCell className=" p-2 text-left">
                        {articl.produit.designation}{" "}
                      </TableCell>
                      <TableCell className="border-l p-2 text-left">
                        {articl.quantite}
                      </TableCell>
                      <TableCell className="border-l p-2 text-left">
                        {articl.prixUnite} DH
                      </TableCell>
                      <TableCell className="border-l p-2 text-right">
                        {articl.montant} DH
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
                <tfoot className="font-medium bg-zinc-100">
                  {commande?.fraisLivraison > 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="border-b p-2 text-right"
                      >
                        Frais de transport :
                      </TableCell>
                      <TableCell className="border-l border-b p-2 text-right">
                        {commande?.fraisLivraison} DH
                      </TableCell>
                    </TableRow>
                  )}
                  {!commande?.sousTotal === commande?.total && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="border-b p-2 text-right"
                      >
                        Sous-total :
                      </TableCell>
                      <TableCell className="border-l border-b p-2 text-right">
                        {commande?.sousTotal} DH
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={3} className="border-b p-2 text-right">
                      Montant payé :
                    </TableCell>
                    <TableCell className="border-l border-b p-2 text-right">
                      {commande?.totalPaye} DH
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} className="border-b p-2 text-right">
                      Total :
                    </TableCell>
                    <TableCell className="border-l border-b p-2 text-right">
                      {commande?.total} DH
                    </TableCell>
                  </TableRow>
                  {commande?.reduction > 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className=" border-b p-2 text-right"
                      >
                        Réduction :
                      </TableCell>
                      <TableCell className="border-l border-b p-2 text-right">
                        {commande?.reduction} {commande?.typeReduction}
                      </TableCell>
                    </TableRow>
                  ) : (
                    ""
                  )}
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-xl text-gray-900 p-2 text-right"
                    >
                      Reste a payer :
                    </TableCell>
                    <TableCell className="border-l p-2 text-xl text-gray-900 text-right">
                      {(commande?.total - commande?.totalPaye).toFixed(2)} DH
                    </TableCell>
                  </TableRow>
                </tfoot>
              </Table>
            </div>
            {/* <div className="flex justify-between text-sm text-gray-600 pt-4">
              <div>www.oudaoudox.com</div>
            </div> */}
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
