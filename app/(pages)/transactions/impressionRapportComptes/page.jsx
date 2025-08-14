"use client";
import { EnteteDevis } from "@/components/Entete-devis";
import { DirectPrintButton } from "@/components/ui/print-button";
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

export default function ImpressionRapport() {
  const [data, setData] = useState();

  useEffect(() => {
    const storedData = localStorage.getItem("transaction-rapport");
    if (storedData) {
      setData(JSON.parse(storedData));
      console.log("transaction-rapport", JSON.parse(storedData));
    }
  }, []);

  const typeLabel = type => {
    if (type === "recette") {
      return "Recette";
    } else if (type === "depense") {
      return "Dépense";
    } else if (type === "vider") {
      return "Vider la caisse";
    }
    return type;
  };

  function ajouterUneHeure(from) {
    // Si "from" est déjà un objet Date, on l'utilise directement
    const date =
      from instanceof Date ? new Date(from) : new Date(String(from).trim());

    if (isNaN(date.getTime())) {
      throw new Error(`Date invalide : ${from}`);
    }

    date.setHours(date.getHours() + 1);
    return date.toISOString();
  }

  const soldeColor = solde => {
    if (solde > 0) {
      return "text-green-500";
    } else if (solde < 0) {
      return "text-rose-600";
    }
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
            <div className="grid grid-cols-2 items-center mb-4">
              <div className="flex gap-2 items-center">
                <h3 className="mb-1 font-semibold text-gray-900">Compte :</h3>
                <p className="text-sm text-gray-600">{data?.compte}</p>
              </div>
              <div className="flex gap-2 items-center">
                <h3 className="mb-1 font-semibold text-gray-900">Période :</h3>
                <p className="text-sm text-gray-600">
                  {data?.from ? formatDate(ajouterUneHeure(data.from)) : "—"} •{" "}
                  {data?.to ? formatDate(data.to) : "—"}
                </p>
              </div>
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
                  {data?.transactions?.map(t => (
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
                      className={`text-right text-lg font-semibold p-2 ${soldeColor(
                        data?.totalTransactions
                      )}`}
                    >
                      Total des transactions :
                    </TableCell>
                    <TableCell
                      colSpan={2}
                      className={`text-left text-lg font-semibold p-2 ${soldeColor(
                        data?.totalTransactions
                      )}`}
                    >
                      {formatCurrency(data?.totalTransactions)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className={`text-right text-lg font-semibold p-2 ${soldeColor(
                        data?.soldeActuel
                      )}`}
                    >
                      Solde actuel:
                    </TableCell>
                    <TableCell
                      colSpan={2}
                      className={`text-left text-lg font-semibold p-2 ${soldeColor(
                        data?.soldeActuel
                      )}`}
                    >
                      {formatCurrency(data?.soldeActuel)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        </div>
        <div
          className="flex items-center justify-end 
print:hidden mt-5"
        >
          <DirectPrintButton className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full">
            Imprimer
          </DirectPrintButton>
        </div>
      </div>
    </>
  );
}
