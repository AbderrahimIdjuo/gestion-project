"use client";
import CompteBancairesSelectMenu from "@/components/compteBancairesSelectMenu";
import PeriodeFilter from "@/components/customUi/periode-filter";
import { RapportEntete } from "@/components/rapport-entete";
import TransactionsChronologicalTable from "@/components/transactions-chronological-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  calculateCompteRapportTotals,
  calculateTransactionsTypeTotals,
  formatCurrency,
  formatDate,
  getCompteRapportDesignation,
  isCompteCaisse,
  isCompteRapportDepenseCell,
  isCompteRapportRecette,
  periodNetChange,
  sortCompteRapportTransactions,
} from "@/lib/functions";
import { getDateRangeFromPeriode, getPeriodeLabel } from "@/lib/periode";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";

export default function ComptesRapportContent({
  embedded = false,
  onBack = undefined,
  onClose = undefined,
}) {
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

  const { from, to } = getDateRangeFromPeriode(periode, startDate, endDate);
  const { data: Data, isLoading } = useQuery({
    queryKey: ["transactions-rapport", compte, periode, startDate, endDate],
    queryFn: async () => {
      const response = await axios.get("/api/tresorie/rapport", {
        params: {
          compte,
          from: from?.toISOString() ?? null,
          to: to?.toISOString() ?? null,
        },
      });
      return response.data;
    },
    keepPreviousData: true,
    enabled: currentStep === 2,
  });

  const solde = () => periodNetChange(Data?.transactions, compte);

  const soldeColor = soldeValue => {
    if (soldeValue > 0) {
      return "text-green-600";
    } else if (soldeValue < 0) {
      return "text-rose-600";
    }
  };

  useEffect(() => {
    if (!embedded && !open) {
      reset();
    }
  }, [open, embedded]);

  const soldeActuel = () => {
    return Data?.comptes.find(c => c.compte === compte)?.solde;
  };

  const soldeInitial = () => {
    return soldeActuel() - solde();
  };

  const isAllComptes = compte === "all";
  const totals = calculateCompteRapportTotals(Data?.transactions, compte);
  const typeTotals = calculateTransactionsTypeTotals(Data?.transactions);

  const canCreate =
    !!compte &&
    !!periode &&
    (periode !== "personnalisee" || (!!startDate && !!endDate));

  const handleCancel = () => {
    if (embedded && onClose) {
      onClose();
    } else {
      setOpen(false);
      reset();
    }
  };

  const content = (
    <>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <CompteBancairesSelectMenu
                compte={compte}
                setCompte={setCompte}
              />
            </div>
            <PeriodeFilter
              periode={periode}
              onPeriodeChange={setPeriode}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              includeToutes={false}
              id="periode-comptes-rapport"
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
              disabled={!canCreate}
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
          <RapportEntete
            leftLabel="Compte"
            leftValue={isAllComptes ? "Tous les comptes" : compte}
            rightValue={getPeriodeLabel(periode)}
            stats={
              isAllComptes
                ? [
                    {
                      label: "Total Des Recettes",
                      value: formatCurrency(typeTotals.totalRecettes),
                      valueClassName: "text-green-600",
                    },
                    {
                      label: "Total Des Dépenses",
                      value: formatCurrency(typeTotals.totalDepenses),
                      valueClassName: "text-red-600",
                    },
                    {
                      label: "Total Vider la caisse",
                      value: formatCurrency(typeTotals.totalVider),
                      valueClassName: "text-blue-600",
                    },
                    {
                      label: "Total Des Transferts",
                      value: formatCurrency(typeTotals.totalTransferts),
                      valueClassName: "text-blue-600",
                    },
                    {
                      label: "Total",
                      value: formatCurrency(typeTotals.total),
                      valueClassName: soldeColor(typeTotals.total),
                    },
                  ]
                : [
                    {
                      label: "Total Des Recettes",
                      value: formatCurrency(totals.totalRecettes),
                      valueClassName: "text-green-600",
                    },
                    {
                      label: "Total Des Transferts",
                      value: isCompteCaisse(compte) ? (
                        formatCurrency(totals.totalTransferts)
                      ) : (
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-green-600">
                            Entrant :{" "}
                            {formatCurrency(totals.totalTransfertsEntrants)}
                          </p>
                          <p className="text-sm font-bold text-red-600">
                            Sortant :{" "}
                            {formatCurrency(totals.totalTransfertsSortants)}
                          </p>
                        </div>
                      ),
                      valueClassName: isCompteCaisse(compte)
                        ? "text-blue-600"
                        : undefined,
                    },
                    {
                      label: "Total Des Dépenses",
                      value: formatCurrency(totals.totalDepenses),
                      valueClassName: "text-red-600",
                    },
                    {
                      label: "Solde",
                      value: formatCurrency(soldeActuel()),
                      valueClassName: soldeColor(soldeActuel()),
                    },
                  ]
            }
          />
          {isAllComptes ? (
            <>
              <TransactionsChronologicalTable
                transactions={Data?.transactions}
                isLoading={isLoading}
                totals={typeTotals}
              />
            </>
          ) : (
            <>
          <div className="rounded-lg border overflow-x-auto mb-3">
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="border-r border-b">Date</TableHead>
                  <TableHead className="w-[15rem] border-r border-b">
                    Désignation
                  </TableHead>
                  <TableHead className="text-right border-r border-b">
                    MNT Entrant
                  </TableHead>
                  <TableHead className="text-right border-r border-b">
                    Montant Sortant
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
                    {sortCompteRapportTransactions(
                      Data.transactions,
                      soldeInitial() || 0,
                      compte
                    ).map(transaction => (
                        <TableRow key={transaction.id} className="border-b">
                          <TableCell className="px-1 py-2 border-r">
                            {formatDate(transaction.date) ||
                              formatDate(transaction.createdAt)}
                          </TableCell>
                          <TableCell className="px-1 py-2 border-r">
                            {getCompteRapportDesignation(transaction, compte)}
                          </TableCell>
                          <TableCell className="px-1 py-2 text-right pr-4 border-r">
                            {isCompteRapportRecette(transaction, compte)
                              ? formatCurrency(transaction.montant)
                              : ""}
                          </TableCell>
                          <TableCell className="px-1 py-2 text-right pr-4 border-r">
                            {isCompteRapportDepenseCell(transaction, compte)
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
                      ))}
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
                    {formatCurrency(totals.totalEntrant)}
                  </TableCell>
                  <TableCell className="text-right text-lg font-semibold p-2 text-red-600 border-r">
                    {formatCurrency(totals.totalSortant)}
                  </TableCell>
                  <TableCell className="p-2"></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
            </>
          )}
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
                const data = isAllComptes
                  ? {
                      transactions: Data?.transactions,
                      compte,
                      from,
                      to,
                    }
                  : {
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
          Rapport comptes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] max-h-[80vh] overflow-y-auto">
        {content}
      </DialogContent>
    </Dialog>
  );
}
