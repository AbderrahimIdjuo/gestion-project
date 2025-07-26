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
import { useState  , useEffect} from "react";
function formatDate(dateString) {
  return dateString?.split("T")[0]?.split("-")?.reverse()?.join("-");
}

export default function ImpressionTransactions() {
  const [params, setParams] = useState();

  useEffect(() => {
    const storedData = localStorage.getItem("params");
    if (storedData) {
      setParams(JSON.parse(storedData));
      console.log("params", JSON.parse(storedData));
    }
  }, []);

  const { data: transactions } = useQuery({
    queryKey: ["transactions-impression", params],
    queryFn: async () => {
      const response = await axios.get("/api/tresorie/impression", {
        params,
      });
      return response.data.transactions;
    },
  });

  const handlePrint = () => {
    window.print();
  };
  const total = () => {
    return transactions?.reduce((acc, t) => {
      if (t.type === "recette") {
        return acc + t.montant;
      } else if (t.type === "depense") {
        return acc - t.montant;
      }
    }, 0);
  };

  return (
    <>
      {/* <div className="p-8 print:p-0">
        <h1 className="text-2xl font-bold mb-4">Transactions à Imprimer</h1>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Date</th>
              <th className="border border-gray-300 p-2">Label</th>
              <th className="border border-gray-300 p-2">Montant</th>
              <th className="border border-gray-300 p-2">Type</th>
              <th className="border border-gray-300 p-2">Méthode</th>
              <th className="border border-gray-300 p-2">Compte</th>
              <th className="border border-gray-300 p-2">Description</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center p-4">
                  Chargement...
                </td>
              </tr>
            ) : transactions?.length > 0 ? (
              transactions.map((t) => (
                <tr key={t.id}>
                  <td className="border border-gray-300 p-2">
                    {formatDate(t.date) || formatDate(t.createdAt)}
                  </td>
                  <td className="border border-gray-300 p-2">{t.lable}</td>
                  <td className="border border-gray-300 p-2">{t.montant} DH</td>
                  <td className="border border-gray-300 p-2">{t.type}</td>
                  <td className="border border-gray-300 p-2">
                    {t.methodePaiement === "espece"
                      ? "Espèce"
                      : t.methodePaiement === "cheque"
                      ? "Chèque"
                      : t.methodePaiement}
                  </td>
                  <td className="border border-gray-300 p-2">{t.compte}</td>
                  <td className="border border-gray-300 p-2">
                    {t.description}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center p-4">
                  Aucune transaction trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div> */}
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
                  {transactions?.map((t) => (
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
                        {t.type === "depense" ? "Dépense" : "Recette"}
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
                      {total()} DH
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
