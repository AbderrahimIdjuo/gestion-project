"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import axios from "axios";
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
import { Phone, MapPin, Smartphone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import LoadingDeviPdf from "@/components/loading-devi-pdf";

export default function DevisPDFPage() {
  const [devi, setDevi] = useState();

  const info = useQuery({
    queryKey: ["infoEntreprise"],
    queryFn: async () => {
      const response = await axios.get("/api/infoEntreprise");
      const infoEntreprise = response.data.infoEntreprise;
      return infoEntreprise;
    },
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

  function formatDate(dateString) {
    return dateString.split("T")[0].split("-").reverse().join("-");
  }

  return (
    <>
      {devi ? (
        <div className="container mx-auto p-8 max-w-4xl bg-white min-h-screen print:p-0 print:max-w-none mb-10">
          {/* Document Content */}
          <div id="print-area" className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-purple-500 pb-4">
              <h1 className="text-3xl font-bold text-purple-600">
                DEVIS N° : {devi?.numero}
              </h1>

              <Avatar className="w-24 h-24 shadow-md border ">
                <AvatarImage src={info.data?.logoUrl} />
                <AvatarFallback>Logo</AvatarFallback>
              </Avatar>
            </div>

            {/* Company and Client Info */}
            <div className="grid grid-cols-2 gap-8">
              {/* Company Info */}
              <div className="space-y-1">
                <h2 className="font-bold text-xl text-gray-900">
                  {info.data?.nom.toUpperCase()}
                </h2>
                <p className="font-small font-bold text-slate-700 text-sm">
                  {info.data?.slogan.toUpperCase()}
                </p>
                {info.data?.adresse && (
                  <div className="flex items-center gap-2 ">
                    <MapPin className="h-4 w-4" />
                    <p>{info.data?.adresse}</p>
                  </div>
                )}
                {info.data?.telephone && (
                  <div className="flex items-center gap-2 ">
                    <Phone className="h-4 w-4" />
                    <p>{info.data?.telephone}</p>
                  </div>
                )}
                {info.data?.mobile && (
                  <div className="flex items-center gap-2 ">
                    <Smartphone className="h-4 w-4" />
                    <p>{info.data?.mobile}</p>
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
                {formatDate(devi?.createdAt)}{" "}
              </p>
              <p>
                <span className="font-medium">Statut :</span> {devi?.statut}
              </p>
              <p>
                <span className="font-medium">Émis par:</span> commerçant 1
              </p>
            </div>

            {/* Items Table */}
            <div className="overflow-hidden rounded-lg border border-black">
              <Table className="w-full border-collapse">
                <TableHeader className="text-[1rem] border-black">
                  <TableRow>
                    <TableHead className="text-black font-bold text-left border-b border-black">
                      Désignation
                    </TableHead>
                    <TableHead className="text-black font-bold border-l border-b border-black text-left">
                      Quantité
                    </TableHead>
                    <TableHead className="text-black font-bold border-l border-b border-black p-2 text-left">
                      Prix unitaire
                    </TableHead>
                    <TableHead className="text-black font-bold border-l border-b border-black p-2 text-right">
                      Montant
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devi?.articls?.map((articl) => (
                    <TableRow key={articl.id}>
                      <TableCell className=" p-2 text-left border-b border-black">
                        {articl.designation}{" "}
                      </TableCell>
                      <TableCell className="border-l border-b border-black p-2 text-left">
                        {articl.quantite}
                      </TableCell>
                      <TableCell className="border-l border-b  border-black p-2 text-left">
                        {articl.prixUnite} DH
                      </TableCell>
                      <TableCell className="border-l border-b border-black p-2 text-right font-bold">
                        {articl.montant} DH
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="font-medium  border-black bg-zinc-100 ">
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="border-b border-black p-2 text-right font-bold"
                    >
                      Frais de transport :
                    </TableCell>
                    <TableCell className="border-l border-b border-black p-2 text-right font-bold">
                      {devi?.fraisLivraison} DH
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="border-b border-black p-2 text-right font-bold"
                    >
                      Sous-total :
                    </TableCell>
                    <TableCell className="border-l border-b border-black p-2 text-right font-bold">
                      {devi?.sousTotal} DH
                    </TableCell>
                  </TableRow>
                  {devi?.reduction > 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className=" border-b border-black p-2 text-right font-bold"
                      >
                        Réduction :
                      </TableCell>
                      <TableCell className="border-l border-b border-black p-2 text-right font-bold">
                        {devi?.reduction} {devi?.typeReduction}
                      </TableCell>
                    </TableRow>
                  ) : (
                    ""
                  )}
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-xl text-gray-900 p-2 text-right font-extrabold"
                    >
                      Total :
                    </TableCell>
                    <TableCell className="border-l border-black p-2 text-xl text-gray-900 text-right font-extrabold">
                      {devi?.total} DH
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
        <LoadingDeviPdf />
      )}
    </>
  );
}
