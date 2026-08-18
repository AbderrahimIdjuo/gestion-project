"use client";
import ComptesRapportContent from "@/components/comptes-rapport-dialog";
import PeriodeFilter from "@/components/customUi/periode-filter";
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
import { formatCurrency, formatDate } from "@/lib/functions";
import { getDateRangeFromPeriode } from "@/lib/periode";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Building2, FileText, Landmark, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

const REPORT_TYPES = [
  {
    id: "comptes",
    title: "Rapport comptes",
    description: "Mouvements et solde par compte",
    icon: Landmark,
  },
  {
    id: "charges-fixes",
    title: "Charges fixes",
    description: "Rapport des charges fixes",
    icon: Building2,
  },
  {
    id: "charges-variantes",
    title: "Charges variantes",
    description: "Rapport des charges variantes",
    icon: Wallet,
  },
];

export function ChargesRapportContent({ typeDepense, onBack, onClose }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [periode, setPeriode] = useState();

  const { from, to } = getDateRangeFromPeriode(periode, startDate, endDate);
  const titre =
    typeDepense === "fixe"
      ? "Rapport des charges fixes"
      : "Rapport des charges variantes";

  const { data: Data, isLoading } = useQuery({
    queryKey: [
      "charges-rapport",
      typeDepense,
      periode,
      startDate,
      endDate,
    ],
    queryFn: async () => {
      const response = await axios.get("/api/tresorie/rapport", {
        params: {
          type: "depense",
          typeDepense,
          from: from?.toISOString() ?? null,
          to: to?.toISOString() ?? null,
        },
      });
      return response.data;
    },
    keepPreviousData: true,
    enabled: currentStep === 2,
  });

  const transactions = Data?.transactions ?? [];
  const totalMontant = transactions.reduce(
    (sum, t) => sum + (t.montant || 0),
    0
  );

  const methodeLabel = methode => {
    if (methode === "espece") return "Espèce";
    if (methode === "cheque") return "Chèque";
    if (methode === "versement") return "Versement";
    if (methode === "traite") return "Traite";
    return methode || "—";
  };

  const canCreate =
    periode &&
    (periode !== "personnalisee" || (startDate && endDate));

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-fuchsia-600 to-violet-600 bg-clip-text text-transparent">
          <FileText className="h-5 w-5 text-purple-600" />
          {currentStep === 1 ? titre : "Aperçu du rapport"}
        </DialogTitle>
        <DialogDescription>
          {currentStep === 1
            ? "Remplissez les informations ci-dessous pour créer votre rapport."
            : ""}
        </DialogDescription>
      </DialogHeader>

      {currentStep === 1 && (
        <div className="space-y-6">
          <PeriodeFilter
            periode={periode}
            onPeriodeChange={setPeriode}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            includeToutes={false}
            id="periode-charges-rapport"
          />

          <div className="flex justify-end gap-3 mt-6 print:hidden">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="rounded-full"
            >
              Retour
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-full"
            >
              Annuler
            </Button>
            <Button
              className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
              variant="outline"
              disabled={!canCreate}
              onClick={() => setCurrentStep(2)}
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
                Type :{" "}
                <span className="text-sm text-gray-600">
                  {typeDepense === "fixe"
                    ? "Charges fixes"
                    : "Charges variantes"}
                </span>
              </h3>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <h3 className="font-semibold text-gray-900">
                Période :{" "}
                <span className="text-sm text-gray-600">{periode}</span>
              </h3>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6 print-block">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">
                  Nombre de charges
                </h3>
                <p className="text-lg font-bold text-gray-900">
                  {transactions.length}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">
                  Montant total
                </h3>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(totalMontant)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border overflow-x-auto mb-3">
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="border-r border-b">Date</TableHead>
                  <TableHead className="border-r border-b">Label</TableHead>
                  <TableHead className="border-r border-b">
                    Description
                  </TableHead>
                  <TableHead className="border-r border-b">Compte</TableHead>
                  <TableHead className="border-r border-b">Méthode</TableHead>
                  <TableHead className="text-right border-b">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(8)].map((_, index) => (
                    <TableRow key={index}>
                      {[...Array(6)].map((__, i) => (
                        <TableCell key={i} className="!py-2">
                          <Skeleton className="h-4 w-[80px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : transactions.length > 0 ? (
                  transactions.map(t => (
                    <TableRow key={t.id} className="border-b">
                      <TableCell className="px-1 py-2 border-r">
                        {formatDate(t.date) || formatDate(t.createdAt)}
                      </TableCell>
                      <TableCell className="px-1 py-2 border-r">
                        {t.lable || "—"}
                      </TableCell>
                      <TableCell className="px-1 py-2 border-r">
                        {t.description || "—"}
                      </TableCell>
                      <TableCell className="px-1 py-2 border-r">
                        {t.compte || "—"}
                      </TableCell>
                      <TableCell className="px-1 py-2 border-r">
                        {methodeLabel(t.methodePaiement)}
                      </TableCell>
                      <TableCell className="px-1 py-2 text-right pr-4 font-medium text-red-600">
                        {formatCurrency(t.montant)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      Aucune charge trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter className="bg-gray-50">
                <TableRow className="border-b">
                  <TableCell
                    colSpan={5}
                    className="text-lg font-semibold p-2 border-r"
                  >
                    Total :
                  </TableCell>
                  <TableCell className="text-right text-lg font-semibold p-2 text-red-600">
                    {formatCurrency(totalMontant)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <div className="flex justify-end gap-3 mt-6 print:hidden">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="rounded-full"
            >
              Retour
            </Button>
            <Button
              className="bg-purple-500 hover:bg-purple-600 !text-white rounded-full"
              variant="outline"
              onClick={() => {
                const data = {
                  transactions,
                  typeDepense,
                  titre,
                  periode,
                  from,
                  to,
                  totalMontant,
                };
                localStorage.setItem(
                  "charges-rapport",
                  JSON.stringify(data)
                );
                window.open(
                  "/transactions/impressionRapportCharges",
                  "_blank"
                );
              }}
            >
              Imprimer
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export default function TransactionsRapportDialog() {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState(null);

  useEffect(() => {
    if (!open) {
      setReportType(null);
    }
  }, [open]);

  const handleClose = () => {
    setOpen(false);
    setReportType(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 hover:bg-purple-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 rounded-full">
          <FileText className="mr-2 h-4 w-4" />
          Rapports
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] max-h-[80vh] overflow-y-auto">
        {!reportType && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-fuchsia-600 to-violet-600 bg-clip-text text-transparent">
                <FileText className="h-5 w-5 text-purple-600" />
                Choisir le type de rapport
              </DialogTitle>
              <DialogDescription>
                Sélectionnez le rapport que vous souhaitez générer.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
              {REPORT_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setReportType(type.id)}
                    className="flex flex-col items-start gap-3 rounded-xl border border-purple-100 bg-white p-5 text-left shadow-sm transition hover:border-purple-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {type.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {type.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="rounded-full"
              >
                Annuler
              </Button>
            </div>
          </>
        )}

        {reportType === "comptes" && (
          <ComptesRapportContent
            embedded
            onBack={() => setReportType(null)}
            onClose={handleClose}
          />
        )}

        {reportType === "charges-fixes" && (
          <ChargesRapportContent
            typeDepense="fixe"
            onBack={() => setReportType(null)}
            onClose={handleClose}
          />
        )}

        {reportType === "charges-variantes" && (
          <ChargesRapportContent
            typeDepense="variante"
            onBack={() => setReportType(null)}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
