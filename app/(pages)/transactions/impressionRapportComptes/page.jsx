"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
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
import { useState, useEffect } from "react";
function formatDate(dateString) {
  return dateString?.split("T")[0]?.split("-")?.reverse()?.join("-");
}

export default function ImpressionRapport() {
  const [data, setData] = useState();

  useEffect(() => {
    const storedData = localStorage.getItem("transaction-rapport");
    if (storedData) {
      setData(JSON.parse(storedData));
      console.log("transaction-rapport", JSON.parse(storedData));
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };
  const typeLabel = (type) => {
    if (type === "recette") {
      return "Recette";
    } else if (type === "depense") {
      return "Dépense";
    } else if (type === "vider") {
      return "Vider la caisse";
    }
    return type;
  };
  return (
    <>
      <div className="container mx-auto p-8 w-[90vw] bg-white min-h-screen print:p-0 print:max-w-none mb-10">
        {/* Document Content */}
        <div id="print-area" className="space-y-3">
          {/* Header */}
          <EnteteDevis />

          <div className="flex justify-between gap-8"></div>
          <div className="space-y-6">
            <div className="flex justify-between items-center ">
              <h1 className="text-3xl font-bold">Transactions</h1>
            </div>
            <div className="rounded-xl border shadow-sm overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Compte</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.transactions?.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="px-1 py-2">
                        {" "}
                        {formatDate(t.date) || formatDate(t.createdAt)}
                      </TableCell>
                      <TableCell className="px-1 py-2">{t.lable}</TableCell>
                      <TableCell className="px-1 py-2">
                        {t.montant} DH
                      </TableCell>
                      <TableCell className="px-1 py-2">
                        {typeLabel(t.type)}
                      </TableCell>
                      <TableCell className="px-1 py-2">
                        {" "}
                        {t.methodePaiement === "espece"
                          ? "Espèce"
                          : t.methodePaiement === "cheque"
                          ? "Chèque"
                          : t.methodePaiement}
                      </TableCell>
                      <TableCell className="px-1 py-2">
                        {t.compte.replace("compte", "")}
                      </TableCell>
                      <TableCell className="px-1 py-2">
                        {t.description.replace(
                          "paiement du fournisseur",
                          "Bénéficiaire : "
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="bg-none">
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-right text-lg font-semibold p-2"
                    >
                      Total :
                    </TableCell>
                    <TableCell
                      colSpan={2}
                      className="text-left text-lg font-semibold p-2"
                    >
                      {data?.solde} DH
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        </div>
        <div
          className="flex items-center justify-end print:hidden
print:hidden mt-5"
        >
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
