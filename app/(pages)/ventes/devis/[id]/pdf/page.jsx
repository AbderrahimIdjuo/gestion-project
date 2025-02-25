"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import axios from "axios";
import { useState } from "react";
import { Table, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Phone, MapPin, Smartphone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import LoadingDeviPdf from "@/components/loading-devi-pdf";

export default function DevisPDFPage() {
  const [devi, setDevi] = useState();

  const getInfoEntreprise = async () => {
    const response = await axios.get("/api/infoEntreprise");
    const infoEntreprise = response.data.infoEntreprise;
    return infoEntreprise;
  };

  const query = useQuery({
    queryKey: ["infoEntreprise"],
    queryFn: getInfoEntreprise,
  });

  useEffect(() => {
    const storedData = localStorage.getItem("devi");
    if (storedData) {
      setDevi(JSON.parse(storedData));
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {devi ? (
        <div className="container mx-auto p-8 max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none">
          {/* Document Content */}
          <div id="print-area" className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-purple-500 pb-4">
              <h1 className="text-3xl font-bold text-purple-600">
                DEVIS N° : {devi?.numero}
              </h1>

              <Avatar className="w-24 h-24">
                <AvatarImage src="" />
                <AvatarFallback>Logo</AvatarFallback>
              </Avatar>
            </div>

            {/* Title */}

            {/* Company and Client Info */}
            <div className="grid grid-cols-2 gap-8">
              {/* Company Info */}
              <div className="space-y-1">
                <h2 className="font-bold text-xl text-gray-900">
                  {query.data?.[0].nom.toUpperCase()}
                </h2>
                <p className="font-small font-bold text-slate-700 text-sm">
                  {query.data?.[0].slogan.toUpperCase()}
                </p>
                <div className="flex items-center gap-2 ">
                  <MapPin className="h-4 w-4" />
                  <p>{query.data?.[0].adresse}</p>
                </div>
                <div className="flex items-center gap-2 ">
                  <Phone className="h-4 w-4" />
                  <p>{query.data?.[0].telephone}</p>
                </div>
                {query.data?.[0].mobile && (
                  <div className="flex items-center gap-2 ">
                    <Smartphone className="h-4 w-4" />
                    <p>{query.data?.[0].mobile}</p>
                  </div>
                )}
              </div>

              {/* Client Info */}
              <div className="space-y-1">
                <h2 className="font-bold text-xl text-gray-900">Client</h2>
                <p>{devi?.client.nom.toUpperCase()}</p>
                <div className="flex items-center gap-2 ">
                  <MapPin className="h-4 w-4" />
                  <p>{devi?.client.adresse}</p>
                </div>
                <div className="flex items-center gap-2 ">
                  <Phone className="h-4 w-4" />
                  <p>{devi?.client.telephone}</p>
                </div>
              </div>
            </div>

            {/* Quote Details */}
            <div className="space-y-1">
              <p>
                <span className="font-medium">Date de création:</span>{" "}
                {devi?.createdAt.split("T")[0]}{" "}
              </p>
              <p>
                <span className="font-medium">Référence du devis:</span>{" "}
                {devi?.createdAt}
              </p>
              <p>
                <span className="font-medium">Date de validité du devis:</span>{" "}
                20/6/2025
              </p>
              <p>
                <span className="font-medium">Statut :</span> {devi?.statut}
              </p>
              <p>
                <span className="font-medium">Émis par:</span> John Doe
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
                  {devi?.articls?.map((articl) => (
                    <TableRow key={articl.id}>
                      <TableCell className=" p-2 text-left">
                        {articl.designation}{" "}
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
                  <TableRow>
                    <TableCell colSpan={3} className="border-b p-2 text-right">
                      Frais de transport :
                    </TableCell>
                    <TableCell className="border-l border-b p-2 text-right">
                      {devi?.fraisLivraison} DH
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} className="border-b p-2 text-right">
                      Sous-total :
                    </TableCell>
                    <TableCell className="border-l border-b p-2 text-right">
                      {devi?.sousTotal} DH
                    </TableCell>
                  </TableRow>
                  {devi?.reduction > 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className=" border-b p-2 text-right"
                      >
                        Réduction :
                      </TableCell>
                      <TableCell className="border-l border-b p-2 text-right">
                        {devi?.reduction} {devi?.typeReduction}
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
                      Total :
                    </TableCell>
                    <TableCell className="border-l p-2 text-xl text-gray-900 text-right">
                      {devi?.total} DH
                    </TableCell>
                  </TableRow>
                </tfoot>
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
        <LoadingDeviPdf />
      )}
    </>
  );
}
