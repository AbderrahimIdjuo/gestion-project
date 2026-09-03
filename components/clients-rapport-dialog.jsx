"use client";

import PeriodeFilter from "@/components/customUi/periode-filter";
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
import { RapportEntete } from "@/components/rapport-entete";
import { formatCurrency, formatDate } from "@/lib/functions";
import { getDateRangeFromPeriode, getPeriodeLabel } from "@/lib/periode";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { FileText, Printer } from "lucide-react";
import { useEffect, useState } from "react";

// Composant pour afficher les détails des transactions
function TransactionsDetails({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return <div className="text-center text-gray-500 text-sm"></div>;
  }

  return (
    <div className="bg-white border-gray-200">
      {/* Corps du tableau */}
      <div>
        {transactions.map((transaction, index) => (
          <div
            key={index}
            className={`grid grid-cols-2 gap-2 px-3 py-2 text-xs border-b border-gray-200 last:border-b-0 bg-white`}
          >
            <div className="space-y-1  border-gray-200 pr-2">
              <div className="font-medium text-gray-800">
                {format(new Date(transaction.date), "dd/MM/yy")}
              </div>
              <div className="text-gray-600 text-xs">
                {transaction.methodePaiement || "Non spécifié"}
              </div>
            </div>
            <div className="text-right pl-2 flex items-center justify-end">
              <div className="font-semibold text-green-600 ">
                {formatCurrency(transaction.montant)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ClientsRapportDialog({
  embedded = false,
  onBack = undefined,
  onClose = undefined,
}) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [periode, setPeriode] = useState();
  const [transactions, setTransactions] = useState();
  const { from, to } = getDateRangeFromPeriode(periode, startDate, endDate);
  const { data: devis } = useQuery({
    queryKey: ["clients-rapport", periode, startDate, endDate],
    queryFn: async () => {
      const response = await axios.get("/api/clients/rapport", {
        params: {
          from: from?.toISOString() ?? null,
          to: to?.toISOString() ?? null,
        },
      });
      console.log("devis rapport", response.data.devis);
      setTransactions(response.data.transactions);
      console.log("transactions rapport", response.data.transactions);
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
        // Filtrer les transactions pour ce devis
        const devisTransactions =
          transactions?.filter(
            transaction => transaction.reference === devis.numero
          ) || [];

        clientsMap[nomClient].devis.push({
          numero: devis.numero,
          total: devis.total,
          totalPaye: devis.totalPaye,
          restePaye,
          transactions: devisTransactions,
        });
      }

      clientsMap[nomClient].totalRestePaye += restePaye;
    });

    return Object.values(clientsMap);
  }

  const reset = () => {
    setCurrentStep(1);
    setStartDate(null);
    setEndDate(null);
    setPeriode();
  };
  useEffect(() => {
    if (!embedded && !open) {
      reset();
    }
  }, [open, embedded]);

  const handleCancel = () => {
    if (embedded && onClose) {
      onClose();
    } else {
      setOpen(false);
      reset();
    }
  };
  // Fonction pour calculer les totaux des montants payés et restes à payer
  function calculerTotaux(devisList) {
    if (!Array.isArray(devisList)) {
      return { totalMontantPaye: 0, totalResteAPayer: 0, totalGeneral: 0 };
    }

    return devisList.reduce(
      (acc, devis) => {
        acc.totalMontantPaye += devis.totalPaye || 0;
        acc.totalResteAPayer += (devis.total || 0) - (devis.totalPaye || 0);
        acc.totalGeneral += devis.total || 0;
        return acc;
      },
      { totalMontantPaye: 0, totalResteAPayer: 0, totalGeneral: 0 }
    );
  }

  const totaux = calculerTotaux(devis);

  const content = (
    <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-fuchsia-600 to-violet-600 bg-clip-text text-transparent">
            <FileText className="h-5 w-5 text-purple-600" />
            Crédits des clients
          </DialogTitle>
        </DialogHeader>
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2  gap-4 ">
              <PeriodeFilter
              periode={periode}
              onPeriodeChange={setPeriode}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              includeToutes={false}
              id="periode-clients-rapport"
            />
            </div>

            <div className="flex justify-end gap-3 mt-6 print:hidden">
              {embedded && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="rounded-full"
                >
                  Retour
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="rounded-full"
              >
                Annuler
              </Button>
              <Button
                className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
                variant="outline"
                onClick={() => {
                  setCurrentStep(2);
                }}
                type="submit"
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
        {currentStep === 2 && (
          <div>
            <RapportEntete
              rightValue={
                from && to
                  ? `${formatDate(from?.toISOString?.() ?? from)} • ${formatDate(
                      to?.toISOString?.() ?? to
                    )}`
                  : getPeriodeLabel(periode)
              }
              stats={[
                {
                  label: "Total général",
                  value: formatCurrency(totaux.totalGeneral),
                  valueClassName: "text-sky-600",
                },
                {
                  label: "Total payé",
                  value: formatCurrency(totaux.totalMontantPaye),
                  valueClassName: "text-emerald-600",
                },
                {
                  label: "Total des crédits",
                  value: formatCurrency(totaux.totalResteAPayer),
                  valueClassName: "text-rose-600",
                },
              ]}
            />
            <div className="rounded-xl border shadow-sm overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Numéro devis</TableHead>
                    <TableHead className="text-right border-l">Total</TableHead>
                    <TableHead className="text-center border-l">
                      Paiements
                    </TableHead>
                    <TableHead className="text-right border-l">
                      Montant payé
                    </TableHead>
                    <TableHead className="text-right border-l">
                      Reste à payer
                    </TableHead>
                    <TableHead className="text-center border-l">
                      Crédit
                    </TableHead>
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
                            {client.nom.toUpperCase()}
                          </TableCell>
                        )}
                        <TableCell className="border-l">
                          {devis.numero}
                        </TableCell>
                        <TableCell className="text-right border-l">
                          {formatCurrency(devis.total)}
                        </TableCell>
                        <TableCell className="text-center p-0 border-l">
                          <TransactionsDetails
                            transactions={devis.transactions}
                          />
                        </TableCell>
                        <TableCell className="text-right border-l">
                          {formatCurrency(devis.totalPaye)}
                        </TableCell>
                        <TableCell className="text-right border-l">
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
                <TableFooter className="bg-white">
                  <TableRow className="border-t border-gray-200">
                    <TableCell
                      colSpan={5}
                      className="text-right text-sky-600 text-xl font-bold"
                    >
                      Total général :
                    </TableCell>
                    <TableCell
                      colSpan={2}
                      className="text-left text-xl text-sky-600 font-bold"
                    >
                      {formatCurrency(totaux.totalGeneral)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-t border-gray-200">
                    <TableCell
                      colSpan={5}
                      className="text-right text-emerald-600 text-xl font-bold"
                    >
                      Total payé :
                    </TableCell>
                    <TableCell
                      colSpan={2}
                      className="text-left text-xl text-emerald-600 font-bold"
                    >
                      {formatCurrency(totaux.totalMontantPaye)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-t border-gray-200">
                    <TableCell
                      colSpan={5}
                      className="text-right text-rose-600 text-xl font-bold"
                    >
                      Total des crédits :
                    </TableCell>
                    <TableCell
                      colSpan={2}
                      className="text-left text-xl text-rose-600 font-bold"
                    >
                      {formatCurrency(totaux.totalResteAPayer)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            <div className="flex justify-end gap-3 mt-6 print:hidden">
              <Button
                className="rounded-full"
                variant="outline"
                onClick={handleCancel}
              >
                fermer
              </Button>

              <Button
                className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
                variant="outline"
                onClick={() => {
                  const data = {
                    devis: regrouperDevisParClientEnTableau(devis),
                    totalGeneral: totaux.totalGeneral,
                    totalMontantPaye: totaux.totalMontantPaye,
                    totalResteAPayer: totaux.totalResteAPayer,
                    transactions: transactions,
                    from,
                    to,
                  };
                  localStorage.setItem("clients-rapport", JSON.stringify(data));
                  window.open(`/clients/imprimer-rapport`, "_blank");
                }}
              >
                <Printer className="mr-2 h-4 w-4" /> Imprimer
              </Button>
            </div>
          </div>
        )}
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 rounded-full">
          <FileText className="mr-2 h-4 w-4" />
          Rapport
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] max-h-[80vh] overflow-y-auto">
        {content}
      </DialogContent>
    </Dialog>
  );
}
