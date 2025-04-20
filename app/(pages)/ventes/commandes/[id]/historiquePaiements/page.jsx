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
import { Phone, MapPin, Smartphone } from "lucide-react";
import LoadingHistoriquePaiements from "@/components/loading-historique-paiements";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axios from "axios";

function formatDate(dateString) {
  return dateString?.split("T")[0].split("-").reverse().join("-");
}

export default function CommandesPDFPage() {
  const [commande, setCommande] = useState();
  const [transactions, setTransactions] = useState();
  const handlePrint = () => {
    window.print();
  };
  useEffect(() => {
    const commandeDetails = localStorage.getItem("commande");
    console.log("commandeDetails", JSON.parse(commandeDetails));
    if (commandeDetails) {
      setCommande(JSON.parse(commandeDetails));
    }

    const transactionsDetails = localStorage.getItem("transactions");
    console.log("transactionsDetails", JSON.parse(transactionsDetails));
    if (transactionsDetails) {
      setTransactions(JSON.parse(transactionsDetails));
    }
  }, []);
  const totalPaye = transactions?.reduce((acc, transaction) => {
    return acc + transaction.montant;
  }, 0);
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
            <div className="flex justify-between items-center border-b border-purple-500 pb-4">
              <div>
                <h1 className="text-2xl font-bold text-purple-600">
                  COMMANDE N° : {commande?.numero}
                </h1>
                <h3 className="text-2xl font-bold text-purple-600">
                  Total TTC : {commande?.totalDevi} DH
                </h3>
              </div>

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

            {/* Items Table */}
            <h3 className="text-xl font-bold">Historique des paiements :</h3>
            <div className="overflow-hidden rounded-lg border border-black">
              <Table className="w-full border-collapse">
                <TableHeader className="text-[1rem] border-black">
                  <TableRow>
                    <TableHead className="text-black font-bold text-left border-b border-black">
                      Date
                    </TableHead>
                    <TableHead className="text-black font-bold border-l border-b border-black text-left">
                      Montant
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className=" p-2 text-left border-b border-black font-semibold">
                        {formatDate(transaction.createdAt)}{" "}
                      </TableCell>
                      <TableCell className="border-l border-b border-black p-2 text-left font-semibold">
                        {transaction.montant} DH
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="font-medium bg-zinc-100">
                  <TableRow>
                    <TableCell
                      colSpan={1}
                      className="text-xl border-b border-black text-gray-900 p-2 text-right font-extrabold"
                    >
                      Total payé :
                    </TableCell>
                    <TableCell className="border-l border-b border-black border-black p-2 text-xl text-gray-900 text-left font-extrabold">
                      {totalPaye} DH
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell
                      colSpan={1}
                      className="text-xl text-gray-900 p-2 text-right font-extrabold"
                    >
                      Reste à payer :
                    </TableCell>
                    <TableCell className="border-l border-black p-2 text-xl text-gray-900 text-left font-extrabold">
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
        <LoadingHistoriquePaiements />
      )}
    </>
  );
}
