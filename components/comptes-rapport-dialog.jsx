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
        color: "bg-emerald-100 text-emerald-600 font-medium",
      };
    } else if (t === "depense") {
      return {
        lable: "Dépense",
        color: "bg-rose-50 text-rose-600 font-medium",
      };
    } else if (t === "vider" || t === "transfert") {
      return {
        lable:
          t === "transfert"
            ? "Versement vers le compte pro"
            : "Vider la caisse",
        color: "bg-sky-100 text-sky-600 font-medium",
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
        } else if (t.type === "vider" || t.type === "transfert") {
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
        } else if (t.type === "vider" || t.type === "transfert") {
          return acc + t.montant;
        }
      }, 0);
    }
  };

  const soldeColor = solde => {
    if (solde > 0) {
      return "text-green-600";
    } else if (solde < 0) {
      return "text-rose-600";
    }
  };

  // Fonction pour grouper les transactions par type
  const groupTransactionsByType = transactions => {
    if (!transactions || transactions.length === 0) return [];

    const grouped = transactions.reduce((acc, transaction) => {
      const type = transaction.type || "inconnu";
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(transaction);
      return acc;
    }, {});

    return Object.entries(grouped).map(([type, transactions]) => ({
      type,
      transactions,
      total: transactions.reduce((sum, transaction) => {
        if (type === "recette") {
          return sum + transaction.montant;
        } else if (
          type === "depense" ||
          type === "vider" ||
          type === "transfert"
        ) {
          return sum - transaction.montant;
        }
        return sum;
      }, 0),
    }));
  };

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open]);

  const soldeActuel = () => {
    return Data?.comptes.find(c => c.compte === compte).solde;
  };

  const soldeInitial = () => {
    return soldeActuel() - solde();
  };

  // Fonction pour calculer les totaux et le solde
  const calculateTotals = transactions => {
    if (!transactions || transactions.length === 0)
      return { totalRecettes: 0, totalDepenses: 0, solde: 0 };

    const totals = transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === "recette") {
          acc.totalRecettes += transaction.montant;
        } else if (
          transaction.type === "depense" ||
          transaction.type === "vider" ||
          transaction.type === "transfert"
        ) {
          acc.totalDepenses += transaction.montant;
        }
        return acc;
      },
      { totalRecettes: 0, totalDepenses: 0 }
    );

    totals.solde = totals.totalRecettes - totals.totalDepenses;
    return totals;
  };

  // Fonction pour trier les transactions par date et calculer le solde cumulé
  const sortTransactionsWithBalance = transactions => {
    if (!transactions || transactions.length === 0) return [];

    const sorted = [...transactions].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt);
      const dateB = new Date(b.date || b.createdAt);
      return dateA - dateB;
    });

    // Commencer avec le solde initial
    let runningBalance = soldeInitial() || 0;
    return sorted.map(transaction => {
      if (transaction.type === "recette") {
        runningBalance += transaction.montant;
      } else if (
        transaction.type === "depense" ||
        transaction.type === "vider" ||
        transaction.type === "transfert"
      ) {
        runningBalance -= transaction.montant;
      }
      return { ...transaction, runningBalance };
    });
  };

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
            <div className="grid grid-cols-2 items-center mb-4 print-block">
              <div className="flex flex-row gap-2 items-center">
                <h3 className="font-semibold text-gray-900">
                  Compte :{" "}
                  <span className="text-sm text-gray-600">{compte}</span>
                </h3>
              </div>
              <div className="flex flex-row gap-2 items-center">
                <h3 className="font-semibold text-gray-900">
                  Période :{" "}
                  <span className="text-sm text-gray-600">{periode} </span>
                </h3>
              </div>
            </div>
            {/* Section de résumé */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6 print-block">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">
                    Total Des Recettes
                  </h3>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(
                      calculateTotals(Data?.transactions).totalRecettes
                    )}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">
                    Total Des Dépenses
                  </h3>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(
                      calculateTotals(Data?.transactions).totalDepenses
                    )}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">
                    Solde
                  </h3>
                  <p
                    className={`text-lg font-bold ${soldeColor(soldeActuel())}`}
                  >
                    {formatCurrency(soldeActuel())}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border overflow-x-auto mb-3">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="border-r border-b">Date</TableHead>
                    <TableHead className="w-[15rem] border-r border-b">
                      Désignation
                    </TableHead>
                    <TableHead className="text-right border-r border-b">
                      MNT Recettes
                    </TableHead>
                    <TableHead className="text-right border-r border-b">
                      MNT Dépenses
                    </TableHead>
                    <TableHead className="text-right border-b">Solde</TableHead>
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
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                        <TableCell className="!py-2" align="left">
                          <Skeleton className="h-4 w-[150px]" />
                        </TableCell>
                        <TableCell className="!py-2" align="right">
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                        <TableCell className="!py-2" align="right">
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                        <TableCell className="!py-2" align="right">
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : Data?.transactions?.length > 0 ? (
                    <>
                      {/* Solde initial */}
                      <TableRow className="bg-gray-700 text-white hover:!bg-gray-700 hover:!text-white border-b">
                        <TableCell className="px-1 py-2 font-semibold border-r">
                          SOLDE INITIAL
                        </TableCell>
                        <TableCell className="px-1 py-2 w-[15rem] border-r"></TableCell>
                        <TableCell className="px-1 py-2 text-right pr-4 border-r"></TableCell>
                        <TableCell className="px-1 py-2 text-right pr-4 border-r"></TableCell>
                        <TableCell
                          className={`px-1 py-2 text-right pr-4 font-semibold`}
                        >
                          {formatCurrency(soldeInitial() || 0)}
                        </TableCell>
                      </TableRow>
                      {/* Transactions */}
                      {sortTransactionsWithBalance(Data.transactions).map(
                        transaction => (
                          <TableRow key={transaction.id} className="border-b">
                            <TableCell className="px-1 py-2 border-r">
                              {formatDate(transaction.date) ||
                                formatDate(transaction.createdAt)}
                            </TableCell>
                            <TableCell className="px-1 py-2 border-r">
                              {transaction.type === "vider"
                                ? "Vider la caisse"
                                : transaction.type === "transfert"
                                  ? "Versement vers le compte pro"
                                  : transaction.description === ""
                                    ? transaction.lable
                                    : transaction.description}
                            </TableCell>
                            <TableCell className="px-1 py-2 text-right pr-4 border-r">
                              {transaction.type === "recette"
                                ? formatCurrency(transaction.montant)
                                : ""}
                            </TableCell>
                            <TableCell className="px-1 py-2 text-right pr-4 border-r">
                              {transaction.type === "depense" ||
                              transaction.type === "vider" ||
                              transaction.type === "transfert"
                                ? formatCurrency(transaction.montant)
                                : ""}
                            </TableCell>
                            <TableCell
                              className={`px-1 py-2 text-right pr-4 font-semibold ${soldeColor(
                                transaction.runningBalance
                              )}`}
                            >
                              {formatCurrency(transaction.runningBalance)}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Aucune transaction trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter className="bg-gray-50">
                  <TableRow className="border-b">
                    <TableCell className="text-lg font-semibold p-2 border-r">
                      Total :
                    </TableCell>
                    <TableCell className="p-2 border-r"></TableCell>
                    <TableCell className="text-right text-lg font-semibold p-2 text-green-600 border-r">
                      {formatCurrency(
                        calculateTotals(Data?.transactions).totalRecettes
                      )}
                    </TableCell>
                    <TableCell className="text-right text-lg font-semibold p-2 text-red-600 border-r">
                      {formatCurrency(
                        calculateTotals(Data?.transactions).totalDepenses
                      )}
                    </TableCell>
                    <TableCell className="p-2"></TableCell>
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
                    soldeInitial: soldeInitial(),
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
