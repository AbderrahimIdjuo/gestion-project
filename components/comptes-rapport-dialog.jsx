"use client";

import CompteBancairesSelectMenu from "@/components/compteBancairesSelectMenu";
import CustomDateRangePicker from "@/components/customUi/customDateRangePicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Skeleton } from "@/components/ui/skeleton";
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
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";

export default function ComptesRapportDialog() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [compte, setCompte] = useState();
  const [periode, setPeriode] = useState();
  const reset = () => {
    setCompte("");
    setPeriode("");
    setStartDate("");
    setEndDate("");
    setCurrentStep(1);
  };
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
  const { data: Data, isLoading } = useQuery({
    queryKey: ["transactions-rapport", compte, periode, startDate, endDate],
    queryFn: async () => {
      console.log("from", from?.toISOString(), "to", to?.toISOString());

      const response = await axios.get("/api/tresorie/rapport", {
        params: {
          compte,
          from: from?.toISOString() ?? null,
          to: to?.toISOString() ?? null,
        },
      });
      console.log("caisse rapport transactions:  ", response.data.transactions);
      console.log("comptes Bancaires:  ", response.data.comptes);

      return response.data;
    },
    keepPreviousData: true, // Keeps old data visible while fetching new page
    enabled: currentStep === 2,
  });

  const handleTypeLableColor = t => {
    if (t === "recette") {
      return {
        lable: "Recette",
        color: "bg-green-100 text-green-600 font-medium",
      };
    } else if (t === "depense") {
      return { lable: "Dépense", color: "bg-red-100 text-red-600 font-medium" };
    } else if (t === "vider") {
      return {
        lable: "Vider la caisse",
        color: "bg-blue-100 text-blue-600 font-medium",
      };
    } else {
      return {
        lable: "inconue",
        color: "bg-gray-100 text-gray-600 font-medium",
      };
    }
  };

  const solde = () => {
    if (compte === "caisse") {
      return Data?.transactions.reduce((acc, t) => {
        if (t.type === "recette") {
          return acc + t.montant;
        } else if (t.type === "depense") {
          return acc - t.montant;
        } else if (t.type === "vider") {
          return acc - t.montant;
        }
      }, 0);
    } else if (
      compte === "compte personnel" ||
      compte === "compte professionel"
    ) {
      return Data?.transactions.reduce((acc, t) => {
        if (t.type === "recette") {
          return acc + t.montant;
        } else if (t.type === "depense") {
          return acc - t.montant;
        } else if (t.type === "vider") {
          return acc + t.montant;
        }
      }, 0);
    }
  };

  const soldeColor = solde => {
    if (solde > 0) {
      return "text-green-500";
    } else if (solde < 0) {
      return "text-rose-600";
    }
  };
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open]);

  const soldeActuel = () => {
    return Data?.comptes.find(c => c.compte === compte).solde;
  };

  // const soldeInitial = () => {
  //   return soldeActuel() - solde();
  // };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 rounded-full">
          <FileText className="mr-2 h-4 w-4" />
          Rapport comptes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-fuchsia-600 to-violet-600 bg-clip-text text-transparent">
            <FileText className="h-5 w-5 text-purple-600" />
            {currentStep === 1
              ? "Créer un nouveau rapport"
              : "Aperçu du rapport"}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 1
              ? " Remplissez les informations ci-dessous pour créer votre rapport."
              : ""}
          </DialogDescription>
        </DialogHeader>
        {currentStep === 1 && (
          <div className="space-y-6">
            <div
              className={`grid grid-cols-2  gap-4 ${
                periode === "personnalisee" && "grid-cols-3"
              }`}
            >
              <div>
                <CompteBancairesSelectMenu
                  compte={compte}
                  setCompte={setCompte}
                />
              </div>
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
                  reset();
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
                Créer
              </Button>
            </div>
          </div>
        )}
        {currentStep === 2 && (
          <div>
            <div className="rounded-lg border overflow-x-auto mb-3">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead className="w-[150px]">Date</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Compte</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(10)].map((_, index) => (
                      <TableRow
                        className="h-[2rem] MuiTableRow-root"
                        role="checkbox"
                        tabIndex={-1}
                        key={index}
                      >
                        <TableCell
                          className="!py-2 text-sm md:text-base"
                          align="left"
                        >
                          <Skeleton className="h-4 w-[150px]" />
                        </TableCell>
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-[150px]" />
                        </TableCell>
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-[150px]" />
                        </TableCell>
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : Data?.transactions.length > 0 ? (
                    Data?.transactions.map((transaction, index) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium py-2">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium py-1">
                          {formatDate(transaction.date) ||
                            formatDate(transaction.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium py-2">
                          {transaction.lable}
                        </TableCell>
                        <TableCell className="font-medium py-2 text-right">
                          {formatCurrency(transaction.montant)}
                        </TableCell>
                        <TableCell className="font-medium py-2">
                          <span
                            className={`text-sm p-[1px] px-3 rounded-full  ${
                              handleTypeLableColor(transaction.type).color
                            }`}
                          >
                            {handleTypeLableColor(transaction.type).lable}
                          </span>
                        </TableCell>

                        <TableCell
                          onClick={() => handleChequeClick(transaction)}
                          className={`font-medium py-2 ${
                            transaction.methodePaiement === "cheque" &&
                            "cursor-pointer"
                          }`}
                        >
                          {transaction.methodePaiement === "espece"
                            ? "Espèce"
                            : transaction.methodePaiement === "cheque" &&
                              "Chèque"}
                        </TableCell>

                        <TableCell className="font-medium py-2">
                          {transaction.compte}
                        </TableCell>
                        <TableCell className="font-medium py-2">
                          {transaction.description}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        Aucune transaction trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter className="bg-none">
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className={`text-right text-lg font-semibold p-2 ${soldeColor(
                        solde()
                      )}`}
                    >
                      Total des transactions :
                    </TableCell>
                    <TableCell
                      colSpan={2}
                      className={`text-left text-lg font-semibold p-2 ${soldeColor(
                        solde()
                      )}`}
                    >
                      {formatCurrency(solde())}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className={`text-right text-lg font-semibold p-2 ${soldeColor(
                        soldeActuel()
                      )}`}
                    >
                      Solde actuel:
                    </TableCell>
                    <TableCell
                      colSpan={2}
                      className={`text-left text-lg font-semibold p-2 ${soldeColor(
                        soldeActuel()
                      )}`}
                    >
                      {formatCurrency(soldeActuel())}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            <div className="flex justify-end gap-3 mt-6 print:hidden">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCurrentStep(1);
                }}
                className="rounded-full"
              >
                Retour
              </Button>
              <Button
                className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
                variant="outline"
                onClick={() => {
                  const data = {
                    transactions: Data?.transactions,
                    solde: solde(),
                    compte,
                    from,
                    to,
                    totalTransactions: solde(),
                    soldeActuel: soldeActuel(),
                  };
                  localStorage.setItem(
                    "transaction-rapport",
                    JSON.stringify(data)
                  );
                  window.open(
                    "/transactions/impressionRapportComptes",
                    "_blank"
                  );
                }}
                type="submit"
              >
                Imprimer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
