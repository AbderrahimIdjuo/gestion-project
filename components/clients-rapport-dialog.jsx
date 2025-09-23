"use client";

import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subQuarters,
  subYears,
} from "date-fns";
import { FileText, Printer } from "lucide-react";
import { useEffect, useState } from "react";

export default function ClientsRapportDialog() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [periode, setPeriode] = useState();
  function getDateRangeFromPeriode(periode) {
    const now = new Date();

    switch (periode) {
      case "aujourd'hui":
        return {
          from: startOfDay(now),
          to: endOfDay(now),
        };
      case "ce-mois":
        return {
          from: startOfMonth(now),
          to: endOfMonth(now),
        };
      case "mois-dernier":
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return {
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        };
      case "trimestre-actuel":
        return {
          from: startOfQuarter(now),
          to: endOfQuarter(now),
        };
      case "trimestre-precedent":
        const prevQuarter = subQuarters(now, 1);
        return {
          from: startOfQuarter(prevQuarter),
          to: endOfQuarter(prevQuarter),
        };
      case "cette-annee":
        return {
          from: startOfYear(now),
          to: endOfYear(now),
        };
      case "annee-derniere":
        const lastYear = subYears(now, 1);
        return {
          from: startOfYear(lastYear),
          to: endOfYear(lastYear),
        };
      case "personnalisee":
        return {
          from: startDate ? new Date(startDate) : null,
          to: endDate ? new Date(endDate) : null,
        };
      default:
        return {
          from: null,
          to: null,
        };
    }
  }
  const { from, to } = getDateRangeFromPeriode(periode);
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

  const reset = () => {
    setCurrentStep(1);
    setStartDate(null);
    setEndDate(null);
    setPeriode();
  };
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open]);
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
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2  gap-4 ">
              <div className="space-y-2">
                <Label htmlFor="periode" className="text-sm font-medium">
                  Période
                </Label>
                <Select
                  value={periode}
                  onValueChange={value => setPeriode(value)}
                >
                  <SelectTrigger className="focus:ring-2 focus:ring-purple-500">
                    <SelectValue placeholder="Sélectionnez la période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aujourd'hui">
                      Aujourd&apos;hui
                    </SelectItem>
                    <SelectItem value="ce-mois">Ce mois</SelectItem>
                    <SelectItem value="mois-dernier">
                      Le mois dernier
                    </SelectItem>
                    <SelectItem value="trimestre-actuel">
                      Trimestre actuel
                    </SelectItem>
                    <SelectItem value="trimestre-precedent">
                      Trimestre précédent
                    </SelectItem>
                    <SelectItem value="cette-annee">Cette année</SelectItem>
                    <SelectItem value="annee-derniere">
                      L&apos;année dernière
                    </SelectItem>
                    <SelectItem value="personnalisee">
                      Période personnalisée
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {periode === "personnalisee" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="statut"
                    className="col-span-1 text-left text-black"
                  >
                    Date :
                  </Label>

                  <CustomDateRangePicker
                    startDate={startDate}
                    setStartDate={setStartDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 print:hidden">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                }}
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
                            {client.nom.toUpperCase()}
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
                <TableFooter className="bg-white">
                  <TableRow className="border-t border-gray-200">
                    <TableCell
                      colSpan={4}
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
                      colSpan={4}
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
                      colSpan={4}
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
                onClick={() => setOpen(false)}
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
                    from,
                    to,
                  };
                  window.open(`/clients/imprimer-rapport`, "_blank");
                  localStorage.setItem("clients-rapport", JSON.stringify(data));
                }}
              >
                <Printer className="mr-2 h-4 w-4" /> Imprimer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
