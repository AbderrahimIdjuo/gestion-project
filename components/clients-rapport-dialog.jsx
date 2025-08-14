"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/functions";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { FileText, Printer } from "lucide-react";
import { useState } from "react";

export default function ClientsRapportDialog() {
  const [open, setOpen] = useState(false);

  const { data: devis } = useQuery({
    queryKey: ["clients-rapport"],
    queryFn: async () => {
      const response = await axios.get("/api/clients/rapport");
      console.log("devis rapport", response.data.devis);
      return response.data.devis;
    },
  });
  function regrouperDevisParClientEnTableau(devisList) {
    if (!Array.isArray(devisList)) {
      console.error("❌ devisList n'est pas un tableau :", devisList);
      return [];
    }

    const clientsMap = {};

    devisList.forEach(devis => {
      const nomClient = devis.client?.nom || "Client inconnu";

      if (!clientsMap[nomClient]) {
        clientsMap[nomClient] = {
          nom: nomClient,
          devis: [],
          totalRestePaye: 0,
        };
      }

      const restePaye = devis.total - devis.totalPaye;
      if (restePaye > 0) {
        clientsMap[nomClient].devis.push({
          numero: devis.numero,
          total: devis.total,
          totalPaye: devis.totalPaye,
          restePaye,
        });
      }
      clientsMap[nomClient].totalRestePaye += restePaye;
    });

    return Object.values(clientsMap);
  }

  const creditTotal = regrouperDevisParClientEnTableau(devis).reduce(
    (acc, client) => acc + client.totalRestePaye,
    0
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 rounded-full">
          <FileText className="mr-2 h-4 w-4" />
          Rapport
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-fuchsia-600 to-violet-600 bg-clip-text text-transparent">
            <FileText className="h-5 w-5 text-purple-600" />
            Crédits des clients
          </DialogTitle>
        </DialogHeader>
        <div>
          <div className="rounded-xl border shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Numéro devis</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Montant payé</TableHead>
                  <TableHead className="text-right">Reste à payer</TableHead>
                  <TableHead className="text-center">Crédit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regrouperDevisParClientEnTableau(devis).map(client =>
                  client.devis.map((devis, index) => (
                    <TableRow key={`${client.nom}-${devis.numero}`}>
                      {index === 0 && (
                        <TableCell
                          rowSpan={client.devis.length}
                          className="font-semibold text-lg border-r"
                        >
                          {client.nom}
                        </TableCell>
                      )}
                      <TableCell>{devis.numero}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(devis.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(devis.totalPaye)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(devis.restePaye)}
                      </TableCell>
                      {index === 0 && (
                        <TableCell
                          rowSpan={client.devis.length}
                          className="font-semibold text-rose-600 text-lg text-center border-l"
                        >
                          {formatCurrency(client.totalRestePaye)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-right text-rose-600 text-xl font-bold"
                  >
                    Total des crédits :
                  </TableCell>
                  <TableCell
                    colSpan={1}
                    className="text-left text-xl text-rose-600 font-bold"
                  >
                    {formatCurrency(creditTotal)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
          <div className="flex justify-end gap-3 mt-6 print:hidden">
            <Button
              className="rounded-full"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              fermer
            </Button>

            <Button
              className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
              variant="outline"
              onClick={() => {
                const data = regrouperDevisParClientEnTableau(devis);
                window.open(`/clients/imprimer-rapport`, "_blank");
                localStorage.setItem("clients-rapport", JSON.stringify(data));
              }}
            >
              <Printer className="mr-2 h-4 w-4" /> Imprimer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
